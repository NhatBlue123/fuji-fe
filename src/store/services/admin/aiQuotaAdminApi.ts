import { aiBaseApi } from "../aiBaseApi";

type AiEnvelope<T> = {
  policies?: AiPolicy[];
  policy?: AiPolicy;
  summary?: { featureKey: string; externalCalls: number }[];
  usage?: AiUsage[];
} & { data?: T };

const readEnvelope = <T,>(res: unknown, key: keyof AiEnvelope<T>, fallback: T): T => {
  if (!res || typeof res !== "object") return fallback;
  return ((res as AiEnvelope<T>)[key] as T | undefined) ?? fallback;
};

export interface AiPolicy {
  id: number;
  featureKey: string;
  tier: string;
  resetPeriod: string;
  quotaAmount: number;
  fairUseAmount?: number | null;
  active: boolean | number;
}

export interface AiUsage {
  id: number;
  userId: number;
  featureKey: string;
  quotaSource: string;
  amount: number;
  cacheHit: boolean | number;
  providerCalled: boolean | number;
  model?: string;
  jobId?: string;
  createdAt: string;
}

export const aiQuotaAdminApi = aiBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAiPolicies: builder.query<AiPolicy[], void>({
      query: () => "/admin/ai/policies",
      transformResponse: (res: unknown) => readEnvelope<AiPolicy[]>(res, "policies", []),
      providesTags: ["AiQuota"],
    }),
    updateAiPolicy: builder.mutation<AiPolicy, { id: number; data: Partial<AiPolicy> }>({
      query: ({ id, data }) => ({ url: `/admin/ai/policies/${id}`, method: "PUT", body: data }),
      transformResponse: (res: unknown) => readEnvelope<AiPolicy>(res, "policy", res as AiPolicy),
      invalidatesTags: ["AiQuota"],
    }),
    getAiUsageSummary: builder.query<{ featureKey: string; externalCalls: number }[], void>({
      query: () => "/admin/ai/usage/summary",
      transformResponse: (res: unknown) => readEnvelope<{ featureKey: string; externalCalls: number }[]>(res, "summary", []),
      providesTags: ["AiQuota"],
    }),
    getAiUsage: builder.query<AiUsage[], void>({
      query: () => "/admin/ai/usage?limit=100",
      transformResponse: (res: unknown) => readEnvelope<AiUsage[]>(res, "usage", []),
      providesTags: ["AiQuota"],
    }),
  }),
});

export const {
  useGetAiPoliciesQuery,
  useUpdateAiPolicyMutation,
  useGetAiUsageSummaryQuery,
  useGetAiUsageQuery,
} = aiQuotaAdminApi;
