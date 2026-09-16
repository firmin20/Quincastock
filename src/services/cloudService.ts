import { supabase, isSupabaseConfigured, getSupabaseConfig } from '../lib/supabase';
import { Product, Movement, UserProfile, AdminClient, AdminActivationRecord, AdminActivityEvent, AdminDashboardStats } from '../types';
import { VALID_PRO_CODES } from '../utils/formatters';
import { getSupabaseProjectRef } from '../lib/schemaSql';
import { ADMIN_CONFIG, checkIsAdmin } from '../config/adminConfig';

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    profile: UserProfile;
  };
  needsEmailConfirmation?: boolean;
  error?: string;
  message?: string;
}

export interface ProActivationResponse {
  success: boolean;
  status: 'SUCCESS' | 'ALREADY_PRO' | 'ALREADY_USED' | 'INVALID_CODE' | 'ERROR';
  message: string;
}

export interface SupabaseHealthReport {
  isConfigured: boolean;
  url: string;
  projectRef: string;
  tables: {
    profiles: boolean;
    products: boolean;
    movements: boolean;
    pro_codes: boolean;
  };
  proCodesCount: number;
  allTablesExist: boolean;
  error?: string;
}

export const cloudService = {
  // ==========================================
  // DIAGNOSTIC DE CONNEXION SUPABASE
  // ==========================================

  async checkHealth(): Promise<SupabaseHealthReport> {
    const config = getSupabaseConfig();
    const projectRef = getSupabaseProjectRef(config.url);

    if (!config.configured || !supabase) {
      return {
        isConfigured: false,
        url: config.url,
        projectRef,
        tables: { profiles: false, products: false, movements: false, pro_codes: false },
        proCodesCount: 0,
        allTablesExist: false,
        error: 'Configuration Supabase manquante.',
      };
    }

    const tablesStatus = {
      profiles: false,
      products: false,
      movements: false,
      pro_codes: false,
    };
    let proCodesCount = 0;

    // Helper direct pour vérifier l'existence réelle d'une table auprès de l'API Supabase
    // Aucune utilisation de localStorage : interroge directement Supabase
    const checkTable = async (tableName: string): Promise<boolean> => {
      try {
        const { error, status } = await supabase.from(tableName).select('id').limit(1);

        // Code 200 ou requête acceptée -> Table existe et accessible
        if (!error) return true;

        // Erreur 42501 (PostgreSQL permission denied) ou 401/403 (RLS policy active)
        // prouve de façon catégorique que la table existe dans le schéma PostgREST/PostgreSQL
        if (
          error.code === '42501' ||
          error.message?.toLowerCase().includes('permission denied') ||
          error.message?.toLowerCase().includes('violates row-level') ||
          status === 401 ||
          status === 403
        ) {
          return true;
        }

        // Table absente du schéma PostgREST (PGRST205) ou PostgreSQL (42P01)
        if (
          error.code === 'PGRST205' ||
          error.code === '42P01' ||
          error.message?.includes('Could not find the table') ||
          error.message?.includes('does not exist') ||
          status === 404
        ) {
          return false;
        }

        // Pour toute autre erreur non liée à l'absence de table, la table existe
        return true;
      } catch (err) {
        console.warn(`Erreur lors du test direct de la table ${tableName}:`, err);
        return false;
      }
    };

    try {
      // Test direct et parallèle des 4 tables dans Supabase
      const [pExists, prExists, mExists, proRes] = await Promise.all([
        checkTable('profiles'),
        checkTable('products'),
        checkTable('movements'),
        supabase.from('pro_codes').select('id'),
      ]);

      tablesStatus.profiles = pExists;
      tablesStatus.products = prExists;
      tablesStatus.movements = mExists;

      if (!proRes.error && Array.isArray(proRes.data)) {
        tablesStatus.pro_codes = true;
        proCodesCount = proRes.data.length;
      } else if (proRes.error) {
        // pro_codes est accessible en lecture publique ou avec code RLS
        tablesStatus.pro_codes =
          proRes.error.code !== 'PGRST205' &&
          proRes.error.code !== '42P01' &&
          !proRes.error.message?.includes('Could not find the table');
      }
    } catch (err: any) {
      console.warn('Erreur lors du test des tables Supabase:', err);
    }

    const allTablesExist =
      tablesStatus.profiles &&
      tablesStatus.products &&
      tablesStatus.movements &&
      tablesStatus.pro_codes;

    return {
      isConfigured: true,
      url: config.url,
      projectRef,
      tables: tablesStatus,
      proCodesCount,
      allTablesExist,
    };
  },

  // ==========================================
  // AUTHENTIFICATION SUPABASE
  // ==========================================

  async signUp(params: {
    businessName: string;
    ownerName: string;
    phone: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const email = params.email.trim().toLowerCase();
    const businessName = params.businessName.trim() || 'Ma Quincaillerie';
    const ownerName = params.ownerName.trim() || 'Responsable';
    const phone = params.phone.trim();

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: params.password,
          options: {
            data: {
              business_name: businessName,
              owner_name: ownerName,
              phone,
            },
          },
        });

        if (error) {
          if (error.status === 429 || (error as any).code === 'over_email_send_rate_limit') {
            return {
              success: false,
              error:
                'Limite d\'envoi d\'emails de Supabase atteinte. Pour supprimer cette limite, désactivez "Confirm email" dans Supabase (Authentication -> Providers -> Email).',
            };
          }
          if (error.message.includes('invalid') && error.message.includes('Email')) {
            return {
              success: false,
              error: 'Veuillez saisir une adresse email valide (ex: contact@votre-quincaillerie.com).',
            };
          }
          return { success: false, error: error.message };
        }

        if (!data.user) {
          return { success: false, error: 'Échec de la création du compte dans Supabase.' };
        }

        const profile: UserProfile = {
          id: data.user.id,
          userId: data.user.id,
          businessName,
          ownerName,
          phone,
          email,
          isPro: false,
          createdAt: new Date().toISOString(),
        };

        // Try inserting profile if trigger didn't handle it
        try {
          await supabase.from('profiles').upsert(
            {
              user_id: data.user.id,
              business_name: businessName,
              owner_name: ownerName,
              phone,
              email,
              is_pro: false,
            },
            { onConflict: 'user_id' }
          );
        } catch (profileErr) {
          console.warn('Upsert profile post-signup note:', profileErr);
        }

        // If email confirmation is required by Supabase project
        if (!data.session) {
          return {
            success: true,
            needsEmailConfirmation: true,
            user: {
              id: data.user.id,
              email,
              profile,
            },
            message:
              'Compte créé dans Supabase ! Veuillez vérifier votre boîte email pour confirmer votre compte, ou désactivez "Confirm email" dans Supabase pour vous connecter instantanément.',
          };
        }

        return {
          success: true,
          user: {
            id: data.user.id,
            email,
            profile,
          },
          message: 'Compte créé avec succès dans Supabase !',
        };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Erreur lors de l\'inscription Supabase.' };
      }
    }

    return {
      success: false,
      error: 'Supabase n\'est pas configuré. Veuillez vérifier VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.',
    };
  },

  async signIn(emailInput: string, passwordInput: string): Promise<AuthResponse> {
    const email = emailInput.trim().toLowerCase();

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: passwordInput,
        });

        if (error) {
          if (error.message === 'Email not confirmed' || (error as any).code === 'email_not_confirmed') {
            return {
              success: false,
              needsEmailConfirmation: true,
              error:
                'Votre adresse e-mail n\'a pas encore été confirmée. Veuillez cliquer sur le lien reçu par e-mail, ou désactivez l\'option "Confirm email" dans votre projet Supabase (Authentication -> Providers -> Email) pour autoriser la connexion directe.',
            };
          }
          if (error.message.toLowerCase().includes('invalid login credentials')) {
            return {
              success: false,
              error: 'Adresse email ou mot de passe incorrect.',
            };
          }
          return { success: false, error: error.message };
        }

        if (!data.user) {
          return { success: false, error: 'Utilisateur non trouvé dans Supabase.' };
        }

        // Fetch user profile from Supabase
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .maybeSingle();

        const userEmail = profileData?.email || data.user.email || email;
        const isAdmin =
          profileData?.role === 'admin' ||
          (ADMIN_CONFIG.ADMIN_USER_ID && data.user.id.toLowerCase() === ADMIN_CONFIG.ADMIN_USER_ID.toLowerCase()) ||
          (userEmail && ADMIN_CONFIG.ADMIN_EMAIL && userEmail.toLowerCase() === ADMIN_CONFIG.ADMIN_EMAIL.toLowerCase());

        const profile: UserProfile = {
          id: profileData?.id || data.user.id,
          userId: data.user.id,
          businessName:
            profileData?.business_name ||
            data.user.user_metadata?.business_name ||
            'Ma Quincaillerie',
          ownerName:
            profileData?.owner_name ||
            data.user.user_metadata?.owner_name ||
            'Responsable',
          phone: profileData?.phone || data.user.user_metadata?.phone || '',
          email: userEmail,
          isPro: Boolean(profileData?.is_pro),
          role: isAdmin ? 'admin' : (profileData?.role || 'user'),
          proActivatedAt: profileData?.pro_activated_at || null,
          proCodeUsed: profileData?.pro_code_used || null,
          lastActivityAt: profileData?.last_activity_at || new Date().toISOString(),
          createdAt: profileData?.created_at || new Date().toISOString(),
        };

        // Enregistrer la dernière activité de manière transparente
        this.recordActivity(data.user.id);

        return {
          success: true,
          user: {
            id: data.user.id,
            email,
            profile,
          },
        };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Erreur lors de la connexion.' };
      }
    }

    return {
      success: false,
      error: 'Supabase n\'est pas configuré. Veuillez vérifier VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.',
    };
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Erreur signOut Supabase:', err);
      }
    }
  },

  async getCurrentSessionUser(): Promise<AuthResponse | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.user) return null;

        const user = sessionData.session.user;

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        const userEmail = profileData?.email || user.email || '';
        const isAdmin =
          profileData?.role === 'admin' ||
          (ADMIN_CONFIG.ADMIN_USER_ID && user.id.toLowerCase() === ADMIN_CONFIG.ADMIN_USER_ID.toLowerCase()) ||
          (userEmail && ADMIN_CONFIG.ADMIN_EMAIL && userEmail.toLowerCase() === ADMIN_CONFIG.ADMIN_EMAIL.toLowerCase());

        const profile: UserProfile = {
          id: profileData?.id || user.id,
          userId: user.id,
          businessName:
            profileData?.business_name ||
            user.user_metadata?.business_name ||
            'Ma Quincaillerie',
          ownerName:
            profileData?.owner_name ||
            user.user_metadata?.owner_name ||
            'Responsable',
          phone: profileData?.phone || user.user_metadata?.phone || '',
          email: userEmail,
          isPro: Boolean(profileData?.is_pro),
          role: isAdmin ? 'admin' : (profileData?.role || 'user'),
          proActivatedAt: profileData?.pro_activated_at || null,
          proCodeUsed: profileData?.pro_code_used || null,
          lastActivityAt: profileData?.last_activity_at || new Date().toISOString(),
          createdAt: profileData?.created_at || new Date().toISOString(),
        };

        // Enregistrer la dernière activité
        this.recordActivity(user.id);

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email || '',
            profile,
          },
        };
      } catch (err) {
        console.error('Erreur getCurrentSessionUser:', err);
        return null;
      }
    }

    return null;
  },

  async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/?type=recovery`,
        });
        if (error) {
          return { success: false, message: error.message };
        }
        return {
          success: true,
          message: 'Un lien de réinitialisation sécurisé a été envoyé à votre adresse e-mail.',
        };
      } catch (err: any) {
        return { success: false, message: err.message || 'Erreur réinitialisation.' };
      }
    }
    return { success: false, message: 'Supabase n\'est pas configuré.' };
  },

  async updatePassword(newPassword: string): Promise<{ success: boolean; message: string }> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          return { success: false, message: error.message };
        }
        return { success: true, message: 'Mot de passe mis à jour avec succès !' };
      } catch (err: any) {
        return { success: false, message: err.message || 'Erreur mise à jour mot de passe.' };
      }
    }
    return { success: false, message: 'Supabase n\'est pas configuré.' };
  },

  // ==========================================
  // PRODUITS (SUPABASE CLOUD)
  // ==========================================

  async fetchProducts(userId: string): Promise<{ products: Product[]; error?: string }> {
    if (!userId) return { products: [] };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erreur fetchProducts Supabase:', error);
          if (error.code === 'PGRST205') {
            return {
              products: [],
              error: 'La table "products" n\'a pas encore été créée dans votre projet Supabase.',
            };
          }
          return { products: [], error: error.message };
        }

        const products: Product[] = (data || []).map((row) => ({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          category: row.category,
          unitPrice: Number(row.unit_price) || 0,
          quantity: Number(row.quantity) || 0,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));

        return { products };
      } catch (err: any) {
        console.error('Exception fetchProducts Supabase:', err);
        return { products: [], error: err?.message };
      }
    }

    return { products: [], error: 'Supabase non configuré.' };
  },

  async saveProduct(userId: string, product: Product): Promise<{ success: boolean; error?: string }> {
    if (!userId) return { success: false, error: 'Utilisateur non identifié.' };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('products').upsert(
          {
            id: product.id,
            user_id: userId,
            name: product.name,
            category: product.category,
            unit_price: product.unitPrice,
            quantity: product.quantity,
            created_at: product.createdAt,
            updated_at: product.updatedAt,
          },
          { onConflict: 'id' }
        );

        if (error) {
          console.error('Erreur saveProduct Supabase:', error);
          if (error.code === 'PGRST205') {
            return {
              success: false,
              error: 'Table "products" introuvable dans Supabase. Veuillez exécuter le schéma SQL.',
            };
          }
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (err: any) {
        console.error('Exception saveProduct Supabase:', err);
        return { success: false, error: err?.message || 'Erreur enregistrement produit.' };
      }
    }

    return { success: false, error: 'Supabase non configuré.' };
  },

  async deleteProduct(userId: string, productId: string): Promise<{ success: boolean; error?: string }> {
    if (!userId || !productId) return { success: false, error: 'Identifiants invalides.' };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId)
          .eq('user_id', userId);

        if (error) {
          console.error('Erreur deleteProduct Supabase:', error);
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (err: any) {
        console.error('Exception deleteProduct Supabase:', err);
        return { success: false, error: err?.message };
      }
    }

    return { success: false, error: 'Supabase non configuré.' };
  },

  // ==========================================
  // MOUVEMENTS (SUPABASE CLOUD)
  // ==========================================

  async fetchMovements(userId: string): Promise<{ movements: Movement[]; error?: string }> {
    if (!userId) return { movements: [] };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('movements')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erreur fetchMovements Supabase:', error);
          if (error.code === 'PGRST205') {
            return {
              movements: [],
              error: 'La table "movements" n\'a pas encore été créée dans votre projet Supabase.',
            };
          }
          return { movements: [], error: error.message };
        }

        const movements: Movement[] = (data || []).map((row) => ({
          id: row.id,
          userId: row.user_id,
          timestamp: row.created_at,
          type: row.type as 'ACHAT' | 'VENTE',
          productName: row.product_name,
          productId: row.product_id,
          quantity: Number(row.quantity) || 0,
          stockAfter: Number(row.stock_after) || 0,
          unitPrice: Number(row.unit_price) || 0,
        }));

        return { movements };
      } catch (err: any) {
        console.error('Exception fetchMovements Supabase:', err);
        return { movements: [], error: err?.message };
      }
    }

    return { movements: [], error: 'Supabase non configuré.' };
  },

  async saveMovement(userId: string, movement: Movement): Promise<{ success: boolean; error?: string }> {
    if (!userId) return { success: false, error: 'Utilisateur non identifié.' };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('movements').insert({
          id: movement.id,
          user_id: userId,
          product_id: movement.productId || null,
          product_name: movement.productName,
          type: movement.type,
          quantity: movement.quantity,
          stock_after: movement.stockAfter,
          unit_price: movement.unitPrice || 0,
          created_at: movement.timestamp || new Date().toISOString(),
        });

        if (error) {
          console.error('Erreur saveMovement Supabase:', error);
          if (error.code === 'PGRST205') {
            return {
              success: false,
              error: 'Table "movements" introuvable dans Supabase. Veuillez exécuter le schéma SQL.',
            };
          }
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (err: any) {
        console.error('Exception saveMovement Supabase:', err);
        return { success: false, error: err?.message };
      }
    }

    return { success: false, error: 'Supabase non configuré.' };
  },

  // ==========================================
  // ACTIVATION CODE PRO SÉCURISÉE & ATOMIQUE
  // ==========================================

  async activateProCode(userId: string, inputCode: string): Promise<ProActivationResponse> {
    if (!userId) {
      return {
        success: false,
        status: 'ERROR',
        message: 'Vous devez être connecté pour activer un code PRO.',
      };
    }

    const cleanCode = (inputCode || '').trim().toUpperCase();

    if (isSupabaseConfigured() && supabase) {
      try {
        // 1. First attempt: Atomic RPC function
        const { data, error } = await supabase.rpc('activate_pro_code', {
          p_code: cleanCode,
        });

        if (!error && data) {
          return {
            success: Boolean(data.success),
            status: data.status,
            message: data.message,
          };
        }

        // 2. Fallback: Table-level verification with atomic update
        // Check if user is already PRO
        const { data: profileData } = await supabase
          .from('profiles')
          .select('is_pro, business_name, owner_name, phone, email')
          .eq('user_id', userId)
          .maybeSingle();

        if (profileData?.is_pro) {
          return {
            success: false,
            status: 'ALREADY_PRO',
            message: '⭐ Votre compte QuincaStock PRO est déjà activé.',
          };
        }

        // Check if code exists in pro_codes
        const { data: codeRecord, error: codeErr } = await supabase
          .from('pro_codes')
          .select('*')
          .eq('code', cleanCode)
          .maybeSingle();

        if (codeErr || !codeRecord) {
          return {
            success: false,
            status: 'INVALID_CODE',
            message: '❌ Code PRO invalide.',
          };
        }

        // Check if already used
        if (codeRecord.is_used) {
          return {
            success: false,
            status: 'ALREADY_USED',
            message: '❌ Ce code PRO a déjà été utilisé.',
          };
        }

        // Mark code used atomically
        const { error: updateCodeErr } = await supabase
          .from('pro_codes')
          .update({
            is_used: true,
            used_by: userId,
            used_at: new Date().toISOString(),
          })
          .eq('id', codeRecord.id)
          .eq('is_used', false);

        if (updateCodeErr) {
          return {
            success: false,
            status: 'ERROR',
            message: 'Erreur lors de la validation du code.',
          };
        }

        // Update profile to PRO with activation date and code used
        const nowIso = new Date().toISOString();
        await supabase
          .from('profiles')
          .update({
            is_pro: true,
            pro_activated_at: nowIso,
            pro_code_used: cleanCode,
            last_activity_at: nowIso,
          })
          .eq('user_id', userId);

        // Record in pro_activations table
        try {
          await supabase.from('pro_activations').insert({
            user_id: userId,
            business_name: profileData?.business_name || '',
            owner_name: profileData?.owner_name || '',
            phone: profileData?.phone || '',
            email: profileData?.email || '',
            code: cleanCode,
            activated_at: nowIso,
          });
        } catch (actErr) {
          console.warn('Note insertion pro_activations:', actErr);
        }

        return {
          success: true,
          status: 'SUCCESS',
          message: '🎉 Félicitations ! Votre compte QuincaStock PRO est maintenant activé.',
        };
      } catch (err: any) {
        return {
          success: false,
          status: 'ERROR',
          message: err?.message || 'Erreur lors de l\'activation du code.',
        };
      }
    }

    return {
      success: false,
      status: 'ERROR',
      message: 'Supabase n\'est pas connecté.',
    };
  },

  // ==========================================
  // SUIVI DE L'ACTIVITÉ UTILISATEUR
  // ==========================================

  async recordActivity(userId: string): Promise<void> {
    if (!userId || !isSupabaseConfigured() || !supabase) return;
    try {
      await supabase
        .from('profiles')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('user_id', userId);
    } catch {
      // Non-bloquant
    }
  },

  // ==========================================
  // ESPACE ADMINISTRATEUR (ADN STUDIO NUMÉRIQUE)
  // ==========================================

  async fetchAdminDashboardStats(): Promise<{
    stats: AdminDashboardStats;
    error?: string;
    needsSqlMigration?: boolean;
  }> {
    const defaultStats: AdminDashboardStats = {
      totalUsers: 0,
      freeUsers: 0,
      proUsers: 0,
      conversionRate: 0,
      totalProducts: 0,
      activeQuincailleries: 0,
      totalActivations: 0,
      estimatedRevenue: 0,
      newUsersThisWeek: 0,
    };

    if (!isSupabaseConfigured() || !supabase) {
      return { stats: defaultStats, error: 'Supabase n\'est pas connecté.' };
    }

    try {
      // 1. Tenter la fonction RPC PostgreSQL si installée
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('get_admin_overview');
        if (!rpcErr && rpcData && typeof rpcData === 'object') {
          const stats: AdminDashboardStats = {
            totalUsers: Number(rpcData.total_users) || 0,
            freeUsers: Number(rpcData.free_users) || 0,
            proUsers: Number(rpcData.pro_users) || 0,
            conversionRate: Number(rpcData.conversion_rate) || 0,
            totalProducts: Number(rpcData.total_products) || 0,
            activeQuincailleries: Number(rpcData.active_quincailleries) || 0,
            totalActivations: Number(rpcData.total_activations) || 0,
            estimatedRevenue: Number(rpcData.estimated_revenue) || 0,
            newUsersThisWeek: Number(rpcData.new_users_this_week) || 0,
          };
          return { stats };
        }
      } catch {
        // En cas d'absence de la RPC, requêtage direct
      }

      // 2. Requêtage direct des tables avec les permissions admin
      const [profilesRes, productsRes, movementsRes, proCodesRes, activationsRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('products').select('id, user_id, unit_price, quantity'),
        supabase.from('movements').select('id, user_id, type'),
        supabase.from('pro_codes').select('*'),
        supabase.from('pro_activations').select('*').order('activated_at', { ascending: false }),
      ]);

      if (profilesRes.error) {
        if (profilesRes.error.code === '42501' || profilesRes.error.message.includes('permission denied')) {
          return {
            stats: defaultStats,
            needsSqlMigration: true,
            error: 'Les permissions Administrateur Supabase ne sont pas encore appliquées dans votre base. Exécutez le script SQL fourni dans votre éditeur Supabase.',
          };
        }
      }

      const profiles = profilesRes.data || [];
      const products = productsRes.data || [];
      const movements = movementsRes.data || [];
      const proCodes = proCodesRes.data || [];
      const proActivations = activationsRes.data || [];

      const totalUsers = profiles.length;
      const proUsers = profiles.filter((p) => p.is_pro).length;
      const freeUsers = Math.max(0, totalUsers - proUsers);
      const conversionRate = totalUsers > 0 ? Number(((proUsers / totalUsers) * 100).toFixed(1)) : 0;
      const totalProducts = products.length;

      // Quincailleries actives : ayant au moins 1 produit ou 1 mouvement
      const activeUserSet = new Set<string>();
      products.forEach((p) => p.user_id && activeUserSet.add(p.user_id));
      movements.forEach((m) => m.user_id && activeUserSet.add(m.user_id));
      const activeQuincailleries = activeUserSet.size;

      // Activations totales
      const usedCodesCount = proCodes.filter((c) => c.is_used).length;
      const totalActivations = Math.max(usedCodesCount, proActivations.length, proUsers);
      const estimatedRevenue = proUsers * ADMIN_CONFIG.PRO_PRICE_FCFA;

      // Nouveaux inscrits ces 7 derniers jours
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const newUsersThisWeek = profiles.filter((p) => p.created_at && p.created_at >= sevenDaysAgo).length;

      return {
        stats: {
          totalUsers,
          freeUsers,
          proUsers,
          conversionRate,
          totalProducts,
          activeQuincailleries,
          totalActivations,
          estimatedRevenue,
          newUsersThisWeek,
        },
      };
    } catch (err: any) {
      console.error('Erreur fetchAdminDashboardStats:', err);
      return {
        stats: defaultStats,
        error: err?.message || 'Erreur lors de la récupération des statistiques.',
      };
    }
  },

  async fetchAdminClients(): Promise<{
    clients: AdminClient[];
    error?: string;
    needsSqlMigration?: boolean;
  }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { clients: [], error: 'Supabase n\'est pas connecté.' };
    }

    try {
      const [profilesRes, productsRes, movementsRes, proCodesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('id, user_id, unit_price, quantity'),
        supabase.from('movements').select('id, user_id, type, quantity'),
        supabase.from('pro_codes').select('*'),
      ]);

      if (profilesRes.error) {
        if (profilesRes.error.code === '42501' || profilesRes.error.message.includes('permission denied')) {
          return {
            clients: [],
            needsSqlMigration: true,
            error: 'Permissions Supabase insuffisantes. Exécutez le script SQL Administrateur dans Supabase.',
          };
        }
        return { clients: [], error: profilesRes.error.message };
      }

      const profiles = profilesRes.data || [];
      const products = productsRes.data || [];
      const movements = movementsRes.data || [];
      const proCodes = proCodesRes.data || [];

      // Carte des codes PRO utilisés
      const userToCodeMap = new Map<string, { code: string; usedAt?: string }>();
      proCodes.forEach((c) => {
        if (c.is_used && c.used_by) {
          userToCodeMap.set(c.used_by, { code: c.code, usedAt: c.used_at });
        }
      });

      const clients: AdminClient[] = profiles.map((p) => {
        const userProducts = products.filter((pr) => pr.user_id === p.user_id);
        const userMovements = movements.filter((m) => m.user_id === p.user_id);

        const productCount = userProducts.length;
        const totalStockValue = userProducts.reduce(
          (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
          0
        );
        const entryCount = userMovements.filter((m) => m.type === 'ACHAT').length;
        const saleCount = userMovements.filter((m) => m.type === 'VENTE').length;

        const codeInfo = userToCodeMap.get(p.user_id);

        return {
          id: p.id,
          userId: p.user_id,
          businessName: p.business_name || 'Ma Quincaillerie',
          ownerName: p.owner_name || 'Responsable',
          phone: p.phone || '',
          email: p.email || '',
          isPro: Boolean(p.is_pro),
          role: (p.role as 'user' | 'admin') || (p.email === ADMIN_CONFIG.ADMIN_EMAIL ? 'admin' : 'user'),
          createdAt: p.created_at || new Date().toISOString(),
          proActivatedAt: p.pro_activated_at || codeInfo?.usedAt || null,
          proCodeUsed: p.pro_code_used || codeInfo?.code || null,
          lastActivityAt: p.last_activity_at || null,
          productCount,
          totalStockValue,
          entryCount,
          saleCount,
        };
      });

      return { clients };
    } catch (err: any) {
      return { clients: [], error: err?.message || 'Erreur lors du chargement des clients.' };
    }
  },

  async fetchAdminActivations(): Promise<{
    activations: AdminActivationRecord[];
    error?: string;
  }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { activations: [], error: 'Supabase n\'est pas connecté.' };
    }

    try {
      // 1. Table pro_activations
      const { data: actData } = await supabase
        .from('pro_activations')
        .select('*')
        .order('activated_at', { ascending: false });

      if (actData && actData.length > 0) {
        const activations: AdminActivationRecord[] = actData.map((row) => ({
          id: row.id,
          userId: row.user_id,
          businessName: row.business_name,
          ownerName: row.owner_name,
          phone: row.phone,
          email: row.email,
          code: row.code,
          activatedAt: row.activated_at,
          createdAt: row.created_at,
          status: 'Activé',
        }));
        return { activations };
      }

      // 2. Fallback: pro_codes où is_used = true combiné avec profiles
      const [codesRes, profilesRes] = await Promise.all([
        supabase.from('pro_codes').select('*').eq('is_used', true).order('used_at', { ascending: false }),
        supabase.from('profiles').select('*'),
      ]);

      const usedCodes = codesRes.data || [];
      const profiles = profilesRes.data || [];
      const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

      const activations: AdminActivationRecord[] = usedCodes.map((c) => {
        const p = c.used_by ? profileMap.get(c.used_by) : null;
        return {
          id: c.id,
          userId: c.used_by,
          businessName: p?.business_name || 'Quincaillerie',
          ownerName: p?.owner_name || 'Client',
          phone: p?.phone || '',
          email: p?.email || '',
          code: c.code,
          activatedAt: c.used_at || c.created_at,
          createdAt: c.created_at,
          status: 'Activé',
        };
      });

      return { activations };
    } catch (err: any) {
      return { activations: [], error: err?.message || 'Erreur chargement des activations.' };
    }
  },

  async fetchAdminActivity(): Promise<{
    events: AdminActivityEvent[];
    error?: string;
  }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { events: [], error: 'Supabase n\'est pas connecté.' };
    }

    try {
      const [profilesRes, movementsRes, activationsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('movements').select('*').order('created_at', { ascending: false }).limit(30),
        supabase.from('pro_codes').select('*').eq('is_used', true).order('used_at', { ascending: false }).limit(15),
      ]);

      const profiles = profilesRes.data || [];
      const movements = movementsRes.data || [];
      const activations = activationsRes.data || [];
      const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

      const events: AdminActivityEvent[] = [];

      // 1. Inscriptions
      profiles.forEach((p) => {
        if (p.created_at) {
          events.push({
            id: `signup-${p.id}`,
            type: 'INSCRIPTION',
            title: `Nouvelle inscription : ${p.owner_name || 'Un marchand'}`,
            description: `${p.business_name || 'Quincaillerie'} s'est inscrit avec l'email ${p.email || 'non renseigné'}.`,
            timestamp: p.created_at,
            userName: p.owner_name,
            businessName: p.business_name,
          });
        }
      });

      // 2. Activations PRO
      activations.forEach((a) => {
        const p = a.used_by ? profileMap.get(a.used_by) : null;
        const time = a.used_at || a.created_at;
        if (time) {
          events.push({
            id: `pro-${a.id}`,
            type: 'ACTIVATION_PRO',
            title: `Activation PRO : ${p?.business_name || 'Quincaillerie'}`,
            description: `${p?.owner_name || 'Le responsable'} est passé en version PRO avec le code ${a.code}.`,
            timestamp: time,
            userName: p?.owner_name,
            businessName: p?.business_name,
          });
        }
      });

      // 3. Mouvements de stock
      movements.forEach((m) => {
        const p = m.user_id ? profileMap.get(m.user_id) : null;
        if (m.type === 'VENTE') {
          events.push({
            id: `mov-${m.id}`,
            type: 'VENTE',
            title: `Vente : ${m.quantity}x ${m.product_name}`,
            description: `${p?.business_name || 'Une quincaillerie'} a enregistré une vente (Stock restant : ${m.stock_after}).`,
            timestamp: m.created_at,
            userName: p?.owner_name,
            businessName: p?.business_name,
          });
        } else {
          events.push({
            id: `mov-${m.id}`,
            type: 'ENTREE_STOCK',
            title: `Entrée de stock : +${m.quantity} ${m.product_name}`,
            description: `${p?.business_name || 'Une quincaillerie'} a approvisionné son stock.`,
            timestamp: m.created_at,
            userName: p?.owner_name,
            businessName: p?.business_name,
          });
        }
      });

      // Tri chronologique décroissant (le plus récent en premier)
      events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return { events: events.slice(0, 40) };
    } catch (err: any) {
      return { events: [], error: err?.message || 'Erreur récupération activité.' };
    }
  },

  async fetchClientDetail(userId: string): Promise<{
    client: AdminClient | null;
    products: Product[];
    movements: Movement[];
    error?: string;
  }> {
    if (!userId || !isSupabaseConfigured() || !supabase) {
      return { client: null, products: [], movements: [], error: 'Paramètres invalides.' };
    }

    try {
      const [profileRes, productsRes, movementsRes, proCodeRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('products').select('*').eq('user_id', userId).order('name', { ascending: true }),
        supabase.from('movements').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('pro_codes').select('*').eq('used_by', userId).maybeSingle(),
      ]);

      if (profileRes.error) {
        return { client: null, products: [], movements: [], error: profileRes.error.message };
      }

      const p = profileRes.data;
      if (!p) {
        return { client: null, products: [], movements: [], error: 'Client introuvable.' };
      }

      const rawProducts = productsRes.data || [];
      const rawMovements = movementsRes.data || [];

      const products: Product[] = rawProducts.map((row) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        category: row.category,
        unitPrice: Number(row.unit_price) || 0,
        quantity: Number(row.quantity) || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      const movements: Movement[] = rawMovements.map((row) => ({
        id: row.id,
        userId: row.user_id,
        timestamp: row.created_at,
        type: row.type as 'ACHAT' | 'VENTE',
        productName: row.product_name,
        productId: row.product_id,
        quantity: Number(row.quantity) || 0,
        stockAfter: Number(row.stock_after) || 0,
        unitPrice: Number(row.unit_price) || 0,
      }));

      const totalStockValue = products.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const entryCount = movements.filter((m) => m.type === 'ACHAT').length;
      const saleCount = movements.filter((m) => m.type === 'VENTE').length;

      const client: AdminClient = {
        id: p.id,
        userId: p.user_id,
        businessName: p.business_name || 'Ma Quincaillerie',
        ownerName: p.owner_name || 'Responsable',
        phone: p.phone || '',
        email: p.email || '',
        isPro: Boolean(p.is_pro),
        role: (p.role as 'user' | 'admin') || 'user',
        createdAt: p.created_at || new Date().toISOString(),
        proActivatedAt: p.pro_activated_at || proCodeRes.data?.used_at || null,
        proCodeUsed: p.pro_code_used || proCodeRes.data?.code || null,
        lastActivityAt: p.last_activity_at || null,
        productCount: products.length,
        totalStockValue,
        entryCount,
        saleCount,
      };

      return { client, products, movements };
    } catch (err: any) {
      return { client: null, products: [], movements: [], error: err?.message };
    }
  },

  exportClientsToCsv(clients: AdminClient[], onlyPro: boolean = false): void {
    const filtered = onlyPro ? clients.filter((c) => c.isPro) : clients;

    const headers = [
      'Quincaillerie',
      'Responsable',
      'Téléphone',
      'Email',
      'Statut',
      'Date inscription',
      'Date activation PRO',
      'Code PRO',
      'Nb Produits',
      'Valeur Stock (FCFA)',
      'Dernière activité',
    ];

    const rows = filtered.map((c) => [
      `"${(c.businessName || '').replace(/"/g, '""')}"`,
      `"${(c.ownerName || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${c.isPro ? 'PRO' : 'GRATUIT'}"`,
      `"${c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-FR') : ''}"`,
      `"${c.proActivatedAt ? new Date(c.proActivatedAt).toLocaleDateString('fr-FR') : ''}"`,
      `"${c.proCodeUsed || ''}"`,
      `"${c.productCount ?? 0}"`,
      `"${c.totalStockValue ?? 0}"`,
      `"${c.lastActivityAt ? new Date(c.lastActivityAt).toLocaleDateString('fr-FR') : ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `QuincaStock_${onlyPro ? 'Clients_PRO' : 'Tous_Clients'}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // ==========================================
  // MIGRATION DES ANCIENNES DONNÉES LOCALES
  // ==========================================

  async migrateLocalDataToCloud(
    userId: string,
    localProducts: Product[],
    localMovements: Movement[]
  ): Promise<{ productsImported: number; movementsImported: number; errors: string[] }> {
    let pCount = 0;
    let mCount = 0;
    const errors: string[] = [];

    for (const p of localProducts) {
      const res = await this.saveProduct(userId, { ...p, userId });
      if (res.success) {
        pCount++;
      } else if (res.error) {
        errors.push(res.error);
      }
    }

    for (const m of localMovements) {
      const res = await this.saveMovement(userId, { ...m, userId });
      if (res.success) {
        mCount++;
      } else if (res.error) {
        errors.push(res.error);
      }
    }

    return { productsImported: pCount, movementsImported: mCount, errors };
  },
};
