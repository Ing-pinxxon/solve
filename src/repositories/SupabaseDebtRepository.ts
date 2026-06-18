import { supabase } from '../lib/supabase';
import { Debt } from '../types/debt';
import { IDebtRepository, LocalDebtRepository } from './DebtRepository';

export class SupabaseDebtRepository implements IDebtRepository {
  private local = new LocalDebtRepository();

  private toRow(debt: Debt) {
    return {
      id: debt.id,
      user_id: debt.userId,
      name: debt.name,
      balance: debt.balance,
      annual_rate: debt.annualRate,
      installments: debt.installments,
      created_at: debt.createdAt,
      updated_at: debt.updatedAt,
      deleted_at: debt.deletedAt ?? null,
    };
  }

  private fromRow(row: any): Debt {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      balance: Number(row.balance),
      annualRate: Number(row.annual_rate),
      installments: row.installments,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at ?? undefined,
      syncStatus: 'synced',
    };
  }

  async getAll(): Promise<Debt[]> {
    const local = await this.local.getAll();
    this.syncFromRemote().catch(console.error);
    return local;
  }

  async upsert(debt: Debt): Promise<void> {
    const withMeta: Debt = { ...debt, updatedAt: Date.now(), syncStatus: 'pending' };
    await this.local.upsert(withMeta);
    if (supabase) {
      const { error } = await supabase.from('debts').upsert(this.toRow(withMeta), { onConflict: 'id' });
      if (!error) await this.local.markSynced([debt.id]);
    }
  }

  async softDelete(id: string): Promise<void> {
    await this.local.softDelete(id);
    if (supabase) {
      await supabase.from('debts').update({ deleted_at: Date.now(), updated_at: Date.now() }).eq('id', id);
    }
  }

  async getPendingSync(): Promise<Debt[]> {
    return this.local.getPendingSync();
  }

  async markSynced(ids: string[]): Promise<void> {
    return this.local.markSynced(ids);
  }

  async syncFromRemote(): Promise<void> {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.from('debts').select('*').eq('user_id', user.id);
    if (error || !data) return;

    for (const row of data) {
      const remote = this.fromRow(row);
      const locals = await this.local.getAll();
      const local = locals.find(d => d.id === remote.id);
      if (!local || remote.updatedAt > local.updatedAt) {
        await this.local.upsert(remote);
      }
    }
  }
}
