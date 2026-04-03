import { baseApi } from "./baseApi";
import { SubscriptionPlan, SubscriptionMyStatus, SubscriptionHistory, SubscriptionPreview } from "@/types/subscription";

export const subscriptionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlans: builder.query<SubscriptionPlan[], void>({
      query: () => "/subscription/plans",
      transformResponse: (res: any) => {
        const rawPlans = res?.data || res;
        if (Array.isArray(rawPlans)) {
          return rawPlans.map(plan => {
            let features = [];
            if (Array.isArray(plan.features)) {
              features = plan.features;
            } else if (typeof plan.features === "string") {
              try {
                features = JSON.parse(plan.features);
              } catch (e) {
                features = [plan.features];
              }
            }
            features = features.map((f: any) => {
              if (f !== null && typeof f === 'object') {
                return f.description || f.featureCode || f.name || JSON.stringify(f);
              }
              return String(f);
            });
            return { ...plan, features };
          });
        }
        return rawPlans;
      },
      providesTags: ["Subscription"],
    }),
    subscribe: builder.mutation<string, { tier: string }>({
      query: (body) => ({
        url: "/subscription/subscribe",
        method: "POST",
        body,
        responseHandler: "text", // assuming it returns success message text
      }),
      // Invalidate Wallet to reflect new balance, Subscription for new status
      invalidatesTags: ["Wallet", "Subscription", "User"],
    }),
    getMySubscription: builder.query<SubscriptionMyStatus, void>({
      query: () => "/subscription/me",
      transformResponse: (res: any) => res?.data || res,
      providesTags: ["Subscription"],
    }),
    toggleAutoRenew: builder.mutation<string, { enable: boolean }>({
      query: (body) => ({
        url: "/subscription/auto-renew",
        method: "POST",
        body,
        responseHandler: "text",
      }),
      invalidatesTags: ["Subscription"],
    }),
    getSubscriptionHistory: builder.query<SubscriptionHistory[], void>({
      query: () => "/subscription/history",
      transformResponse: (res: any) => {
        const items = res?.data || res?.content || res;
        if (!Array.isArray(items)) return [];
        return items.map((item: any, index: number) => ({
          id: item.id || String(index + 1),
          tier: item.currentTier || item.tier || 'BASIC',
          startDate: item.startDate || '',
          endDate: item.expireAt || item.endDate || '',
          status: item.active === true ? 'ACTIVE' : item.active === false ? 'EXPIRED' : (item.status || 'UNKNOWN'),
          price: item.price || item.amount || 0,
        }));
      },
      providesTags: ["Subscription"],
    }),
    getSubscriptionPreview: builder.query<SubscriptionPreview, string>({
      query: (tier) => `/subscription/preview?tier=${tier}`,
      transformResponse: (res: any) => res?.data || res,
    }),
  }),
});

export const {
  useGetPlansQuery,
  useSubscribeMutation,
  useGetMySubscriptionQuery,
  useToggleAutoRenewMutation,
  useGetSubscriptionHistoryQuery,
  useLazyGetSubscriptionPreviewQuery,
} = subscriptionApi;
