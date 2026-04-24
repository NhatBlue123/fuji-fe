import { aiBaseApi } from "../aiBaseApi";

export interface GuideDocument {
  id: number;
  filename: string;
  content?: string;
  contentHash: string;
  isActive: boolean;
  uploadedBy?: number | null;
  createdAt: string;
  updatedAt: string;
  activatedAt?: string | null;
  indexedAt?: string | null;
  charCount: number;
  chunkCount: number;
  needsReindex?: boolean;
}

export interface GuideDocumentStatusResponse {
  ok: boolean;
  data?: {
    activeDocument: {
      id: number;
      filename: string;
      contentHash: string;
      charCount: number;
      chunkCount: number;
      activatedAt?: string | null;
      indexedAt?: string | null;
    } | null;
    documents: GuideDocument[];
    collection: {
      name: string;
      pointsCount: number;
      indexedVectorsCount: number;
    };
  };
  error?: {
    code?: string;
    message?: string;
  };
}

export interface GuideDocumentResponse {
  ok: boolean;
  message?: string;
  data?: GuideDocument;
  error?: {
    code?: string;
    message?: string;
  };
}

export interface ReindexResponse {
  ok: boolean;
  message?: string;
  data?: {
    documentId: number;
    filename: string;
    charCount: number;
    chunkCount: number;
    pointsCount: number;
    indexedAt: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
}

export const adminAiGuideDocApi = aiBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGuideDocumentStatus: builder.query<GuideDocumentStatusResponse, void>({
      query: () => ({
        url: "/admin/rag/guide-doc/status",
        method: "GET",
      }),
    }),
    uploadGuideDocument: builder.mutation<GuideDocumentResponse, FormData>({
      query: (formData) => ({
        url: "/admin/rag/guide-doc/upload",
        method: "POST",
        body: formData,
      }),
    }),
    getGuideDocument: builder.query<GuideDocumentResponse, number>({
      query: (id) => ({
        url: `/admin/rag/guide-doc/${id}`,
        method: "GET",
      }),
    }),
    updateGuideDocument: builder.mutation<
      GuideDocumentResponse,
      { id: number; content: string }
    >({
      query: ({ id, content }) => ({
        url: `/admin/rag/guide-doc/${id}`,
        method: "PUT",
        body: { content },
      }),
    }),
    activateGuideDocument: builder.mutation<GuideDocumentResponse, number>({
      query: (id) => ({
        url: `/admin/rag/guide-doc/${id}/activate`,
        method: "POST",
      }),
    }),
    reindexGuideDocument: builder.mutation<ReindexResponse, number>({
      query: (id) => ({
        url: `/admin/rag/guide-doc/${id}/reindex`,
        method: "POST",
      }),
    }),
    resetGuideDocumentIndex: builder.mutation<GuideDocumentResponse, void>({
      query: () => ({
        url: "/admin/rag/guide-doc/reset-index",
        method: "POST",
      }),
    }),
    deleteGuideDocument: builder.mutation<GuideDocumentResponse, number>({
      query: (id) => ({
        url: `/admin/rag/guide-doc/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetGuideDocumentStatusQuery,
  useUploadGuideDocumentMutation,
  useGetGuideDocumentQuery,
  useLazyGetGuideDocumentQuery,
  useUpdateGuideDocumentMutation,
  useActivateGuideDocumentMutation,
  useReindexGuideDocumentMutation,
  useResetGuideDocumentIndexMutation,
  useDeleteGuideDocumentMutation,
} = adminAiGuideDocApi;
