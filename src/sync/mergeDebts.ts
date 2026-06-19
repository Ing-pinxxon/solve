import { Debt } from '../types/debt';

/**
 * Une dos conjuntos de deudas (local y remoto) por `id`, resolviendo conflictos
 * con last-write-wins según `updatedAt`. Conserva el campo `deletedAt` para que
 * los borrados lógicos se propaguen entre dispositivos.
 *
 * Es una función PURA (sin red ni efectos) para poder testearla en aislamiento.
 */
export function mergeByUpdatedAt(local: Debt[], remote: Debt[]): Debt[] {
  const byId = new Map<string, Debt>();

  for (const d of local) {
    byId.set(d.id, d);
  }

  for (const r of remote) {
    const existing = byId.get(r.id);
    if (!existing) {
      byId.set(r.id, r);
      continue;
    }
    // El más reciente gana. En empate, prevalece el remoto (fuente compartida).
    if ((r.updatedAt ?? 0) >= (existing.updatedAt ?? 0)) {
      byId.set(r.id, r);
    }
  }

  return Array.from(byId.values());
}

/** Filtra las deudas activas (no borradas lógicamente). */
export function activeDebts(debts: Debt[]): Debt[] {
  return debts.filter((d) => !d.deletedAt);
}
