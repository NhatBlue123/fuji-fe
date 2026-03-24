import { baseApi } from "./baseApi";
import { TransactionResponse, WalletInfo } from "@/types/wallet";

export const walletApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    getWallet: builder.query<WalletInfo, void>({
      query: () => "/wallet/me",
      providesTags: ["Wallet"]
    }),

    getWalletHistory: builder.query<TransactionResponse, { page: number; size: number }>({
      query: ({ page, size }) => `/payments/history?page=${page}&size=${size}`,
      providesTags: ["Wallet"]
    }),

  })
});

export const { useGetWalletQuery, useGetWalletHistoryQuery } = walletApi;