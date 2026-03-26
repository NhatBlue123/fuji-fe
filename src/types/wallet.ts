export interface Transaction {
  id: number;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceId: string;
  type: string;
  createdAt: string;
}

export interface TransactionResponse {
  content: Transaction[];
  number: number;
  size: number;
  totalPages: number;
  totalElements?: number;
}
export interface WalletInfo {
  availableBalance: number;
  balance: number;
  frozenBalance: number;
}
