export interface RevenueChartData {
  date: string;
  courseRevenue: number;
  bookingRevenue: number;
  totalRevenue: number;
}

export interface RecentTransaction {
  id: string | number;
  type: "BOOKING_FEE" | "COURSE_SALE" | "WITHDRAWAL";
  amount: number;
  date: string;
  status: "COMPLETED" | "PENDING" | "CANCELLED";
  description?: string;
}

export interface BookingStatistics {
  completed: number;
  cancelled: number;
  pending: number;
  total: number;
}

export interface CourseStatistics {
  totalCourses: number;
  totalStudents: number;
}

export interface MonthlyRevenue {
  year: number;
  month: number;
  bookingFeeRevenue: number;
  withdrawalFeeRevenue: number;
  courseRevenue: number;
  totalRevenue: number;
}

export interface MonthlyPaymentStatus {
  year: number;
  month: number;
  successCount: number;
  pendingCount: number;
  failedCount: number;
  cancelledCount: number;
  successAmount: number;
  pendingAmount: number;
  failedAmount: number;
  cancelledAmount: number;
}

export interface PaymentStatusStats {
  totalCount: number;
  successCount: number;
  pendingCount: number;
  failedCount: number;
  cancelledCount: number;
  successAmount: number;
  pendingAmount: number;
  failedAmount: number;
  cancelledAmount: number;
  estimatedSuccessVnd: number;
  estimatedPendingVnd: number;
  estimatedCancelledVnd: number;
  actualSuccessVnd: number;
  expectedPendingVnd: number;
  expectedFailedVnd: number;
  expectedCancelledVnd: number;
  successRate: number;
  failureRate: number;
  cancellationRate: number;
}

export interface WithdrawalStatusStats {
  totalCount: number;
  pendingCount: number;
  processingCount: number;
  completedCount: number;
  rejectedCount: number;
  pendingAmount: number;
  processingAmount: number;
  completedAmount: number;
  rejectedAmount: number;
}

export interface CashRevenueSummary {
  grossTopupVnd: number;
  pendingExpectedTopupVnd: number;
  failedExpectedTopupVnd: number;
  bankOutVnd: number;
  netCashVnd: number;
  creditedBlossoms: number;
  topupSuccessCount?: number;
  payoutSuccessCount?: number;
  payoutSuccessVnd?: number;
  completedWithdrawalFallbackVnd?: number;
  usingWithdrawalFallback?: boolean;
  ignoredInCount?: number;
  ignoredInVnd?: number;
  ignoredOutCount?: number;
  ignoredOutVnd?: number;
}

export interface WalletPositionSummary {
  totalBalanceHoa: number;
  totalFrozenHoa: number;
  totalAvailableHoa: number;
  adminBalanceHoa: number;
  adminFrozenHoa: number;
  adminAvailableHoa: number;
  instructorBalanceHoa: number;
  instructorFrozenHoa: number;
  instructorAvailableHoa: number;
  userBalanceHoa: number;
  userFrozenHoa: number;
  userAvailableHoa: number;
  adminWalletCount: number;
  instructorWalletCount: number;
  userWalletCount: number;
}

export interface LiabilityEstimateSummary {
  teacherOwnedHoa: number;
  teacherWithdrawableHoa: number;
  teacherFrozenHoa: number;
  teacherEstimatedDebtVnd: number;
  teacherEstimatedNetDebtVnd?: number;
  teacherEstimatedPlatformFeeVnd?: number;
  platformFeeBps?: number;
  userPrepaidHoa: number;
  userPrepaidVndEquivalent: number;
  adminInternalHoa: number;
  adminInternalVndEquivalent: number;
  pendingWithdrawalVnd: number;
  processingWithdrawalVnd: number;
}

export interface MonthlyFinancialSummary {
  year: number;
  month: number;
  bankInVnd: number;
  bankOutVnd: number;
  cashNetHoa: number;
  teacherGrossIncomeHoa: number;
  bookingGrossHoa: number;
  courseGrossHoa: number;
}

export interface FinancialPeriodSummary {
  periodType: "WEEK" | "YEAR" | string;
  periodKey: string;
  label: string;
  year?: number;
  month?: number | null;
  week?: number | null;
  startDate?: string;
  endDate?: string;
  bankInVnd: number;
  bankOutVnd: number;
  cashNetHoa: number;
  teacherGrossIncomeHoa: number;
  bookingGrossHoa: number;
  courseGrossHoa: number;
}

export interface PaymentPeriodStatus {
  periodType: "WEEK" | "YEAR" | string;
  periodKey: string;
  label: string;
  year?: number;
  month?: number | null;
  week?: number | null;
  startDate?: string;
  endDate?: string;
  successCount: number;
  pendingCount: number;
  failedCount: number;
  cancelledCount: number;
  successAmount: number;
  pendingAmount: number;
  failedAmount: number;
  cancelledAmount: number;
}

export interface AdminRevenueRecentTransaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  referenceId: string;
  createdAt: string;
  userId?: number;
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string;
}

export interface BankTransferRecord {
  id: number;
  xgateTransactionId: string;
  type: string;
  amountVnd: number;
  content: string;
  currency?: string;
  source: string;
  processingResult: string;
  matchedOrderId?: string;
  receiverAccount?: string;
  receiverBankName?: string;
  transactionDate?: string;
  createdAt?: string;
  matchedUserId?: number;
  matchedUserName?: string;
  matchedUserEmail?: string;
  matchedUserAvatarUrl?: string;
  creditedBlossoms?: number;
}

export interface AdminRevenueStatsResponse {
  // Key monetary metrics
  totalRevenue: number;
  totalBookingFeeRevenue: number;
  totalCourseRevenue: number;
  totalWithdrawalFeeRevenue: number;

  totalPendingWithdrawalAmount: number;
  totalCompletedWithdrawalAmount: number;

  // Chart data
  monthlyRevenues: MonthlyRevenue[];
  monthlyPaymentStatuses: MonthlyPaymentStatus[];

  // Recent transactions
  recentTransactions: AdminRevenueRecentTransaction[];
  bankTransferRecords: BankTransferRecord[];

  paymentStatusStats: PaymentStatusStats;
  withdrawalStatusStats: WithdrawalStatusStats;
  cashRevenue?: CashRevenueSummary;
  walletPositionSummary?: WalletPositionSummary;
  liabilityEstimateSummary?: LiabilityEstimateSummary;
  monthlyFinancialSummaries?: MonthlyFinancialSummary[];
  weeklyFinancialSummaries?: FinancialPeriodSummary[];
  yearlyFinancialSummaries?: FinancialPeriodSummary[];
  weeklyPaymentStatuses?: PaymentPeriodStatus[];
  yearlyPaymentStatuses?: PaymentPeriodStatus[];
}

// Just in case income is separated
export interface AdminIncomeStatsResponse {
  totalRevenue: number;
  thirtyDaysRevenue: number;
  totalCourseRevenue: number;
  totalPlatformFee: number;
}
