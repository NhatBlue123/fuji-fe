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
  // the api might return other fields, update as needed
}

export const teacherApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTeacherIncomeStats: builder.query<any, void>({
      query: () => `/teacher/income/stats`,
      transformResponse: (res: ApiResponse<any>) => res.data,
    }),
  }),
});

export const { useGetTeacherIncomeStatsQuery } = teacherApi;
