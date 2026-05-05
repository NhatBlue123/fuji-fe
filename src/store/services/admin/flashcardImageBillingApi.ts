import { baseApi } from "../baseApi";

type ApiEnvelope<T> = { data?: T };

const unwrapData = <T,>(res: unknown, fallback: T): T => {
  if (res && typeof res === "object" && "data" in res) {
    return (res as ApiEnvelope<T>).data ?? fallback;
  }
  return (res as T) ?? fallback;
};

export interface FlashcardImagePolicy {
  id: number;
  tier: string;
  dailyQuota: number;
  hardCapDaily: number;
  packEnabled: boolean;
  active: boolean;
}

export interface FlashcardImagePack {
  id: number;
  code: string;
  name: string;
  operationAmount: number;
  priceHoa: number;
  active: boolean;
  sortOrder: number;
}

export interface FlashcardImageUsage {
  id: number;
  userId: number;
  username?: string;
  operationType: string;
  quotaSource: string;
  amount: number;
  cacheHit: boolean;
  externalCalled: boolean;
  success: boolean;
  requestKey?: string;
  createdAt: string;
}

export interface FlashcardImageUsageSummary {
  todayExternalCalls: number;
  weekExternalCalls: number;
  monthExternalCalls: number;
}

export const flashcardImageBillingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFlashcardImagePolicies: builder.query<FlashcardImagePolicy[], void>({
      query: () => "/admin/flashcard-image/policies",
      transformResponse: (res: unknown) => unwrapData<FlashcardImagePolicy[]>(res, []),
      providesTags: ["FlashcardImageBilling"],
    }),
    updateFlashcardImagePolicy: builder.mutation<FlashcardImagePolicy, { id: number; data: Partial<FlashcardImagePolicy> }>({
      query: ({ id, data }) => ({ url: `/admin/flashcard-image/policies/${id}`, method: "PUT", body: data }),
      transformResponse: (res: unknown) => unwrapData<FlashcardImagePolicy>(res, res as FlashcardImagePolicy),
      invalidatesTags: ["FlashcardImageBilling"],
    }),
    getFlashcardImagePacks: builder.query<FlashcardImagePack[], void>({
      query: () => "/admin/flashcard-image/packs",
      transformResponse: (res: unknown) => unwrapData<FlashcardImagePack[]>(res, []),
      providesTags: ["FlashcardImageBilling"],
    }),
    createFlashcardImagePack: builder.mutation<FlashcardImagePack, Partial<FlashcardImagePack>>({
      query: (body) => ({ url: "/admin/flashcard-image/packs", method: "POST", body }),
      transformResponse: (res: unknown) => unwrapData<FlashcardImagePack>(res, res as FlashcardImagePack),
      invalidatesTags: ["FlashcardImageBilling"],
    }),
    updateFlashcardImagePack: builder.mutation<FlashcardImagePack, { id: number; data: Partial<FlashcardImagePack> }>({
      query: ({ id, data }) => ({ url: `/admin/flashcard-image/packs/${id}`, method: "PUT", body: data }),
      transformResponse: (res: unknown) => unwrapData<FlashcardImagePack>(res, res as FlashcardImagePack),
      invalidatesTags: ["FlashcardImageBilling"],
    }),
    getFlashcardImageUsageSummary: builder.query<FlashcardImageUsageSummary, void>({
      query: () => "/admin/flashcard-image/usage/summary",
      transformResponse: (res: unknown) => unwrapData<FlashcardImageUsageSummary>(res, {
        todayExternalCalls: 0,
        weekExternalCalls: 0,
        monthExternalCalls: 0,
      }),
      providesTags: ["FlashcardImageBilling"],
    }),
    getFlashcardImageUsage: builder.query<FlashcardImageUsage[], void>({
      query: () => "/admin/flashcard-image/usage?limit=100",
      transformResponse: (res: unknown) => unwrapData<FlashcardImageUsage[]>(res, []),
      providesTags: ["FlashcardImageBilling"],
    }),
  }),
});

export const {
  useGetFlashcardImagePoliciesQuery,
  useUpdateFlashcardImagePolicyMutation,
  useGetFlashcardImagePacksQuery,
  useCreateFlashcardImagePackMutation,
  useUpdateFlashcardImagePackMutation,
  useGetFlashcardImageUsageSummaryQuery,
  useGetFlashcardImageUsageQuery,
} = flashcardImageBillingApi;
