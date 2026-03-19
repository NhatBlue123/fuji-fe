import { baseApi } from "./baseApi";

export const premiumApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    subscribePremium: builder.mutation<string, void>({
      query: () => ({
        url: "/premium/subscribe",
        method: "POST",
        responseHandler: "text",
      }),
      // Invalidate to refresh wallet balance
      invalidatesTags: ["Wallet"],
    }),
  }),
});

export const { useSubscribePremiumMutation } = premiumApi;
