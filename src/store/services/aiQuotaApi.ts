import { aiBaseApi } from "./aiBaseApi";

type AiQuotaEnvelope = {
  ok?: boolean;
  quotas?: AiQuota[];
};

export interface AiQuota {
  featureKey: string;
  tier: string;
  dailyQuota: number;
  dailyUsed: number;
  dailyRemaining: number;
  fairUseAmount?: number | null;
  packRemaining: number;
  totalRemaining: number;
}

export const aiQuotaApi = aiBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyAiQuota: builder.query<AiQuota[], void>({
      query: () => "/api/me/ai-quota",
      transformResponse: (res: AiQuotaEnvelope) => res?.quotas ?? [],
      providesTags: ["AiQuota"],
    }),
  }),
});

export const { useGetMyAiQuotaQuery } = aiQuotaApi;
