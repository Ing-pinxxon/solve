import React from 'react';

/**
 * Candado inline pequeño para controles bloqueados (moneda, agregar deuda…).
 * El onClick debe disparar openAuthModal desde el componente padre.
 */
export function LockBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`lock-badge ${className}`} aria-label="Requiere iniciar sesión" title="Inicia sesión para desbloquear">
      🔒
    </span>
  );
}
