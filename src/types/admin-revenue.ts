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

export interface AdminRevenueStatsResponse {
  // Key monetary metrics
  totalIncome: number;
  monthlyIncome: number; // 30 days revenue
  bookingIncome: number; // Total booking platform fees
  courseIncome: number;  // Total course sales distributions
  
  // Balance facts
  withdrawn: number;
  pendingWithdrawals: number;
  currentBalance: number;
  availableBalance: number;

  // Chart data
  monthlyIncomeBreakdown: RevenueChartData[];
  
  // Other stats
  bookingStatistics: BookingStatistics;
  courseStatistics: CourseStatistics;
  
  // Recent transactions
  recentTransactions: RecentTransaction[];
}

// Just in case income is separated
export interface AdminIncomeStatsResponse {
    totalRevenue: number;
    thirtyDaysRevenue: number;
    totalCourseRevenue: number;
    totalPlatformFee: number;
}
