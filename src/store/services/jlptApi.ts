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
import type { AnswerReview, QuestionReportPayload, QuestionReport } from "@/types/jlpt-review";
import type { SystemReport } from "@/types/admin-reports";

// Base query with authentication
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
      { level?: JLPTLevel; testType?: string; page?: number; size?: number; search?: string }
    >({
      query: ({ level, testType, page = 0, size = 10, search = "" }) => {
        let url = `/jlpt-tests/published?page=${page}&size=${size}`;
        if (level) {
          url += `&level=${level}`;
        }
        if (testType && testType !== "all") {
          url += `&testType=${testType}`;
        }
        if (search) {
          url += `&search=${encodeURIComponent(search)}`;
        }
        return url;
      },
      transformResponse: (response: ApiResponse<PaginatedResponse<JlptTest>>) =>
        response.data,
      providesTags: ["JlptTests"],
    }),

    // Get all tests (for admin)
    getAllTests: builder.query<
      PaginatedResponse<JlptTest>,
      { page?: number; size?: number; sortBy?: string; sortDir?: string }
    >({
      query: ({
        page = 0,
        size = 10,
        sortBy = "createdAt",
        sortDir = "desc",
      }) =>
        `/jlpt-tests?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`,
      transformResponse: (response: ApiResponse<PaginatedResponse<JlptTest>>) =>
        response.data,
      providesTags: ["JlptTests"],
    }),

    // Get test by ID with questions
    getTestById: builder.query<JlptTest, number>({
      query: (id) => `/jlpt-tests/${id}`,
      transformResponse: (response: ApiResponse<JlptTest>) => {
        const test = response.data;
        // Helper to parse options for a question and its children
        const parseQuestion = (q: any) => {
          if (q.options && typeof q.options === "string") {
            try {
              q.options = JSON.parse(q.options);
            } catch (e) {
              console.error("Failed to parse options", e);
              q.options = [];
            }
          }
          if (q.children) {
            q.children.forEach(parseQuestion);
          }
        };

        if (test.questions) {
          test.questions.forEach(parseQuestion);
        }
        return test;
      },
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

    // Get attempt result by ID
    getAttemptById: builder.query<TestAttemptResult, number>({
      query: (id) => `/jlpt-test-attempts/${id}`,
      transformResponse: (response: ApiResponse<TestAttemptResult>) =>
        response.data,
      providesTags: (result, error, id) => [{ type: "JlptAttempts", id }],
    }),

    // Get current user's attempts
    getMyAttempts: builder.query<TestAttemptResult[], void>({
      query: () => "/jlpt-test-attempts/my-attempts",
      transformResponse: (response: ApiResponse<TestAttemptResult[]>) =>
        response.data,
      providesTags: ["JlptAttempts"],
    }),

    // Get attempt review details (per-question)
    getAttemptReview: builder.query<AnswerReview[], number>({
      query: (id) => `/jlpt-test-attempts/${id}/review`,
      transformResponse: (response: ApiResponse<AnswerReview[]>) =>
        response.data,
      providesTags: (result, error, id) => [{ type: "JlptAttempts", id }],
    }),

    // Create question report
    createQuestionReport: builder.mutation<QuestionReport, QuestionReportPayload>({
      query: (body) => ({
        url: "/jlpt-question-reports",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<QuestionReport>) =>
        response.data,
    }),
    reportViolation: builder.mutation<void, { type: string; severity?: string; testId?: string; description?: string }>({
      query: (body) => ({
        url: "/users/me/violations/report",
        method: "POST",
        body,
      }),
    }),

    // Optional feedback for overall JLPT test quality (not per-question report)
    createExamFeedback: builder.mutation<
      SystemReport,
      { testId: number; attemptId: number; feedback: string; testTitle?: string }
    >({
      query: ({ testId, attemptId, feedback, testTitle }) => ({
        url: "/reports",
        method: "POST",
        body: {
          category: "OTHER",
          title: `Feedback đề JLPT${testTitle ? ` - ${testTitle}` : ""} (attempt ${attemptId})`,
          description: feedback,
          priority: "MEDIUM",
          subjectType: "JLPT_TEST_FEEDBACK",
          subjectId: String(testId),
        },
      }),
      transformResponse: (response: ApiResponse<SystemReport>) => response.data,
    }),
  }),
});

export const {
  useGetPublishedTestsQuery,
  useGetAllTestsQuery,
  useGetTestByIdQuery,
  useSubmitTestMutation,
  useGetAttemptByIdQuery,
  useGetMyAttemptsQuery,
  useGetAttemptReviewQuery,
  useReportViolationMutation,
  useCreateQuestionReportMutation,
  useCreateExamFeedbackMutation,
} = jlptApi;
