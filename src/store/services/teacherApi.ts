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
  totalRevenue: number;
  totalPlatformFee: number;
  totalNetIncome: number;
  totalClasses: number;
  totalStudents: number;
  monthlyStats: {
    month: string;
    income: number;
    expense: number;
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
  bookingSuccessRate: number;
  cancellationRate: number;
  availableBalance: number;
  pendingPayouts: number;
  totalWithdrawn: number;
  earningsOverTime: { date: string; income: number }[];
  topStudents: { 
    studentId: number;
    studentName: string; 
    spentAmount: number;
    bookingCount: number; 
  }[];
  courseRevenueList: { 
    courseId: number;
    courseTitle: string; 
    revenue: number; 
    studentCount: number; 
  }[];
}

export const teacherApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTeacherIncomeStats: builder.query<TeacherIncomeStatsResponse, void>({
      query: () => `/teacher/income/stats`,
      transformResponse: (res: ApiResponse<TeacherIncomeStatsResponse>) => res.data,
    }),
    getTeacherDashboard: builder.query<TeacherDashboardData, { startDate?: string; endDate?: string } | void>({
      query: (params) => ({
        url: `/teacher/dashboard`,
        params: params || {},
      }),
      transformResponse: (res: ApiResponse<TeacherDashboardData>) => res.data,
      providesTags: ["CourseFinance"], // Reuse or add a new tag if needed
    }),
  }),
  overrideExisting: true,
});

export const { useGetTeacherIncomeStatsQuery, useGetTeacherDashboardQuery } = teacherApi;
