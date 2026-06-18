import Dexie, { type Table } from 'dexie';
import { Debt, UserPreferences } from '../types/debt';

type DBPreference = UserPreferences & { id: string };

class DeudaZeroDatabase extends Dexie {
  debts!: Table<Debt, string>;
  preferences!: Table<DBPreference, string>;

  constructor() {
    super('DeudaZeroDB');
    this.version(2).stores({
      debts: 'id, userId, updatedAt, syncStatus, deletedAt',
      preferences: 'userId',
    });
  }
}

export const db = new DeudaZeroDatabase();
export default db;
