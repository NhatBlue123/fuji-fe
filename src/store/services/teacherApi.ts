import { baseApi } from "./baseApi";
import { ApiResponse } from "@/types/api";

export interface IncomeStat {
  month: string;
  totalIncome: number;
  totalPlatformFee: number;
  totalNetIncome: number;
}

export interface TeacherBaseInfo {
  id: number;
  username: string;
  fullName: string;
  avatarUrl: string;
}

export interface TeacherIncomeStatsResponse {
  totalIncome: number;
  totalBookingIncome: number;
  totalStudents: number;
  totalCourses: number;
  totalCompletedBookings: number;
  totalPendingBookings: number;
  totalCancelledBookings: number;
  totalWithdrawn: number;
  pendingWithdraw: number;
  currentBalance: number;
  monthlyIncomes: {
    month: string;
    totalRevenue: number;
    bookingRevenue: number;
    courseRevenue: number;
  }[];
}

export interface TeacherDashboardData {
  lifetimeEarnings: number;
  currentMonthEarnings: number;
  monthOverMonthGrowth: number;
  totalHoursTaught: number;
  totalSessions: number;
  averageEarningsPerHour: number;
  averageRating: number;
  availableBalance: number;
  pendingPayouts: number;
  earningsOverTime: { date: string; income: number }[];
  topStudents: { studentName: string; totalSpent: number; bookingCount: number }[];
  courseRevenueList: { courseTitle: string; revenue: number; studentCount: number }[];
}

export const teacherApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTeacherIncomeStats: builder.query<any, void>({
      query: () => `/teacher/income/stats`,
      transformResponse: (res: ApiResponse<any>) => res.data,
    }),
    getTeacherDashboard: builder.query<TeacherDashboardData, { startDate?: string; endDate?: string } | void>({
      query: (params) => ({
        url: `/teacher/dashboard`,
        params: params || {},
      }),
      transformResponse: (res: ApiResponse<TeacherDashboardData>) => res.data,
    }),
  }),
});

export const { useGetTeacherIncomeStatsQuery, useGetTeacherDashboardQuery } = teacherApi;
