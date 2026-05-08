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

export interface CashflowSummary {
  recognizedRevenue: number;
  topupVolumeBlossoms: number;
  estimatedTopupVolumeVnd: number;
  actualTopupVolumeVnd: number;
  completedPayouts: number;
  pendingPayouts: number;
  processingPayouts: number;
  netAfterCompletedPayouts: number;
  projectedNetAfterPendingPayouts: number;
  platformFeeRevenue: number;
  courseRevenue: number;
  withdrawalFeeRevenue: number;
}

export interface CashRevenueSummary {
  grossTopupVnd: number;
  pendingExpectedTopupVnd: number;
  failedExpectedTopupVnd: number;
  bankOutVnd: number;
  netCashVnd: number;
  creditedBlossoms: number;
}

export interface ProfitSummary {
  totalProfitHoa: number;
  totalProfitVndEquivalent: number;
  bookingPlatformFeeHoa: number;
  adminBookingProfitHoa: number;
  coursePlatformFeeHoa: number;
  adminCourseProfitHoa: number;
  packageProfitHoa: number;
  subscriptionProfitHoa: number;
  cancellationPenaltyProfitHoa: number;
  legacyCourseProfitHoa: number;
}

export interface TeacherLiabilitySummary {
  totalTeacherLiabilityHoa: number;
  totalTeacherLiabilityVndEquivalent: number;
  bookingTeacherIncomeHoa: number;
  courseTeacherIncomeHoa: number;
  completedWithdrawalHoa: number;
  pendingWithdrawalHoa: number;
  processingWithdrawalHoa: number;
  completedPayoutVnd: number;
  pendingPayoutVnd: number;
  processingPayoutVnd: number;
}

export interface MonthlyFinancialSummary {
  year: number;
  month: number;
  bankInVnd: number;
  bankOutVnd: number;
  profitHoa: number;
  teacherLiabilityHoa: number;
  bookingProfitHoa: number;
  courseProfitHoa: number;
  packageProfitHoa: number;
  subscriptionProfitHoa: number;
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
  profitHoa: number;
  teacherLiabilityHoa: number;
  bookingProfitHoa: number;
  courseProfitHoa: number;
  packageProfitHoa: number;
  subscriptionProfitHoa: number;
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

export interface SourceBreakdownItem {
  key: string;
  label: string;
  amountHoa: number;
  amountVnd: number;
}

export interface AdminRevenueRecentTransaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  referenceId: string;
  createdAt: string;
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
  cashflowSummary: CashflowSummary;
  cashRevenue?: CashRevenueSummary;
  profitSummary?: ProfitSummary;
  teacherLiabilitySummary?: TeacherLiabilitySummary;
  monthlyFinancialSummaries?: MonthlyFinancialSummary[];
  weeklyFinancialSummaries?: FinancialPeriodSummary[];
  yearlyFinancialSummaries?: FinancialPeriodSummary[];
  weeklyPaymentStatuses?: PaymentPeriodStatus[];
  yearlyPaymentStatuses?: PaymentPeriodStatus[];
  profitBreakdown?: SourceBreakdownItem[];
  liabilityBreakdown?: SourceBreakdownItem[];
}

// Just in case income is separated
export interface AdminIncomeStatsResponse {
  totalRevenue: number;
  thirtyDaysRevenue: number;
  totalCourseRevenue: number;
  totalPlatformFee: number;
}
