import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Debt, PayoffStrategy } from '../types/debt';
import { debtToRow, rowToDebt } from '../repositories/SupabaseDebtRepository';
import { PreferencesRepository, RemotePreferences } from '../repositories/PreferencesRepository';
import { mergeByUpdatedAt } from './mergeDebts';
import type { SyncState } from '../components/auth/AccountMenu';

interface Preferences {
  currency: string;
  accelerator: number;
  strategy: PayoffStrategy;
  updatedAt: number;
}

interface UseDebtSyncArgs {
  user: User | null;
  debts: Debt[];
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
  preferences: Preferences;
  applyRemotePreferences: (prefs: RemotePreferences) => void;
}

const PUSH_DEBOUNCE_MS = 1500;

/**
 * Sincroniza deudas y preferencias con Supabase cuando hay sesión.
 * - Migración al primer login (sube lo local, luego mezcla lo remoto).
 * - Pull al enfocar / volver visible la pestaña.
 * - Push con debounce tras cada edición.
 * App.tsx sigue siendo la fuente de verdad (useState + persistencia local).
 */
export function useDebtSync({
  user,
  debts,
  setDebts,
  preferences,
  applyRemotePreferences,
}: UseDebtSyncArgs): { syncState: SyncState } {
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const prefsRepo = useMemo(() => new PreferencesRepository(), []);

  const debtsRef = useRef(debts);
  debtsRef.current = debts;
  const prefsRef = useRef(preferences);
  prefsRef.current = preferences;
  const migratedFor = useRef<string | null>(null);

  // ---- Helpers remotos ----

  const fetchRemote = useCallback(async (userId: string): Promise<Debt[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('debts').select('*').eq('user_id', userId);
    if (error || !data) throw error ?? new Error('no data');
    return data.map(rowToDebt);
  }, []);

  const pushRows = useCallback(async (userId: string, list: Debt[]): Promise<boolean> => {
    if (!supabase || list.length === 0) return true;
    const rows = list.map((d) => debtToRow({ ...d, userId }));
    const { error } = await supabase.from('debts').upsert(rows, { onConflict: 'id' });
    return !error;
  }, []);

  // ---- Pull + merge (al enfocar / montar) ----

  const pull = useCallback(async (userId: string) => {
    if (!supabase) return;
    setSyncState('syncing');
    try {
      const remote = await fetchRemote(userId);
      // Los items remotos vienen como 'synced'; al mezclar por updatedAt, los
      // ganadores remotos quedan 'synced' y los locales más nuevos mantienen su
      // estado (p.ej. 'pending'), de modo que el push posterior los suba.
      setDebts((prev) => mergeByUpdatedAt(prev, remote));

      const rp = await prefsRepo.fetch(userId);
      if (rp && rp.updatedAt > prefsRef.current.updatedAt) {
        applyRemotePreferences(rp);
      }
      setSyncState('synced');
    } catch {
      setSyncState('offline');
    }
  }, [fetchRemote, setDebts, prefsRepo, applyRemotePreferences]);

  // ---- Migración al primer login ----

  const migrate = useCallback(async (userId: string) => {
    if (!supabase) return;
    setSyncState('syncing');
    try {
      const now = Date.now();
      const localStamped: Debt[] = debtsRef.current.map((d) => ({
        ...d,
        userId,
        updatedAt: d.updatedAt ?? d.createdAt ?? now,
      }));

      const ok = await pushRows(userId, localStamped);
      const remote = await fetchRemote(userId);
      const localSynced = localStamped.map((d) => ({
        ...d,
        syncStatus: (ok ? 'synced' : 'pending') as Debt['syncStatus'],
      }));
      setDebts(mergeByUpdatedAt(localSynced, remote));

      // Preferencias: sube las locales; si remotas son más nuevas, aplícalas.
      const rp = await prefsRepo.fetch(userId);
      if (rp && rp.updatedAt > prefsRef.current.updatedAt) {
        applyRemotePreferences(rp);
      } else {
        await prefsRepo.upsert(userId, {
          currency: prefsRef.current.currency,
          monthlyAccelerator: prefsRef.current.accelerator,
          strategy: prefsRef.current.strategy,
          updatedAt: prefsRef.current.updatedAt || now,
        });
      }
      setSyncState(ok ? 'synced' : 'offline');
    } catch {
      setSyncState('offline');
    }
  }, [pushRows, fetchRemote, setDebts, prefsRepo, applyRemotePreferences]);

  // Dispara migración una vez por usuario que inicia sesión.
  useEffect(() => {
    if (!user) {
      migratedFor.current = null;
      setSyncState('idle');
      return;
    }
    if (migratedFor.current === user.id) return;
    migratedFor.current = user.id;
    migrate(user.id);
  }, [user, migrate]);

  // ---- Pull al enfocar / visibilitychange ----
  useEffect(() => {
    if (!user) return;
    const onFocus = () => {
      if (document.visibilityState !== 'hidden') pull(user.id);
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [user, pull]);

  // ---- Push con debounce tras editar ----
  useEffect(() => {
    if (!user || !supabase) return;
    const pending = debts.filter((d) => d.syncStatus === 'pending');
    if (pending.length === 0) return;

    const t = setTimeout(async () => {
      setSyncState('syncing');
      const ok = await pushRows(user.id, pending);
      if (ok) {
        const ids = new Set(pending.map((d) => d.id));
        setDebts((prev) =>
          prev.map((d) => (ids.has(d.id) ? { ...d, syncStatus: 'synced' } : d))
        );
        setSyncState('synced');
      } else {
        setSyncState('offline');
      }
    }, PUSH_DEBOUNCE_MS);

    return () => clearTimeout(t);
  }, [debts, user, pushRows, setDebts]);

  // ---- Push de preferencias con debounce ----
  useEffect(() => {
    if (!user || !supabase) return;
    const t = setTimeout(() => {
      prefsRepo.upsert(user.id, {
        currency: preferences.currency,
        monthlyAccelerator: preferences.accelerator,
        strategy: preferences.strategy,
        updatedAt: preferences.updatedAt,
      });
    }, PUSH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [preferences, user, prefsRepo]);

  return { syncState };
}
