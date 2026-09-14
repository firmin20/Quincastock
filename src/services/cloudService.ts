import { supabase, isSupabaseConfigured, getSupabaseConfig } from '../lib/supabase';
import { Product, Movement, UserProfile } from '../types';
import { VALID_PRO_CODES } from '../utils/formatters';
import { getSupabaseProjectRef } from '../lib/schemaSql';

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
          email: profileData?.email || data.user.email || email,
          isPro: Boolean(profileData?.is_pro),
          createdAt: profileData?.created_at || new Date().toISOString(),
        };

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
          email: profileData?.email || user.email || '',
          isPro: Boolean(profileData?.is_pro),
          createdAt: profileData?.created_at || new Date().toISOString(),
        };

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
          .select('is_pro')
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

        // Update profile to PRO
        await supabase
          .from('profiles')
          .update({ is_pro: true })
          .eq('user_id', userId);

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
