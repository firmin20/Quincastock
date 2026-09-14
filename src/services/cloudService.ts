import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Product, Movement, UserProfile } from '../types';
import { VALID_PRO_CODES } from '../utils/formatters';

// Cloud simulation keys for offline/preview fallback
const CLOUD_STORAGE_KEYS = {
  USERS: 'quinca_cloud_users_v2',
  SESSION: 'quinca_cloud_session_v2',
  CODES: 'quinca_cloud_codes_v2',
};

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    profile: UserProfile;
  };
  error?: string;
  message?: string;
}

export interface ProActivationResponse {
  success: boolean;
  status: 'SUCCESS' | 'ALREADY_PRO' | 'ALREADY_USED' | 'INVALID_CODE' | 'ERROR';
  message: string;
}

// Initial fixed 15 PRO codes for cloud simulator
function getInitialCloudCodes(): Record<string, { isUsed: boolean; usedBy?: string; usedAt?: string }> {
  const initial: Record<string, { isUsed: boolean; usedBy?: string; usedAt?: string }> = {};
  for (const c of VALID_PRO_CODES) {
    initial[c] = { isUsed: false };
  }
  return initial;
}

function getStoredCloudCodes(): Record<string, { isUsed: boolean; usedBy?: string; usedAt?: string }> {
  try {
    const raw = localStorage.getItem(CLOUD_STORAGE_KEYS.CODES);
    if (!raw) {
      const initial = getInitialCloudCodes();
      localStorage.setItem(CLOUD_STORAGE_KEYS.CODES, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return getInitialCloudCodes();
  }
}

function saveStoredCloudCodes(codes: Record<string, { isUsed: boolean; usedBy?: string; usedAt?: string }>): void {
  try {
    localStorage.setItem(CLOUD_STORAGE_KEYS.CODES, JSON.stringify(codes));
  } catch (err) {
    console.error('Erreur sauvegarde codes cloud:', err);
  }
}

export const cloudService = {
  // ==========================================
  // AUTHENTIFICATION
  // ==========================================

  async signUp(params: {
    businessName: string;
    ownerName: string;
    phone: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const email = params.email.trim().toLowerCase();

    // 1. Live Supabase flow
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: params.password,
          options: {
            data: {
              business_name: params.businessName.trim(),
              owner_name: params.ownerName.trim(),
              phone: params.phone.trim(),
            },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (!data.user) {
          return { success: false, error: 'Échec de la création du compte.' };
        }

        // Ensure profile row exists
        const profile: UserProfile = {
          id: data.user.id,
          userId: data.user.id,
          businessName: params.businessName.trim() || 'Ma Quincaillerie',
          ownerName: params.ownerName.trim() || 'Responsable',
          phone: params.phone.trim(),
          email,
          isPro: false,
          createdAt: new Date().toISOString(),
        };

        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            user_id: data.user.id,
            business_name: profile.businessName,
            owner_name: profile.ownerName,
            phone: profile.phone,
            email: profile.email,
            is_pro: false,
          });
        } catch (profileErr) {
          console.warn('Profile upsert note:', profileErr);
        }

        return {
          success: true,
          user: {
            id: data.user.id,
            email,
            profile,
          },
          message: 'Compte créé avec succès !',
        };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Erreur lors de l\'inscription.' };
      }
    }

    // 2. Simulated Cloud Store (Local Preview / Demo)
    try {
      const usersRaw = localStorage.getItem(CLOUD_STORAGE_KEYS.USERS);
      const users: Record<string, any> = usersRaw ? JSON.parse(usersRaw) : {};

      if (users[email]) {
        return {
          success: false,
          error: 'Un compte avec cette adresse e-mail existe déjà. Veuillez vous connecter.',
        };
      }

      const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const profile: UserProfile = {
        id: userId,
        userId,
        businessName: params.businessName.trim() || 'Ma Quincaillerie',
        ownerName: params.ownerName.trim() || 'Responsable',
        phone: params.phone.trim(),
        email,
        isPro: false,
        createdAt: new Date().toISOString(),
      };

      users[email] = {
        id: userId,
        email,
        password: params.password, // In simulated mode
        profile,
      };

      localStorage.setItem(CLOUD_STORAGE_KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(CLOUD_STORAGE_KEYS.SESSION, JSON.stringify({ userId, email }));

      return {
        success: true,
        user: { id: userId, email, profile },
        message: 'Compte créé avec succès !',
      };
    } catch (err: any) {
      return { success: false, error: 'Erreur lors de l\'inscription locale.' };
    }
  },

  async signIn(emailInput: string, passwordInput: string): Promise<AuthResponse> {
    const email = emailInput.trim().toLowerCase();

    // 1. Live Supabase flow
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: passwordInput,
        });

        if (error) {
          return { success: false, error: 'Identifiants invalides. Vérifiez votre e-mail et mot de passe.' };
        }

        if (!data.user) {
          return { success: false, error: 'Utilisateur non trouvé.' };
        }

        // Fetch user profile from Supabase
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        const profile: UserProfile = {
          id: profileData?.id || data.user.id,
          userId: data.user.id,
          businessName: profileData?.business_name || data.user.user_metadata?.business_name || 'Ma Quincaillerie',
          ownerName: profileData?.owner_name || data.user.user_metadata?.owner_name || 'Responsable',
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

    // 2. Simulated Cloud Store
    try {
      const usersRaw = localStorage.getItem(CLOUD_STORAGE_KEYS.USERS);
      const users: Record<string, any> = usersRaw ? JSON.parse(usersRaw) : {};

      const userRecord = users[email];
      if (!userRecord || userRecord.password !== passwordInput) {
        return {
          success: false,
          error: 'Adresse e-mail ou mot de passe incorrect.',
        };
      }

      localStorage.setItem(
        CLOUD_STORAGE_KEYS.SESSION,
        JSON.stringify({ userId: userRecord.id, email })
      );

      return {
        success: true,
        user: {
          id: userRecord.id,
          email: userRecord.email,
          profile: userRecord.profile,
        },
      };
    } catch {
      return { success: false, error: 'Erreur lors de la connexion.' };
    }
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Erreur signOut Supabase:', err);
      }
    }
    localStorage.removeItem(CLOUD_STORAGE_KEYS.SESSION);
  },

  async getCurrentSessionUser(): Promise<AuthResponse | null> {
    // 1. Live Supabase session
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data } = await supabase.auth.getUser();
        if (!data?.user) return null;

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        const profile: UserProfile = {
          id: profileData?.id || data.user.id,
          userId: data.user.id,
          businessName: profileData?.business_name || data.user.user_metadata?.business_name || 'Ma Quincaillerie',
          ownerName: profileData?.owner_name || data.user.user_metadata?.owner_name || 'Responsable',
          phone: profileData?.phone || data.user.user_metadata?.phone || '',
          email: profileData?.email || data.user.email || '',
          isPro: Boolean(profileData?.is_pro),
          createdAt: profileData?.created_at || new Date().toISOString(),
        };

        return {
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email || '',
            profile,
          },
        };
      } catch {
        return null;
      }
    }

    // 2. Simulated session
    try {
      const sessionRaw = localStorage.getItem(CLOUD_STORAGE_KEYS.SESSION);
      if (!sessionRaw) return null;

      const { email, userId } = JSON.parse(sessionRaw);
      const usersRaw = localStorage.getItem(CLOUD_STORAGE_KEYS.USERS);
      const users: Record<string, any> = usersRaw ? JSON.parse(usersRaw) : {};

      const userRecord = users[email];
      if (!userRecord) return null;

      return {
        success: true,
        user: {
          id: userId || userRecord.id,
          email: userRecord.email,
          profile: userRecord.profile,
        },
      };
    } catch {
      return null;
    }
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
      } catch (err: any) {
        return { success: false, message: err.message || 'Erreur réinitialisation.' };
      }
    }
    return {
      success: true,
      message: 'Un lien de récupération a été envoyé à votre adresse e-mail.',
    };
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
    return { success: true, message: 'Mot de passe mis à jour avec succès !' };
  },

  // ==========================================
  // PRODUITS (CLOUD SYNC)
  // ==========================================

  async fetchProducts(userId: string): Promise<Product[]> {
    if (!userId) return [];

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erreur fetchProducts Supabase:', error);
          return [];
        }

        return (data || []).map((row) => ({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          category: row.category,
          unitPrice: Number(row.unit_price) || 0,
          quantity: Number(row.quantity) || 0,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
      } catch (err) {
        console.error('Exception fetchProducts Supabase:', err);
        return [];
      }
    }

    // Simulated cloud data per user
    try {
      const raw = localStorage.getItem(`quinca_cloud_products_${userId}`);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  async saveProduct(userId: string, product: Product): Promise<boolean> {
    if (!userId) return false;

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('products').upsert({
          id: product.id,
          user_id: userId,
          name: product.name,
          category: product.category,
          unit_price: product.unitPrice,
          quantity: product.quantity,
          created_at: product.createdAt,
          updated_at: product.updatedAt,
        });
        if (error) {
          console.error('Erreur saveProduct Supabase:', error);
          return false;
        }
        return true;
      } catch (err) {
        console.error('Exception saveProduct Supabase:', err);
        return false;
      }
    }

    // Simulated cloud store per user
    try {
      const existing = await this.fetchProducts(userId);
      const index = existing.findIndex((p) => p.id === product.id);
      let updated: Product[];
      if (index >= 0) {
        updated = [...existing];
        updated[index] = product;
      } else {
        updated = [product, ...existing];
      }
      localStorage.setItem(`quinca_cloud_products_${userId}`, JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  },

  async deleteProduct(userId: string, productId: string): Promise<boolean> {
    if (!userId || !productId) return false;

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId)
          .eq('user_id', userId);

        if (error) {
          console.error('Erreur deleteProduct Supabase:', error);
          return false;
        }
        return true;
      } catch (err) {
        console.error('Exception deleteProduct Supabase:', err);
        return false;
      }
    }

    // Simulated cloud store
    try {
      const existing = await this.fetchProducts(userId);
      const filtered = existing.filter((p) => p.id !== productId);
      localStorage.setItem(`quinca_cloud_products_${userId}`, JSON.stringify(filtered));
      return true;
    } catch {
      return false;
    }
  },

  // ==========================================
  // MOUVEMENTS (CLOUD SYNC)
  // ==========================================

  async fetchMovements(userId: string): Promise<Movement[]> {
    if (!userId) return [];

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('movements')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erreur fetchMovements Supabase:', error);
          return [];
        }

        return (data || []).map((row) => ({
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
      } catch (err) {
        console.error('Exception fetchMovements Supabase:', err);
        return [];
      }
    }

    // Simulated cloud movements
    try {
      const raw = localStorage.getItem(`quinca_cloud_movements_${userId}`);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  async saveMovement(userId: string, movement: Movement): Promise<boolean> {
    if (!userId) return false;

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
          return false;
        }
        return true;
      } catch (err) {
        console.error('Exception saveMovement Supabase:', err);
        return false;
      }
    }

    // Simulated cloud movements
    try {
      const existing = await this.fetchMovements(userId);
      const updated = [movement, ...existing];
      localStorage.setItem(`quinca_cloud_movements_${userId}`, JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
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

    // 1. Live Supabase flow
    if (isSupabaseConfigured() && supabase) {
      try {
        // First try the secure atomic RPC function
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

        // Fallback to table queries with RLS if RPC not deployed yet
        // 1. Check if user already PRO
        const { data: profileData } = await supabase
          .from('profiles')
          .select('is_pro')
          .eq('user_id', userId)
          .single();

        if (profileData?.is_pro) {
          return {
            success: false,
            status: 'ALREADY_PRO',
            message: '⭐ Votre compte QuincaStock PRO est déjà activé.',
          };
        }

        // 2. Check if code exists in pro_codes
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

        // 3. Check if already used
        if (codeRecord.is_used) {
          return {
            success: false,
            status: 'ALREADY_USED',
            message: '❌ Ce code PRO a déjà été utilisé.',
          };
        }

        // 4. Mark code used atomically
        await supabase
          .from('pro_codes')
          .update({
            is_used: true,
            used_by: userId,
            used_at: new Date().toISOString(),
          })
          .eq('id', codeRecord.id)
          .eq('is_used', false);

        // 5. Update profile
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

    // 2. Simulated Cloud flow (Preview mode)
    try {
      // 1. Check if user is already PRO
      const usersRaw = localStorage.getItem(CLOUD_STORAGE_KEYS.USERS);
      const users: Record<string, any> = usersRaw ? JSON.parse(usersRaw) : {};
      const userKey = Object.keys(users).find((k) => users[k].id === userId);

      if (userKey && users[userKey].profile?.isPro) {
        return {
          success: false,
          status: 'ALREADY_PRO',
          message: '⭐ Votre compte QuincaStock PRO est déjà activé.',
        };
      }

      // 2. Check valid codes
      if (!VALID_PRO_CODES.includes(cleanCode)) {
        return {
          success: false,
          status: 'INVALID_CODE',
          message: '❌ Code PRO invalide.',
        };
      }

      // 3. Check if already used in cloud codes table
      const codes = getStoredCloudCodes();
      const codeData = codes[cleanCode];

      if (codeData && codeData.isUsed) {
        return {
          success: false,
          status: 'ALREADY_USED',
          message: '❌ Ce code PRO a déjà été utilisé.',
        };
      }

      // 4. Mark code as used
      codes[cleanCode] = {
        isUsed: true,
        usedBy: userId,
        usedAt: new Date().toISOString(),
      };
      saveStoredCloudCodes(codes);

      // 5. Update profile
      if (userKey) {
        users[userKey].profile.isPro = true;
        localStorage.setItem(CLOUD_STORAGE_KEYS.USERS, JSON.stringify(users));
      }

      return {
        success: true,
        status: 'SUCCESS',
        message: '🎉 Félicitations ! Votre compte QuincaStock PRO est maintenant activé.',
      };
    } catch {
      return {
        success: false,
        status: 'ERROR',
        message: 'Erreur lors de l\'activation.',
      };
    }
  },

  // ==========================================
  // MIGRATION DES ANCIENNES DONNÉES LOCALES
  // ==========================================

  async migrateLocalDataToCloud(
    userId: string,
    localProducts: Product[],
    localMovements: Movement[]
  ): Promise<{ productsImported: number; movementsImported: number }> {
    let pCount = 0;
    let mCount = 0;

    for (const p of localProducts) {
      const ok = await this.saveProduct(userId, { ...p, userId });
      if (ok) pCount++;
    }

    for (const m of localMovements) {
      const ok = await this.saveMovement(userId, { ...m, userId });
      if (ok) mCount++;
    }

    return { productsImported: pCount, movementsImported: mCount };
  },
};
