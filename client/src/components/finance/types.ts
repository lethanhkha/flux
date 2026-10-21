export interface WalletItem {
  id: string;
  name: string;
  balance: number;
  type: string;
  color: string;
  icon: any;
  isDefault?: boolean;
}

export interface TransactionItem {
  id: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  wallet: string;
  walletId?: string;
  destWallet?: string;
  destWalletId?: string;
  category: string;
  amount: number;
  date: string;
  rawDate?: string;
  note: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  icon?: string;
  color?: string;
}

export interface DeleteModalState {
  isOpen: boolean;
  type: 'TRANSACTION' | 'CATEGORY' | 'WALLET' | null;
  targetTx?: TransactionItem;
  targetCategory?: CategoryItem;
  targetWallet?: WalletItem;
  isLoading: boolean;
}

export type PeriodMode = 'MONTH' | 'RANGE' | 'ALL';

export interface PeriodFilter {
  mode: PeriodMode;
  month: number; // 1 - 12
  year: number;  // e.g. 2026
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export interface FilterInsightStats {
  totalAmount: number;
  count: number;
  averageAmount: number;
  maxAmount: number;
  maxTransactionNote?: string;
  percentageOfPeriodExpense: number;
}

export interface PeriodSummary {
  income: number;
  expense: number;
  netCashflow: number;
}

export interface GroupedTransactionsByDate {
  dateKey: string;
  displayDate: string;
  dayOfWeek?: string;
  totalIncome: number;
  totalExpense: number;
  items: TransactionItem[];
}
