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
  tokenStats?: AiUsageTokenStat[];
  tokenTotals?: AiUsageTokenTotals;
  period?: AiUsagePeriod;
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
  username?: string | null;
  email?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
  identificationCode?: string | null;
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
  costRateUsdPerMillion?: number;
  estimatedCostUsd?: number;
  createdAt: string;
}

export interface AiUsageSummaryRow {
  featureKey: string;
  externalCalls: number;
  amount?: number;
  totalTokens?: number;
}

export interface AiUsageByDay {
  usageDate: string;
  periodKey?: string;
  periodLabel?: string;
  featureKey: string;
  externalCalls: number;
  totalTokens?: number;
}

export interface AiTopUser {
  userId: number;
  username?: string | null;
  email?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
  identificationCode?: string | null;
  externalCalls: number;
  amount: number;
  totalTokens?: number;
}

export interface AiUsageTokenStat {
  featureKey: string;
  model: string;
  externalCalls: number;
  amount: number;
  totalTokens: number;
  avgTokens?: number;
  costRateUsdPerMillion?: number;
  estimatedCostUsd?: number;
  lastUsedAt?: string | null;
}

export interface AiUsageTokenTotals {
  externalCalls: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface AiUsageSummaryResponse {
  summary: AiUsageSummaryRow[];
  byDay: AiUsageByDay[];
  topUsers: AiTopUser[];
  tokenStats: AiUsageTokenStat[];
  tokenTotals: AiUsageTokenTotals;
  period: AiUsagePeriod;
}

export interface AiUsageEventsResponse {
  usage: AiUsage[];
  tokenStats: AiUsageTokenStat[];
  tokenTotals: AiUsageTokenTotals;
}

export interface AiUsageFilters {
  limit?: number;
  featureKey?: string;
  quotaSource?: string;
  keyword?: string;
  userId?: string;
  from?: string;
  to?: string;
}

export type AiUsagePeriod = "day" | "week" | "month" | "year";

export interface AiUsageSummaryFilters {
  period?: AiUsagePeriod;
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

export type AiPolicyPayload = Omit<AiPolicy, "id">;

const emptyTokenTotals: AiUsageTokenTotals = {
  externalCalls: 0,
  totalTokens: 0,
  estimatedCostUsd: 0,
};

const readSummaryEnvelope = (res: unknown): AiUsageSummaryResponse => {
  if (!res || typeof res !== "object") {
    return { summary: [], byDay: [], topUsers: [], tokenStats: [], tokenTotals: emptyTokenTotals, period: "day" };
  }
  const envelope = res as AiEnvelope<AiUsageSummaryResponse>;
  return {
    summary: envelope.summary ?? [],
    byDay: envelope.byDay ?? [],
    topUsers: envelope.topUsers ?? [],
    tokenStats: envelope.tokenStats ?? [],
    tokenTotals: envelope.tokenTotals ?? emptyTokenTotals,
    period: envelope.period ?? "day",
  };
};

const readUsageEnvelope = (res: unknown): AiUsageEventsResponse => {
  if (!res || typeof res !== "object") {
    return { usage: [], tokenStats: [], tokenTotals: emptyTokenTotals };
  }
  const envelope = res as AiEnvelope<AiUsageEventsResponse>;
  return {
    usage: envelope.usage ?? [],
    tokenStats: envelope.tokenStats ?? [],
    tokenTotals: envelope.tokenTotals ?? emptyTokenTotals,
  };
};

const buildUsageQuery = (filters?: AiUsageFilters) => {
  const params = new URLSearchParams();
  params.set("limit", String(filters?.limit ?? 100));
  if (filters?.featureKey && filters.featureKey !== "ALL") params.set("featureKey", filters.featureKey);
  if (filters?.quotaSource && filters.quotaSource !== "ALL") params.set("quotaSource", filters.quotaSource);
  if (filters?.keyword?.trim()) params.set("keyword", filters.keyword.trim());
  if (filters?.userId?.trim()) params.set("userId", filters.userId.trim());
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);
  return `/admin/ai/usage?${params.toString()}`;
};

const buildSummaryQuery = (filters?: AiUsageSummaryFilters) => {
  const params = new URLSearchParams();
  if (filters?.period) params.set("period", filters.period);
  const query = params.toString();
  return query ? `/admin/ai/usage/summary?${query}` : "/admin/ai/usage/summary";
};

export const aiQuotaAdminApi = aiBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAiPolicies: builder.query<AiPolicy[], void>({
      query: () => "/admin/ai/policies",
      transformResponse: (res: unknown) => readEnvelope<AiPolicy[]>(res, "policies", []),
      providesTags: ["AiQuota"],
    }),
    createAiPolicy: builder.mutation<AiPolicy, AiPolicyPayload>({
      query: (body) => ({ url: "/admin/ai/policies", method: "POST", body }),
      transformResponse: (res: unknown) => readEnvelope<AiPolicy>(res, "policy", res as AiPolicy),
      invalidatesTags: ["AiQuota"],
    }),
    updateAiPolicy: builder.mutation<AiPolicy, { id: number; data: Partial<AiPolicyPayload> }>({
      query: ({ id, data }) => ({ url: `/admin/ai/policies/${id}`, method: "PUT", body: data }),
      transformResponse: (res: unknown) => readEnvelope<AiPolicy>(res, "policy", res as AiPolicy),
      invalidatesTags: ["AiQuota"],
    }),
    deleteAiPolicy: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/admin/ai/policies/${id}`, method: "DELETE" }),
      invalidatesTags: ["AiQuota"],
    }),
    getAiUsageSummary: builder.query<AiUsageSummaryResponse, AiUsageSummaryFilters | void>({
      query: (filters) => buildSummaryQuery(filters || undefined),
      transformResponse: readSummaryEnvelope,
      providesTags: ["AiQuota"],
    }),
    getAiUsage: builder.query<AiUsageEventsResponse, AiUsageFilters | void>({
      query: (filters) => buildUsageQuery(filters || undefined),
      transformResponse: readUsageEnvelope,
      providesTags: ["AiQuota"],
    }),
    getAiUsageStats: builder.query<Pick<AiUsageEventsResponse, "tokenStats" | "tokenTotals">, AiUsageFilters | void>({
      query: (filters) => buildUsageQuery(filters || undefined),
      transformResponse: (res: unknown) => {
        const envelope = readUsageEnvelope(res);
        return { tokenStats: envelope.tokenStats, tokenTotals: envelope.tokenTotals };
      },
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
    deleteAiPack: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/admin/ai/packs/${id}`, method: "DELETE" }),
      invalidatesTags: ["AiQuota"],
    }),
  }),
});

export const {
  useGetAiPoliciesQuery,
  useCreateAiPolicyMutation,
  useUpdateAiPolicyMutation,
  useDeleteAiPolicyMutation,
  useGetAiUsageSummaryQuery,
  useGetAiUsageQuery,
  useGetAiUsageStatsQuery,
  useGetAiPacksQuery,
  useCreateAiPackMutation,
  useUpdateAiPackMutation,
  useDeleteAiPackMutation,
} = aiQuotaAdminApi;
