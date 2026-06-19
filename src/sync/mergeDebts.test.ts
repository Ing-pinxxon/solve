import { mergeByUpdatedAt, activeDebts } from './mergeDebts';
import { Debt } from '../types/debt';

function debt(partial: Partial<Debt> & { id: string }): Debt {
  return {
    id: partial.id,
    name: partial.name ?? 'Deuda',
    balance: partial.balance ?? 1000,
    annualRate: partial.annualRate ?? 20,
    installments: partial.installments ?? 12,
    createdAt: partial.createdAt ?? 1000,
    updatedAt: partial.updatedAt ?? 1000,
    deletedAt: partial.deletedAt,
    userId: partial.userId,
    syncStatus: partial.syncStatus,
  };
}

describe('mergeByUpdatedAt', () => {
  test('une deudas que solo existen en un lado', () => {
    const local = [debt({ id: 'a' })];
    const remote = [debt({ id: 'b' })];
    const merged = mergeByUpdatedAt(local, remote);
    expect(merged.map((d) => d.id).sort()).toEqual(['a', 'b']);
  });

  test('last-write-wins: el remoto más nuevo reemplaza al local', () => {
    const local = [debt({ id: 'a', balance: 100, updatedAt: 1000 })];
    const remote = [debt({ id: 'a', balance: 999, updatedAt: 2000 })];
    const merged = mergeByUpdatedAt(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0].balance).toBe(999);
  });

  test('last-write-wins: el local más nuevo se conserva', () => {
    const local = [debt({ id: 'a', balance: 100, updatedAt: 3000 })];
    const remote = [debt({ id: 'a', balance: 999, updatedAt: 2000 })];
    const merged = mergeByUpdatedAt(local, remote);
    expect(merged[0].balance).toBe(100);
  });

  test('en empate de updatedAt prevalece el remoto', () => {
    const local = [debt({ id: 'a', balance: 100, updatedAt: 5000 })];
    const remote = [debt({ id: 'a', balance: 999, updatedAt: 5000 })];
    const merged = mergeByUpdatedAt(local, remote);
    expect(merged[0].balance).toBe(999);
  });

  test('propaga el borrado lógico (deletedAt) desde el remoto más nuevo', () => {
    const local = [debt({ id: 'a', updatedAt: 1000 })];
    const remote = [debt({ id: 'a', updatedAt: 2000, deletedAt: 2000 })];
    const merged = mergeByUpdatedAt(local, remote);
    expect(merged[0].deletedAt).toBe(2000);
    expect(activeDebts(merged)).toHaveLength(0);
  });

  test('activeDebts excluye las borradas', () => {
    const list = [debt({ id: 'a' }), debt({ id: 'b', deletedAt: 123 })];
    expect(activeDebts(list).map((d) => d.id)).toEqual(['a']);
  });
});
