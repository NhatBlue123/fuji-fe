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

  // Recent transactions
  recentTransactions: AdminRevenueStatsResponse.RecentTransaction[];
}

// Nested namespace for RecentTransaction if needed or just use current
export namespace AdminRevenueStatsResponse {
  export interface RecentTransaction {
    id: number;
    type: string;
    amount: number;
    description: string;
    referenceId: string;
    createdAt: string;
  }
}

// Just in case income is separated
export interface AdminIncomeStatsResponse {
  totalRevenue: number;
  thirtyDaysRevenue: number;
  totalCourseRevenue: number;
  totalPlatformFee: number;
}
