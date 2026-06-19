import { supabase } from '../lib/supabase';
import { PayoffStrategy, UserPreferences } from '../types/debt';

export interface RemotePreferences {
  currency: string;
  monthlyAccelerator: number;
  strategy: PayoffStrategy;
  updatedAt: number;
}

/**
 * Repositorio de preferencias de usuario contra la tabla `user_preferences`.
 * Solo opera con sesión activa; en modo invitado las preferencias viven en
 * localStorage (gestionadas directamente por App.tsx).
 */
export class PreferencesRepository {
  async fetch(userId: string): Promise<RemotePreferences | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      currency: data.currency,
      monthlyAccelerator: Number(data.monthly_accelerator),
      strategy: data.strategy as PayoffStrategy,
      updatedAt: Number(data.updated_at),
    };
  }

  async upsert(userId: string, prefs: RemotePreferences): Promise<void> {
    if (!supabase) return;
    await supabase.from('user_preferences').upsert(
      {
        user_id: userId,
        currency: prefs.currency,
        monthly_accelerator: prefs.monthlyAccelerator,
        strategy: prefs.strategy,
        updated_at: prefs.updatedAt,
      },
      { onConflict: 'user_id' }
    );
  }
}

export type { UserPreferences };
