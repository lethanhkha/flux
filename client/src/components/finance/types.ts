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
  type: 'TRANSACTION' | 'CATEGORY' | null;
  targetTx?: TransactionItem;
  targetCategory?: CategoryItem;
  isLoading: boolean;
}
