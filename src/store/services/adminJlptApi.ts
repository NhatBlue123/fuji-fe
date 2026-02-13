import { createApi } from '@reduxjs/toolkit/query/react';
import { API_CONFIG } from '@/config/api';
import { getAccessToken } from '@/lib/token';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

// Base query with authentication (same as jlptApi)
const baseQuery = async (args: any) => {
  const { url, method = "GET", body } = typeof args === "string" ? { url: args } : args;
  
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
    const error = await response.json().catch(() => ({ message: response.statusText }));
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
  testType: 'full_test' | 'vocabulary' | 'grammar' | 'reading' | 'listening';
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
  section: 'vocabulary' | 'grammar' | 'reading' | 'listening';
  contentText: string;
  imageMediaId?: number | null;
  audioMediaId?: number | null;
  options?: string[]; // JSON array of 4 options
  correctOption?: number; // 1-4
  explanation?: string;
  points?: number; // default 1.0
}

export interface UpdateQuestionDTO extends Partial<CreateQuestionDTO> {}

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

export interface JlptQuestionAdmin {
  id: number;
  testId: number;
  mondaiNumber: number;
  mondaiTitle?: string;
  parentId?: number;
  questionOrder: number;
  section: string;
  contentText: string;
  imageMediaId?: number;
  audioMediaId?: number;
  imageUrl?: string; // populated from media_files
  audioUrl?: string; // populated from media_files
  options?: string[];
  correctOption?: number;
  explanation?: string;
  points: number;
  createdAt: string;
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
  reducerPath: 'adminJlptApi',
  baseQuery: baseQuery,
  tagTypes: ['AdminTest', 'AdminQuestion'],
  endpoints: (builder) => ({
    
    // ========================================================================
    // TEST MANAGEMENT
    // ========================================================================
    
    getAllTests: builder.query<PaginatedResponse<JlptTestAdmin>, {
      page?: number;
      size?: number;
      sortBy?: string;
      sortDir?: 'asc' | 'desc';
    }>({
      query: ({ page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc' }) =>
        `/jlpt-tests?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`,
      transformResponse: (response: ApiResponse<PaginatedResponse<JlptTestAdmin>>) => 
        response.data,
      providesTags: ['AdminTest'],
    }),

    getTestById: builder.query<JlptTestAdmin, number>({
      query: (id) => `/jlpt-tests/${id}`,
      transformResponse: (response: ApiResponse<JlptTestAdmin>) => response.data,
      providesTags: (result, error, id) => [{ type: 'AdminTest', id }],
    }),

    createTest: builder.mutation<JlptTestAdmin, CreateJlptTestDTO>({
      query: (body) => ({
        url: '/jlpt-tests',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<JlptTestAdmin>) => response.data,
      invalidatesTags: ['AdminTest'],
    }),

    updateTest: builder.mutation<JlptTestAdmin, { id: number; data: UpdateJlptTestDTO }>({
      query: ({ id, data }) => ({
        url: `/jlpt-tests/${id}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: ApiResponse<JlptTestAdmin>) => response.data,
      invalidatesTags: (result, error, { id }) => [{ type: 'AdminTest', id }, 'AdminTest'],
    }),

    deleteTest: builder.mutation<void, number>({
      query: (id) => ({
        url: `/jlpt-tests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminTest'],
    }),

    // ========================================================================
    // QUESTION MANAGEMENT
    // ========================================================================

    addQuestion: builder.mutation<JlptQuestionAdmin, { testId: number; data: CreateQuestionDTO }>({
      query: ({ testId, data }) => ({
        url: `/jlpt-tests/${testId}/questions`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<JlptQuestionAdmin>) => response.data,
      invalidatesTags: (result, error, { testId }) => [
        { type: 'AdminTest', id: testId },
        'AdminQuestion',
      ],
    }),

    updateQuestion: builder.mutation<JlptQuestionAdmin, { id: number; data: UpdateQuestionDTO }>({
      query: ({ id, data }) => ({
        url: `/jlpt-tests/questions/${id}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: ApiResponse<JlptQuestionAdmin>) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: 'AdminQuestion', id },
        'AdminTest',
      ],
    }),

    deleteQuestion: builder.mutation<void, number>({
      query: (id) => ({
        url: `/jlpt-tests/questions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminQuestion', 'AdminTest'],
    }),

    // ========================================================================
    // MEDIA UPLOAD
    // ========================================================================

    uploadImage: builder.mutation<MediaUploadResponse, FormData>({
      query: (formData) => ({
        url: '/media/upload/image',
        method: 'POST',
        body: formData,
      }),
      transformResponse: (response: ApiResponse<MediaUploadResponse>) => response.data,
    }),

    uploadAudio: builder.mutation<MediaUploadResponse, FormData>({
      query: (formData) => ({
        url: '/media/upload/audio',
        method: 'POST',
        body: formData,
      }),
      transformResponse: (response: ApiResponse<MediaUploadResponse>) => response.data,
    }),

    deleteMedia: builder.mutation<void, string>({
      query: (publicId) => ({
        url: `/media/${publicId}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useGetAllTestsQuery,
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
} = adminJlptApi;
