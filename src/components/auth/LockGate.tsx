import React, { ReactNode } from 'react';
import { useAuth } from '../../auth/AuthContext';

interface LockGateProps {
  locked: boolean;
  /** Texto del CTA sobre el contenido bloqueado. */
  title?: string;
  subtitle?: string;
  reason?: string;
  children: ReactNode;
}

/**
 * Envuelve una sección: si `locked`, muestra el contenido atenuado/borroso
 * con un overlay y un CTA que abre el modal de login.
 */
export function LockGate({ locked, title, subtitle, reason, children }: LockGateProps) {
  const { openAuthModal } = useAuth();

  if (!locked) return <>{children}</>;

  return (
    <div className="lockgate">
      <div className="lockgate-content" aria-hidden="true">
        {children}
      </div>
      <div className="lockgate-overlay">
        <div className="lockgate-lock">🔒</div>
        <h4 className="lockgate-title">{title ?? 'Inicia sesión para desbloquear'}</h4>
        {subtitle && <p className="lockgate-subtitle">{subtitle}</p>}
        <button type="button" className="btn-primary lockgate-cta" onClick={() => openAuthModal(reason)}>
          Desbloquear gratis
        </button>
      </div>
    </div>
  );
}
