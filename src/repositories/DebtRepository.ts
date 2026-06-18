import { Debt } from '../types/debt';

export interface IDebtRepository {
  getAll(): Promise<Debt[]>;
  upsert(debt: Debt): Promise<void>;
  softDelete(id: string): Promise<void>;
  getPendingSync(): Promise<Debt[]>;
  markSynced(ids: string[]): Promise<void>;
}

export class LocalDebtRepository implements IDebtRepository {
  private readonly KEY = 'debts';

  async getAll(): Promise<Debt[]> {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(d => !d.deletedAt) : [];
    } catch {
      return [];
    }
  }

  private async getAllIncludingDeleted(): Promise<Debt[]> {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async upsert(debt: Debt): Promise<void> {
    const all = await this.getAllIncludingDeleted();
    const idx = all.findIndex(d => d.id === debt.id);
    if (idx >= 0) all[idx] = debt;
    else all.push(debt);
    localStorage.setItem(this.KEY, JSON.stringify(all));
  }

  async softDelete(id: string): Promise<void> {
    const all = await this.getAllIncludingDeleted();
    const debt = all.find(d => d.id === id);
    if (debt) {
      debt.deletedAt = Date.now();
      debt.updatedAt = Date.now();
      debt.syncStatus = 'pending';
      localStorage.setItem(this.KEY, JSON.stringify(all));
    }
  }

  async getPendingSync(): Promise<Debt[]> {
    const all = await this.getAllIncludingDeleted();
    return all.filter(d => d.syncStatus === 'pending');
  }

  async markSynced(ids: string[]): Promise<void> {
    const all = await this.getAllIncludingDeleted();
    ids.forEach(id => {
      const d = all.find(d => d.id === id);
      if (d) d.syncStatus = 'synced';
    });
    localStorage.setItem(this.KEY, JSON.stringify(all));
  }
}
