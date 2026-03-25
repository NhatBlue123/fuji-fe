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
}
<<<<<<< HEAD
export interface WalletInfo {
  availableBalance: number;
  balance: number;
  frozenBalance: number;
}
=======
>>>>>>> 5ec54e3cdd2a537cf6c1538db5fdf5836e73a65a
