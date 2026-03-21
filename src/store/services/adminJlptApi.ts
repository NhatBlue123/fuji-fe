import { createApi } from "@reduxjs/toolkit/query/react";
import { API_CONFIG } from "@/config/api";
import { getAccessToken } from "@/lib/token";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { QuestionReport } from "@/types/jlpt-review";

// Base query with authentication (same as jlptApi)
const baseQuery = async (args: any) => {
  const {
    url,
    method = "GET",
    body,
  } = typeof args === "string" ? { url: args } : args;

  const headers: HeadersInit = {};

  // Only set Content-Type for JSON, let browser set it for FormData
  const isFormData = body instanceof FormData;
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  if (body) {
    // Don't stringify FormData
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, config);

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(error.message || "Request failed");
  }

  const data = await response.json();
  return { data };
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CreateJlptTestDTO {
  title: string;
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  testType: 'full_test' | 'vocabulary_grammar' | 'reading' | 'listening';
  description?: string;
  duration: number; // minutes
  totalQuestions: number;
  maxScore?: number; // default 180
  passScore: number;
  languageKnowledgePassScore?: number;
  readingPassScore?: number;
  listeningPassScore?: number;
}

export interface UpdateJlptTestDTO extends Partial<CreateJlptTestDTO> {
  isPublished?: boolean;
}

export interface CreateQuestionDTO {
  mondaiNumber: number;
  mondaiTitle?: string;
  parentId?: number | null;
  questionOrder: number;
  section: "VOCABULARY" | "GRAMMAR" | "READING" | "LISTENING";
  contentText: string;
  imageMediaId?: number | null;
  audioMediaId?: number | null;
  options?: string; // JSON-encoded string array: "[\"a\",\"b\",\"c\",\"d\"]" (matches backend String field)
  correctOption?: number; // 1-4
  explanation?: string;
  points?: number; // default 1.0
}

export interface UpdateQuestionDTO extends Partial<CreateQuestionDTO> {}

// ============================================================================
// QUESTION BANK TYPES
// ============================================================================

export interface QuestionBankItem {
  id: number;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  section: "VOCABULARY" | "GRAMMAR" | "READING" | "LISTENING";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  mondaiNumber?: number;
  mondaiTitle?: string;
  passageText?: string;
  contentText: string;
  imageMedia?: MediaInfo | null;
  audioMedia?: MediaInfo | null;
  options?: string;
  correctOption?: number;
  explanation?: string;
  points: number;
  tags?: string;
  createdById?: number;
  createdByName?: string;
  createdAt: string;
}

export interface QuestionBankSearchParams {
  level?: QuestionBankItem["level"];
  section?: QuestionBankItem["section"];
  difficulty?: QuestionBankItem["difficulty"];
  search?: string;
  page?: number;
  size?: number;
}

export interface CreateQuestionBankItemDTO {
  level: QuestionBankItem["level"];
  section: QuestionBankItem["section"];
  difficulty?: QuestionBankItem["difficulty"];
  mondaiNumber?: number;
  mondaiTitle?: string;
  passageText?: string;
  contentText: string;
  imageMediaId?: number | null;
  audioMediaId?: number | null;
  options?: string;
  correctOption?: number;
  explanation?: string;
  points?: number;
  tags?: string;
}

export interface UpdateQuestionBankItemDTO extends Partial<CreateQuestionBankItemDTO> {}

export interface AttachBankItemToTestDTO {
  bankItemId: number;
  testId: number;
  section: QuestionBankItem["section"];
  questionOrder: number;
  mondaiNumber?: number;
  mondaiTitle?: string;
  parentQuestionId?: number | null;
}

export interface JlptTestAdmin {
  id: number;
  title: string;
  level: string;
  testType: string;
  description?: string;
  duration: number;
  totalQuestions: number;
  maxScore: number;
  passScore: number;
  attemptCount: number;
  averageScore: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  questions?: JlptQuestionAdmin[];
}

export interface MediaInfo {
  id: number;
  url: string;
  publicId: string;
  resourceType: string;
  format: string;
  size: number;
}

export interface JlptQuestionAdmin {
  id: number;
  testId: number;
  mondaiNumber: number;
  mondaiTitle?: string;
  parentId?: number | null;
  questionOrder: number;
  section: string;
  contentText: string;
  imageMedia?: MediaInfo | null;
  audioMedia?: MediaInfo | null;
  options?: string | string[]; // Backend returns JSON string; may be pre-parsed to array
  correctOption?: number;
  explanation?: string;
  points: number;
  createdAt: string;
  children?: JlptQuestionAdmin[]; // populated for parent questions (tree structure)
}

