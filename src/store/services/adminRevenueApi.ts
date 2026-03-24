import { createApi } from "@reduxjs/toolkit/query/react";
import { API_CONFIG } from "@/config/api";
import { getAccessToken } from "@/lib/token";
import type { ApiResponse } from "@/types/api";
import type { AdminRevenueStatsResponse, AdminIncomeStatsResponse } from "@/types/admin-revenue";

const baseQuery = async (args: any) => {
  const { url, method = "GET", body } =
    typeof args === "string" ? { url: args } : args;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, config);
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(error.message || "Request failed");
  }

  const data = await response.json();
  return { data };
};

export const adminRevenueApi = createApi({
  reducerPath: "adminRevenueApi",
  baseQuery,
  tagTypes: ["AdminRevenue"],
  endpoints: (builder) => ({
    getRevenueStats: builder.query<AdminRevenueStatsResponse, void>({
      query: () => "/admin/stats/revenue",
      transformResponse: (response: ApiResponse<AdminRevenueStatsResponse>) => 
        response.data ? response.data : (response as any),
      providesTags: ["AdminRevenue"],
    }),
    getIncomeStats: builder.query<AdminIncomeStatsResponse, void>({
        query: () => "/admin/stats/income",
        transformResponse: (response: ApiResponse<AdminIncomeStatsResponse>) => 
            response.data ? response.data : (response as any),
        providesTags: ["AdminRevenue"],
      }),
  }),
});

export const {
  useGetRevenueStatsQuery,
  useGetIncomeStatsQuery,
} = adminRevenueApi;
