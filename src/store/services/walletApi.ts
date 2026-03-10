import { baseApi } from "./baseApi";

export const walletApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    getWallet: builder.query<{ balance: number }, void>({
      query: () => "/wallet/me",
      providesTags: ["Wallet"]
    }),

  })
});

export const { useGetWalletQuery } = walletApi;