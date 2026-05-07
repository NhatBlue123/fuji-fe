import { baseApi } from "./baseApi";
import { TransactionResponse, WalletInfo } from "@/types/wallet";

const unwrapApiData = <T,>(res: unknown): T => {
  if (res && typeof res === "object" && "data" in res) {
    return (res as { data: T }).data;
  }

  return res as T;
};

export const walletApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWallet: builder.query<WalletInfo, void>({
      query: () => "/wallet/me",
      transformResponse: (res: unknown) => unwrapApiData<WalletInfo>(res),
      providesTags: ["Wallet"],
    }),

    getWalletHistory: builder.query<
      TransactionResponse,
      { page: number; size: number }
    >({
      query: ({ page, size }) => `/payments/history?page=${page}&size=${size}`,
      transformResponse: (res: unknown) =>
        unwrapApiData<TransactionResponse>(res),
      providesTags: ["Wallet"],
    }),
  }),
});

export const { useGetWalletQuery, useGetWalletHistoryQuery } = walletApi;
