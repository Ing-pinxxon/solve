import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[$olve] Supabase no configurado. Modo offline activo.');
}

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    : null;

export const isSupabaseConfigured = !!supabase;

export interface EnabledProviders {
  google: boolean;
  apple: boolean;
}

/**
 * Consulta qué proveedores OAuth están habilitados en el servidor de auth.
 * Permite ocultar botones de login que terminarían en error ("provider is not
 * enabled"). Devuelve null si no se puede consultar (offline/no configurado):
 * en ese caso el caller decide el fallback.
 */
export async function fetchEnabledProviders(): Promise<EnabledProviders | null> {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: supabaseAnonKey },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return { google: !!json.external?.google, apple: !!json.external?.apple };
  } catch {
    return null;
  }
}
