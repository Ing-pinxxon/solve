import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

export type SyncState = 'idle' | 'syncing' | 'synced' | 'offline';

const SYNC_LABEL: Record<SyncState, string> = {
  idle: '',
  syncing: '↻ Sincronizando…',
  synced: '✓ Sincronizado',
  offline: '⚠ Sin conexión',
};

export function AccountMenu({ syncState = 'idle' }: { syncState?: SyncState }) {
  const { user, isGuest, authDisabled, openAuthModal, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Si Supabase no está configurado, no mostramos nada de auth.
  if (authDisabled) return null;

  if (isGuest) {
    return (
      <button type="button" className="account-signin-btn" onClick={() => openAuthModal()}>
        Iniciar sesión
      </button>
    );
  }

  const email = user?.email ?? 'Mi cuenta';
  const initial = email.charAt(0).toUpperCase();

  return (
    <div className="account-menu" ref={ref}>
      <button type="button" className="account-avatar-btn" onClick={() => setOpen(!open)} aria-label="Cuenta">
        <span className="account-avatar">{initial}</span>
      </button>

      <div className={`account-dropdown ${open ? 'show' : ''}`}>
        <div className="account-dropdown-email">{email}</div>
        {syncState !== 'idle' && (
          <div className={`account-sync-chip account-sync-${syncState}`}>{SYNC_LABEL[syncState]}</div>
        )}
        <button
          type="button"
          className="account-dropdown-item"
          onClick={() => { setOpen(false); signOut(); }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
