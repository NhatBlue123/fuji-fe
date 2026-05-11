import { baseApi } from "./baseApi";
import type { ApiResponse } from "@/types/api";
import type { AdminRevenueStatsResponse, AdminIncomeStatsResponse } from "@/types/admin-revenue";

export const adminRevenueApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRevenueStats: builder.query<AdminRevenueStatsResponse, void>({
      query: () => "/admin/analytics/summary",
      transformResponse: (response: ApiResponse<AdminRevenueStatsResponse>) => 
        response.data,
      providesTags: ["AdminRevenue"],
    }),
    getIncomeStats: builder.query<AdminIncomeStatsResponse, void>({
        query: () => "/admin/stats/income",
        transformResponse: (response: ApiResponse<AdminIncomeStatsResponse>) => 
            response.data,
        providesTags: ["AdminRevenue"],
      }),
  }),
  overrideExisting: true,
});

export const {
  useGetRevenueStatsQuery,
  useGetIncomeStatsQuery,
} = adminRevenueApi;
