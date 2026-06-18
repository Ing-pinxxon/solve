export interface Debt {
  id: string;
  userId?: string;
  name: string;
  balance: number;
  annualRate: number;
  installments: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  syncStatus?: 'pending' | 'synced' | 'conflict';
}

export type PayoffStrategy = 'avalanche' | 'snowball';

export interface OneTimePayment {
  id: string;
  monthNumber: number;
  amount: number;
}

export interface UserPreferences {
  userId: string;
  currency: string;
  monthlyAccelerator: number;
  strategy: PayoffStrategy;
  updatedAt: number;
}

export interface SyncPayload {
  debts: Debt[];
  preferences: Partial<UserPreferences>;
  lastSyncAt: number;
}