export interface MediaUploadResponse {
  id: number;
  url: string;
  publicId: string;
  resourceType: string;
  size: number;
  format: string;
}

// ============================================================================
// API SERVICE
// ============================================================================

export const adminJlptApi = createApi({
  reducerPath: "adminJlptApi",
  baseQuery: baseQuery,
  tagTypes: ["AdminTest", "AdminQuestion", "QuestionBank", "JlptQuestionReports"],
  endpoints: (builder) => ({
    // ========================================================================
    // TEST MANAGEMENT
    // ========================================================================

    getAllTests: builder.query<
      PaginatedResponse<JlptTestAdmin>,
      {
        page?: number;
        size?: number;
        sortBy?: string;
        sortDir?: "asc" | "desc";
      }
    >({
      query: ({
        page = 0,
        size = 10,
        sortBy = "createdAt",
        sortDir = "desc",
      }) =>
        `/jlpt-tests?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`,
      transformResponse: (
        response: ApiResponse<PaginatedResponse<JlptTestAdmin>>,
      ) => response.data,
      providesTags: ["AdminTest"],
    }),

    // Fetch all tests (size=1000) for aggregate stats — no new backend endpoint needed
    getAllTestsStats: builder.query<JlptTestAdmin[], void>({
      query: () =>
        `/jlpt-tests?page=0&size=1000&sortBy=attemptCount&sortDir=desc`,
      transformResponse: (
        response: ApiResponse<PaginatedResponse<JlptTestAdmin>>,
      ) => response.data.content,
      providesTags: ["AdminTest"],
    }),

    getTestById: builder.query<JlptTestAdmin, number>({
      query: (id) => `/jlpt-tests/${id}`,
      transformResponse: (response: ApiResponse<JlptTestAdmin>) =>
        response.data,
      providesTags: (result, error, id) => [{ type: "AdminTest", id }],
    }),

    createTest: builder.mutation<JlptTestAdmin, CreateJlptTestDTO>({
      query: (body) => ({
        url: "/jlpt-tests",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<JlptTestAdmin>) =>
        response.data,
      invalidatesTags: ["AdminTest"],
    }),

    updateTest: builder.mutation<
      JlptTestAdmin,
      { id: number; data: UpdateJlptTestDTO }
    >({
      query: ({ id, data }) => ({
        url: `/jlpt-tests/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: ApiResponse<JlptTestAdmin>) =>
        response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "AdminTest", id },
        "AdminTest",
      ],
    }),

    deleteTest: builder.mutation<void, number>({
      query: (id) => ({
        url: `/jlpt-tests/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminTest"],
    }),

    // ========================================================================
    // QUESTION MANAGEMENT
    // ========================================================================

    addQuestion: builder.mutation<
      JlptQuestionAdmin,
      { testId: number; data: CreateQuestionDTO }
    >({
      query: ({ testId, data }) => ({
        url: `/jlpt-tests/${testId}/questions`,
        method: "POST",
        body: data,
      }),
      transformResponse: (response: ApiResponse<JlptQuestionAdmin>) =>
        response.data,
      invalidatesTags: (result, error, { testId }) => [
        { type: "AdminTest", id: testId },
        "AdminQuestion",
      ],
    }),

    updateQuestion: builder.mutation<
      JlptQuestionAdmin,
      { id: number; data: UpdateQuestionDTO }
    >({
      query: ({ id, data }) => ({
        url: `/jlpt-tests/questions/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: ApiResponse<JlptQuestionAdmin>) =>
        response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "AdminQuestion", id },
        "AdminTest",
      ],
    }),

    deleteQuestion: builder.mutation<void, number>({
      query: (id) => ({
        url: `/jlpt-tests/questions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminQuestion", "AdminTest"],
    }),

    // ========================================================================
    // QUESTION BANK MANAGEMENT
    // ========================================================================

    getQuestionBankItems: builder.query<
      PaginatedResponse<QuestionBankItem>,
      QuestionBankSearchParams | void
    >({
      query: (params) => {
        const p = params ?? {};
        const searchParams = new URLSearchParams();
        if (p.level) searchParams.set("level", p.level);
        if (p.section) searchParams.set("section", p.section);
        if (p.difficulty) searchParams.set("difficulty", p.difficulty);
        if (p.search) searchParams.set("search", p.search);
        searchParams.set("page", String(p.page ?? 0));
        searchParams.set("size", String(p.size ?? 20));
        const qs = searchParams.toString();
        return `/jlpt-question-bank${qs ? `?${qs}` : ""}`;
      },
      transformResponse: (
        response: ApiResponse<PaginatedResponse<QuestionBankItem>>,
      ) => response.data,
      providesTags: ["QuestionBank"],
    }),

    createQuestionBankItem: builder.mutation<
      QuestionBankItem,
      CreateQuestionBankItemDTO
    >({
      query: (body) => ({
        url: "/jlpt-question-bank",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<QuestionBankItem>) =>
        response.data,
      invalidatesTags: ["QuestionBank"],
    }),

    bulkCreateQuestionBankItems: builder.mutation<
      QuestionBankItem[],
      CreateQuestionBankItemDTO[]
    >({
      query: (body) => ({
        url: "/jlpt-question-bank/bulk",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<QuestionBankItem[]>) =>
        response.data,
      invalidatesTags: ["QuestionBank"],
    }),

    updateQuestionBankItem: builder.mutation<
      QuestionBankItem,
      { id: number; data: UpdateQuestionBankItemDTO }
    >({
      query: ({ id, data }) => ({
        url: `/jlpt-question-bank/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: ApiResponse<QuestionBankItem>) =>
        response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "QuestionBank", id },
        "QuestionBank",
      ],
    }),

    deleteQuestionBankItem: builder.mutation<void, number>({
      query: (id) => ({
        url: `/jlpt-question-bank/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["QuestionBank"],
    }),

    attachQuestionBankItemToTest: builder.mutation<
      JlptQuestionAdmin,
      AttachBankItemToTestDTO
    >({
      query: (body) => ({
        url: "/jlpt-question-bank/attach-to-test",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<JlptQuestionAdmin>) =>
        response.data,
      invalidatesTags: (result, error, body) => [
        { type: "AdminTest", id: body.testId },
        "AdminQuestion",
      ],
    }),

    // ========================================================================
    // MEDIA UPLOAD
    // ========================================================================

    uploadImage: builder.mutation<MediaUploadResponse, FormData>({
      query: (formData) => ({
        url: "/media/upload/image",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response: ApiResponse<MediaUploadResponse>) =>
        response.data,
    }),

    uploadAudio: builder.mutation<MediaUploadResponse, FormData>({
      query: (formData) => ({
        url: "/media/upload/audio",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response: ApiResponse<MediaUploadResponse>) =>
        response.data,
    }),

    deleteMedia: builder.mutation<void, string>({
      query: (publicId) => ({
        url: `/media/${publicId}`,
        method: "DELETE",
      }),
    }),

    // ========================================================================
    // JLPT QUESTION REPORTS (ADMIN)
    // ========================================================================

    getJlptQuestionReports: builder.query<
      PaginatedResponse<QuestionReport>,
      { status?: QuestionReport["status"]; page?: number; size?: number }
    >({
      query: ({ status, page = 0, size = 20 } = {}) => {
        const sp = new URLSearchParams();
        if (status) sp.set("status", status);
        sp.set("page", String(page));
        sp.set("size", String(size));
        const qs = sp.toString();
        return `/admin/jlpt-question-reports${qs ? `?${qs}` : ""}`;
      },
      transformResponse: (
        response: ApiResponse<PaginatedResponse<QuestionReport>>,
      ) => response.data,
      providesTags: ["JlptQuestionReports"],
    }),

    updateJlptQuestionReport: builder.mutation<
      QuestionReport,
      { id: number; data: Partial<Pick<QuestionReport, "status" | "adminNote">> }
    >({
      query: ({ id, data }) => ({
        url: `/admin/jlpt-question-reports/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: ApiResponse<QuestionReport>) => response.data,
      invalidatesTags: ["JlptQuestionReports"],
    }),
  }),
});

export const {
  useGetAllTestsQuery,
  useGetAllTestsStatsQuery,
  useGetTestByIdQuery,
  useCreateTestMutation,
  useUpdateTestMutation,
  useDeleteTestMutation,
  useAddQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useUploadImageMutation,
  useUploadAudioMutation,
  useDeleteMediaMutation,
  useGetQuestionBankItemsQuery,
  useCreateQuestionBankItemMutation,
  useBulkCreateQuestionBankItemsMutation,
  useUpdateQuestionBankItemMutation,
  useDeleteQuestionBankItemMutation,
  useAttachQuestionBankItemToTestMutation,
  useGetJlptQuestionReportsQuery,
  useUpdateJlptQuestionReportMutation,
} = adminJlptApi;
