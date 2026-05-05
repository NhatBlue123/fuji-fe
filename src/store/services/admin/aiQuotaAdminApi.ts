import { aiBaseApi } from "../aiBaseApi";

type AiEnvelope<T> = {
  policies?: AiPolicy[];
  policy?: AiPolicy;
  packs?: AiPack[];
  pack?: AiPack;
  summary?: AiUsageSummaryRow[];
  byDay?: AiUsageByDay[];
  topUsers?: AiTopUser[];
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
  tokensUsed?: number | null;
  conversationId?: number | null;
  messageId?: number | null;
  success?: boolean | number;
  createdAt: string;
}

export interface AiUsageSummaryRow {
  featureKey: string;
  externalCalls: number;
}

export interface AiUsageByDay {
  usageDate: string;
  featureKey: string;
  externalCalls: number;
}

export interface AiTopUser {
  userId: number;
  externalCalls: number;
  amount: number;
}

export interface AiUsageSummaryResponse {
  summary: AiUsageSummaryRow[];
  byDay: AiUsageByDay[];
  topUsers: AiTopUser[];
}

export interface AiUsageFilters {
  limit?: number;
  featureKey?: string;
  quotaSource?: string;
  userId?: string;
  from?: string;
  to?: string;
}

export interface AiPack {
  id: number;
  code: string;
  name: string;
  featureKey?: string | null;
  basicTurns: number;
  deepTurns: number;
  senseiSessions: number;
  priceHoa: number;
  active: boolean | number;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export type AiPackPayload = Omit<AiPack, "id" | "createdAt" | "updatedAt">;

const readSummaryEnvelope = (res: unknown): AiUsageSummaryResponse => {
  if (!res || typeof res !== "object") {
    return { summary: [], byDay: [], topUsers: [] };
  }
  const envelope = res as AiEnvelope<AiUsageSummaryResponse>;
  return {
    summary: envelope.summary ?? [],
    byDay: envelope.byDay ?? [],
    topUsers: envelope.topUsers ?? [],
  };
};

const buildUsageQuery = (filters?: AiUsageFilters) => {
  const params = new URLSearchParams();
  params.set("limit", String(filters?.limit ?? 100));
  if (filters?.featureKey && filters.featureKey !== "ALL") params.set("featureKey", filters.featureKey);
  if (filters?.quotaSource && filters.quotaSource !== "ALL") params.set("quotaSource", filters.quotaSource);
  if (filters?.userId?.trim()) params.set("userId", filters.userId.trim());
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);
  return `/admin/ai/usage?${params.toString()}`;
};

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
    getAiUsageSummary: builder.query<AiUsageSummaryResponse, void>({
      query: () => "/admin/ai/usage/summary",
      transformResponse: readSummaryEnvelope,
      providesTags: ["AiQuota"],
    }),
    getAiUsage: builder.query<AiUsage[], AiUsageFilters | void>({
      query: (filters) => buildUsageQuery(filters || undefined),
      transformResponse: (res: unknown) => readEnvelope<AiUsage[]>(res, "usage", []),
      providesTags: ["AiQuota"],
    }),
    getAiPacks: builder.query<AiPack[], void>({
      query: () => "/admin/ai/packs",
      transformResponse: (res: unknown) => readEnvelope<AiPack[]>(res, "packs", []),
      providesTags: ["AiQuota"],
    }),
    createAiPack: builder.mutation<AiPack, AiPackPayload>({
      query: (body) => ({ url: "/admin/ai/packs", method: "POST", body }),
      transformResponse: (res: unknown) => readEnvelope<AiPack>(res, "pack", res as AiPack),
      invalidatesTags: ["AiQuota"],
    }),
    updateAiPack: builder.mutation<AiPack, { id: number; data: AiPackPayload }>({
      query: ({ id, data }) => ({ url: `/admin/ai/packs/${id}`, method: "PUT", body: data }),
      transformResponse: (res: unknown) => readEnvelope<AiPack>(res, "pack", res as AiPack),
      invalidatesTags: ["AiQuota"],
    }),
  }),
});

export const {
  useGetAiPoliciesQuery,
  useUpdateAiPolicyMutation,
  useGetAiUsageSummaryQuery,
  useGetAiUsageQuery,
  useGetAiPacksQuery,
  useCreateAiPackMutation,
  useUpdateAiPackMutation,
} = aiQuotaAdminApi;
