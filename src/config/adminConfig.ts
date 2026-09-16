/**
 * ADN STUDIO NUMÉRIQUE — CONFIGURATION ADMINISTRATEUR QUINCASTOCK
 * 
 * Ce fichier permet de définir facilement le compte propriétaire/administrateur.
 * Vous pouvez renseigner ici l'UUID de votre compte Supabase (disponible dans Authentication -> Users)
 * ou votre adresse e-mail administrateur.
 */

export const ADMIN_CONFIG = {
  // Identifiant UUID de votre compte Supabase Administrateur (remplaçable à tout moment)
  ADMIN_USER_ID: 'd6d96ac9-daff-4577-9f0c-9108ad54724a',

  // Adresse email officielle du propriétaire
  ADMIN_EMAIL: 'firmintela7@gmail.com',

  // Prix unitaire d'activation de la version PRO
  PRO_PRICE_FCFA: 15000,

  // Nom et sous-titre de l'espace d'administration
  APP_NAME: 'ADN STUDIO NUMÉRIQUE',
  SUBTITLE: 'Administration QuincaStock',

  // Contacts officiels QuincaStock & ADN Studio Numérique
  PAYMENT_MOMO_ORANGE: '+237 696 019 303',
  WHATSAPP: '+237 696 019 303',
  PHONE_ALT: '+237 670 566 705',
  CONTACT_EMAIL: 'firmintela7@gmail.com',

  // 15 Codes PRO officiels fixes
  OFFICIAL_PRO_CODES: [
    'QUINCA-AF01',
    'QUINCA-AF02',
    'QUINCA-AF03',
    'QUINCA-AF04',
    'QUINCA-AF05',
    'QUINCA-AF06',
    'QUINCA-AF07',
    'QUINCA-AF08',
    'QUINCA-AF09',
    'QUINCA-AF10',
    'QUINCA-PRO01',
    'QUINCA-PRO02',
    'QUINCA-PRO03',
    'QUINCA-VIP01',
    'QUINCA-2026',
  ],
};

/**
 * Vérifie si un utilisateur donné a les droits d'administration
 */
export function checkIsAdmin(
  userOrId?: string | { id?: string; userId?: string; email?: string; role?: string; profile?: { role?: string; email?: string } } | null,
  paramEmail?: string,
  paramRole?: string
): boolean {
  if (!userOrId) return false;

  let userId: string | undefined;
  let userEmail: string | undefined;
  let userRole: string | undefined;

  if (typeof userOrId === 'string') {
    userId = userOrId;
    userEmail = paramEmail;
    userRole = paramRole;
  } else {
    userId = userOrId.id || userOrId.userId;
    userEmail = userOrId.email || userOrId.profile?.email || paramEmail;
    userRole = userOrId.role || userOrId.profile?.role || paramRole;
  }

  // 1. Rôle explicite admin dans le profil
  if (userRole === 'admin') {
    return true;
  }

  // 2. Correspondance avec l'UUID configuré
  if (userId && ADMIN_CONFIG.ADMIN_USER_ID && userId.toLowerCase() === ADMIN_CONFIG.ADMIN_USER_ID.toLowerCase()) {
    return true;
  }

  // 3. Correspondance avec l'email administrateur officiel
  if (userEmail && ADMIN_CONFIG.ADMIN_EMAIL && userEmail.trim().toLowerCase() === ADMIN_CONFIG.ADMIN_EMAIL.toLowerCase()) {
    return true;
  }

  return false;
}
