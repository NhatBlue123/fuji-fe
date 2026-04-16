import { aiBaseApi } from "../aiBaseApi";

export interface RagIngestResponse {
  ok: boolean;
  message?: string;
  data?: Record<string, unknown>;
  error?: {
    code?: string;
    message?: string;
  };
}

export type RagIndexedFilter = "all" | "indexed" | "not_indexed";
export type RagChangedFilter = "all" | "changed" | "up_to_date";
export type RagStaleFilter = "all" | "stale" | "fresh";

export interface RagOverviewResponse {
  ok: boolean;
  data?: {
    collection?: {
      name: string;
      pointsCount: number;
      indexedVectorsCount: number;
      vectorsCount: number;
      status: string;
    };
    guideCollection?: {
      name: string;
      pointsCount: number;
      indexedVectorsCount: number;
      vectorsCount: number;
      status: string;
    };
    product?: {
      courses?: {
        total: number;
        indexed: number;
        notIndexed: number;
        changed: number;
        upToDate: number;
        stale: number;
      };
      plans?: {
        total: number;
        indexed: number;
        notIndexed: number;
        changed: number;
        upToDate: number;
        stale: number;
      };
      estimate?: {
        allSeconds: number;
        changedSeconds: number;
      };
    };
    guide?: {
      total: number;
      indexed: number;
      notIndexed: number;
      changed: number;
      stale: number;
      sheetWarning?: string | null;
      estimate?: {
        ingestSeconds: number;
      };
    };
  };
  error?: {
    code?: string;
    message?: string;
  };
}

export interface RagProductStatusItem {
  entity: "course" | "plan";
  id: number;
  title?: string;
  level?: string;
  price: number;
  currency?: string;
  students?: number;
  lessonCount?: number;
  name?: string;
  displayName?: string;
  description?: string;
  durationDays?: number;
  updatedAt?: string | null;
  indexed: boolean;
  indexedAt?: string | null;
  sourceUpdatedAt?: string | null;
  changed: boolean;
  staleDays?: number | null;
  stale: boolean;
}

export interface RagProductStatusResponse {
  ok: boolean;
  data?: {
    filters: {
      keyword: string;
      indexed: RagIndexedFilter;
      changed: RagChangedFilter;
      stale: RagStaleFilter;
      staleDays: number;
    };
    summary: {
      courses: {
        total: number;
        indexed: number;
        notIndexed: number;
        changed: number;
        upToDate: number;
        stale: number;
      };
      plans: {
        total: number;
        indexed: number;
        notIndexed: number;
        changed: number;
        upToDate: number;
        stale: number;
      };
      filtered: {
        courses: number;
        plans: number;
      };
    };
    estimate: {
      allSeconds: number;
      changedSeconds: number;
      filteredSeconds: number;
    };
    courses: RagProductStatusItem[];
    plans: RagProductStatusItem[];
  };
  error?: {
    code?: string;
    message?: string;
  };
}

export interface RagGuideStatusItem {
  docId?: string;
  sourceId: string;
  rowNumber: number;
  title: string;
  content?: string;
  link?: string;
  tags?: string;
  feature?: string;
  routePath?: string;
  category?: string;
  language?: string;
  sourceUpdatedAt?: string | null;
  indexed: boolean;
  indexedAt?: string | null;
  changed: boolean;
  staleDays?: number | null;
  stale: boolean;
}

export interface RagGuideStatusResponse {
  ok: boolean;
  data?: {
    filters: {
      keyword: string;
      indexed: RagIndexedFilter;
      changed: RagChangedFilter;
      stale: RagStaleFilter;
      staleDays: number;
    };
    summary: {
      all: {
        total: number;
        indexed: number;
        notIndexed: number;
        changed: number;
        upToDate: number;
        stale: number;
      };
      filtered: number;
    };
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasPrev: boolean;
      hasNext: boolean;
    };
    estimate: {
      ingestSeconds: number;
    };
    items: RagGuideStatusItem[];
  };
  error?: {
    code?: string;
    message?: string;
  };
}

export interface RagProductIngestRequest {
  mode?: "all" | "selected" | "changed";
  courseIds?: number[];
  planIds?: number[];
}

export interface RagStatusQuery {
  keyword?: string;
  indexed?: RagIndexedFilter;
  changed?: RagChangedFilter;
  stale?: RagStaleFilter;
  staleDays?: number;
  page?: number;
  limit?: number;
}

function makeStatusQuery(params?: RagStatusQuery) {
  const q = new URLSearchParams();
  if (!params) return "";
  if (params.keyword) q.set("keyword", params.keyword);
  if (params.indexed) q.set("indexed", params.indexed);
  if (params.changed) q.set("changed", params.changed);
  if (params.stale) q.set("stale", params.stale);
  if (params.staleDays) q.set("staleDays", String(params.staleDays));
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  const str = q.toString();
  return str ? `?${str}` : "";
}

export const adminAiRagApi = aiBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRagOverview: builder.query<
      RagOverviewResponse,
      { staleDays?: number } | void
    >({
      query: (params) => {
        const query = params?.staleDays ? `?staleDays=${params.staleDays}` : "";
        return {
          url: `/admin/rag/overview${query}`,
          method: "GET",
        };
      },
    }),
    getProductRagStatus: builder.query<
      RagProductStatusResponse,
      RagStatusQuery | void
    >({
      query: (params) => ({
        url: `/admin/rag/products/status${makeStatusQuery(params)}`,
        method: "GET",
      }),
    }),
    resetProductRag: builder.mutation<RagIngestResponse, void>({
      query: () => ({
        url: "/admin/rag/products/reset",
        method: "POST",
      }),
    }),
    ingestProductRag: builder.mutation<
      RagIngestResponse,
      RagProductIngestRequest | void
    >({
      query: (body) => ({
        url: "/admin/rag/products/ingest",
        method: "POST",
        body: body || { mode: "all" },
      }),
    }),
    getGuideRagStatus: builder.query<
      RagGuideStatusResponse,
      RagStatusQuery | void
    >({
      query: (params) => ({
        url: `/admin/rag/guide/status${makeStatusQuery(params)}`,
        method: "GET",
      }),
    }),
    resetGuideRag: builder.mutation<RagIngestResponse, void>({
      query: () => ({
        url: "/admin/rag/guide/reset",
        method: "POST",
      }),
    }),
    ingestGuideRag: builder.mutation<RagIngestResponse, void>({
      query: () => ({
        url: "/admin/rag/guide/ingest",
        method: "POST",
      }),
    }),
    ingestCoursesRag: builder.mutation<RagIngestResponse, void>({
      query: () => ({
        url: "/admin/rag/ingest-courses",
        method: "POST",
      }),
    }),
    ingestWebGuideRag: builder.mutation<RagIngestResponse, void>({
      query: () => ({
        url: "/admin/rag/ingest-web-guide",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useGetRagOverviewQuery,
  useGetProductRagStatusQuery,
  useResetProductRagMutation,
  useIngestProductRagMutation,
  useGetGuideRagStatusQuery,
  useResetGuideRagMutation,
  useIngestGuideRagMutation,
  useIngestCoursesRagMutation,
  useIngestWebGuideRagMutation,
} = adminAiRagApi;
