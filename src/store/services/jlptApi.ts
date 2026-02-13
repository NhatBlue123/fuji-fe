import { createApi } from "@reduxjs/toolkit/query/react";
import { API_CONFIG } from "@/config/api";
import { getAccessToken } from "@/lib/token";
import type {
  JlptTest,
  JLPTLevel,
  TestAttemptSubmission,
  TestAttemptResult,
  PaginatedResponse,
} from "@/types/jlpt";

// Base query with authentication
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

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const jlptApi = createApi({
  reducerPath: "jlptApi",
  baseQuery,
  tagTypes: ["JlptTests", "JlptAttempts"],
  endpoints: (builder) => ({
    // Get published tests by level (for students)
    getPublishedTests: builder.query<
      PaginatedResponse<JlptTest>,
      { level: JLPTLevel; page?: number; size?: number }
    >({
      query: ({ level, page = 0, size = 10 }) =>
        `/jlpt-tests/published?level=${level}&page=${page}&size=${size}`,
      transformResponse: (response: ApiResponse<PaginatedResponse<JlptTest>>) =>
        response.data,
      providesTags: ["JlptTests"],
    }),

    // Get all tests (for admin)
    getAllTests: builder.query<
      PaginatedResponse<JlptTest>,
      { page?: number; size?: number; sortBy?: string; sortDir?: string }
    >({
      query: ({ page = 0, size = 10, sortBy = "createdAt", sortDir = "desc" }) =>
        `/jlpt-tests?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`,
      transformResponse: (response: ApiResponse<PaginatedResponse<JlptTest>>) =>
        response.data,
      providesTags: ["JlptTests"],
    }),

    // Get test by ID with questions
    getTestById: builder.query<JlptTest, number>({
      query: (id) => `/jlpt-tests/${id}`,
      transformResponse: (response: ApiResponse<JlptTest>) => response.data,
      providesTags: (result, error, id) => [{ type: "JlptTests", id }],
    }),

    // Submit test attempt
    submitTest: builder.mutation<TestAttemptResult, TestAttemptSubmission>({
      query: (data) => ({
        url: "/jlpt-tests/submit",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: ApiResponse<TestAttemptResult>) =>
        response.data,
      invalidatesTags: ["JlptAttempts"],
    }),
  }),
});

export const {
  useGetPublishedTestsQuery,
  useGetAllTestsQuery,
  useGetTestByIdQuery,
  useSubmitTestMutation,
} = jlptApi;
