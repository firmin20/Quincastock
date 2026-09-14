import { createClient } from '@supabase/supabase-js';

// Configuration Supabase pour QuincaStock V2
const DEFAULT_SUPABASE_URL = 'https://nuemdcsnqoppjtcjtxdr.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_-qmIe7-Ue_OY5uG2IDxIzw_mwUM1-xy';

const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Utiliser l'environnement si valide, ou les identifiants officiels du projet Supabase
const supabaseUrl =
  envUrl && envUrl.startsWith('http') && !envUrl.includes('your-project') && !envUrl.includes('MY_SUPABASE')
    ? envUrl
    : DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  envKey && envKey.length > 20 && !envKey.includes('MY_SUPABASE')
    ? envKey
    : DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl.startsWith('http') && 
    !supabaseUrl.includes('your-project') &&
    !supabaseUrl.includes('MY_SUPABASE')
  );
};

export const getSupabaseConfig = () => ({
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  configured: isSupabaseConfigured(),
});

// Initialisation garantie du client avec persistance de session
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
