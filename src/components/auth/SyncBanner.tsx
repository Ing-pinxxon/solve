import React from 'react';
import { useAuth } from '../../auth/AuthContext';

/**
 * Banner del modo invitado: invita a crear cuenta para desbloquear y sincronizar.
 * Se oculta si hay sesión o si Supabase no está configurado.
 */
export function SyncBanner() {
  const { isGuest, authDisabled, openAuthModal } = useAuth();
  if (authDisabled || !isGuest) return null;

  return (
    <div className="sync-banner">
      <span style={{ fontSize: '1.2rem' }}>🔓</span>
      <span className="sync-banner-text">
        <strong>Crea una cuenta gratis</strong> para agregar más deudas, ver tu plan
        completo y sincronizar entre dispositivos.
      </span>
      <button type="button" className="sync-banner-btn" onClick={() => openAuthModal('Crea tu cuenta para desbloquear todo')}>
        Crear cuenta
      </button>
    </div>
  );
}
