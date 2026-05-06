import { baseApi } from "./baseApi";
import type { ApiResponse } from "@/types/api";
import { TransactionResponse, WalletInfo } from "@/types/wallet";

export const walletApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    getWallet: builder.query<WalletInfo, void>({
      query: () => "/wallet/me",
      transformResponse: (response: ApiResponse<WalletInfo> | WalletInfo) =>
        "data" in response ? response.data : response,
      providesTags: ["Wallet"]
    }),


    getWalletHistory: builder.query<TransactionResponse, { page: number; size: number }>({
      query: ({ page, size }) => `/payments/history?page=${page}&size=${size}`,
      transformResponse: (response: ApiResponse<TransactionResponse> | TransactionResponse) =>
        "data" in response ? response.data : response,
      providesTags: ["Wallet"]
    }),

  })
});

export const { useGetWalletQuery, useGetWalletHistoryQuery } = walletApi;
