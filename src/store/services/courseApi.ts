// RTK Query API cho Course Management
import { createApi } from "@reduxjs/toolkit/query/react";
import type { FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import { API_CONFIG } from "@/config/api";
import { getAccessToken, setAccessToken } from "@/lib/token";
import type {
  CourseResponseDTO,
  CourseListParams,
  RatingResponseDTO,
  RatingRequestDTO,
  LessonResponseDTO,
  InstructorDTO,
  PageResponse,
  ApiResponse,
} from "@/types/course";

// ─── Base query with auth ──────────────────────────────

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

const baseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.BASE_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    if (isRefreshing && refreshPromise) {
      const success = await refreshPromise;
      if (success) {
        result = await baseQuery(args, api, extraOptions);
      }
    } else {
      isRefreshing = true;
      refreshPromise = (async (): Promise<boolean> => {
        try {
          const refreshResult = await baseQuery(
            { url: "/auth/refresh", method: "POST" },
            api,
            extraOptions,
          );
          const apiResp = refreshResult.data as
            | { success?: boolean; data?: { accessToken: string } }
            | undefined;
          if (apiResp?.data?.accessToken) {
            setAccessToken(apiResp.data.accessToken);
            return true;
          }
          return false;
        } catch {
          return false;
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      })();
      const success = await refreshPromise;
      if (success) {
        result = await baseQuery(args, api, extraOptions);
      }
    }
  }

  return result;
};

// ─── Helper ────────────────────────────────────────────

function toQueryString(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== "") {
      parts.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`,
      );
    }
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

// ─── Course API ────────────────────────────────────────

export const courseApi = createApi({
  reducerPath: "courseApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Course", "Lesson", "Rating"],
  endpoints: (builder) => ({
    // ==================== COURSE CRUD ====================

    getAllCourses: builder.query<
      PageResponse<CourseResponseDTO>,
      CourseListParams | void
    >({
      query: (params) =>
        `/courses${toQueryString((params as Record<string, unknown>) || {})}`,
      transformResponse: (
        response: ApiResponse<PageResponse<CourseResponseDTO>>,
      ) => response.data!,
      providesTags: (result) =>
        result
          ? [
              ...result.content.map(({ id }) => ({
                type: "Course" as const,
                id,
              })),
              { type: "Course", id: "LIST" },
            ]
          : [{ type: "Course", id: "LIST" }],
    }),

    getCourseById: builder.query<CourseResponseDTO, number>({
      query: (id) => `/courses/${id}`,
      transformResponse: (response: ApiResponse<CourseResponseDTO>) =>
        response.data!,
      providesTags: (_result, _error, id) => [{ type: "Course", id }],
    }),

    createCourse: builder.mutation<CourseResponseDTO, { course: FormData }>({
      query: ({ course }) => ({
        url: "/courses",
        method: "POST",
        body: course,
      }),
      transformResponse: (response: ApiResponse<CourseResponseDTO>) =>
        response.data!,
      invalidatesTags: [{ type: "Course", id: "LIST" }],
    }),

    updateCourse: builder.mutation<
      CourseResponseDTO,
      { id: number; course: FormData }
    >({
      query: ({ id, course }) => ({
        url: `/courses/${id}`,
        method: "PATCH",
        body: course,
      }),
      transformResponse: (response: ApiResponse<CourseResponseDTO>) =>
        response.data!,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Course", id },
        { type: "Course", id: "LIST" },
      ],
    }),

    deleteCourse: builder.mutation<void, number>({
      query: (id) => ({
        url: `/courses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Course", id: "LIST" }],
    }),

    purchaseCourse: builder.mutation<
      ApiResponse<null>,
      { courseId: number; discountCode?: string }
    >({
      query: ({ courseId, discountCode }) => ({
        url: `/courses/${courseId}/buy`,
        method: "POST",
        body: discountCode ? { discountCode } : {},
      }),
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: "Course", id: courseId },
        { type: "Course", id: "LIST" },
        { type: "Lesson", id: "LIST" }, // Invalidate lessons to refresh access status
        "Wallet",
        "Payment",
      ],
    }),

    previewDiscount: builder.query<
      {
        code: string;
        originalPrice: number;
        discountAmount: number;
        finalPrice: number;
        discountType: "PERCENT" | "FIXED_AMOUNT" | null;
        discountPercent: number | null;
        valid: boolean;
        message: string;
      },
      { courseId: number; code: string }
    >({
      query: ({ courseId, code }) => ({
        url: `/courses/${courseId}/preview-discount`,
        params: { code },
      }),
      transformResponse: (res: ApiResponse<any>) => res.data,
    }),

    // ==================== RATING ====================

    rateCourse: builder.mutation<
      RatingResponseDTO,
      { courseId: number; body: RatingRequestDTO }
    >({
      query: ({ courseId, body }) => ({
        url: `/courses/${courseId}/rate`,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<RatingResponseDTO>) =>
        response.data!,
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: "Course", id: courseId },
        { type: "Rating", id: courseId },
      ],
    }),

    getCourseRatings: builder.query<RatingResponseDTO[], number>({
      query: (courseId) => `/courses/${courseId}/ratings`,
      transformResponse: (response: ApiResponse<RatingResponseDTO[]>) =>
        response.data!,
      providesTags: (_result, _error, courseId) => [
        { type: "Rating", id: courseId },
      ],
    }),

    updateCourseRating: builder.mutation<
      RatingResponseDTO,
      { courseId: number; ratingId: number; body: RatingRequestDTO }
    >({
      query: ({ courseId, ratingId, body }) => ({
        url: `/courses/${courseId}/ratings/${ratingId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiResponse<RatingResponseDTO>) =>
        response.data!,
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: "Rating", id: courseId },
        { type: "Course", id: courseId },
      ],
    }),

    deleteCourseRating: builder.mutation<
      void,
      { courseId: number; ratingId: number }
    >({
      query: ({ courseId, ratingId }) => ({
        url: `/courses/${courseId}/ratings/${ratingId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: "Rating", id: courseId },
        { type: "Course", id: courseId },
      ],
    }),

    likeCourseRating: builder.mutation<
      void,
      { courseId: number; ratingId: number }
    >({
      query: ({ courseId, ratingId }) => ({
        url: `/courses/${courseId}/ratings/${ratingId}/like`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: "Rating", id: courseId },
      ],
    }),

    unlikeCourseRating: builder.mutation<
      void,
      { courseId: number; ratingId: number }
    >({
      query: ({ courseId, ratingId }) => ({
        url: `/courses/${courseId}/ratings/${ratingId}/like`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: "Rating", id: courseId },
      ],
    }),

    // ==================== LESSON ====================

    getLessonsByCourse: builder.query<LessonResponseDTO[], number>({
      query: (courseId) => `/lessons/course/${courseId}`,
      transformResponse: (response: ApiResponse<LessonResponseDTO[]>) =>
        response.data!,
      providesTags: (result, _error, courseId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Lesson" as const, id })),
              { type: "Lesson", id: `COURSE_${courseId}` },
            ]
          : [{ type: "Lesson", id: `COURSE_${courseId}` }],
    }),

    getLessonById: builder.query<LessonResponseDTO, number>({
      query: (id) => `/lessons/${id}`,
      transformResponse: (response: ApiResponse<LessonResponseDTO>) =>
        response.data!,
      providesTags: (_result, _error, id) => [{ type: "Lesson", id }],
    }),

    createLesson: builder.mutation<LessonResponseDTO, FormData>({
      query: (formData) => ({
        url: "/lessons",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response: ApiResponse<LessonResponseDTO>) =>
        response.data!,
      invalidatesTags: [{ type: "Lesson" }, { type: "Course", id: "LIST" }],
    }),

    updateLesson: builder.mutation<
      LessonResponseDTO,
      { id: number; formData: FormData }
    >({
      query: ({ id, formData }) => ({
        url: `/lessons/${id}`,
        method: "PATCH",
        body: formData,
      }),
      transformResponse: (response: ApiResponse<LessonResponseDTO>) =>
        response.data!,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Lesson", id }],
    }),

    deleteLesson: builder.mutation<
      void,
      { lessonId: number; courseId: number }
    >({
      query: ({ lessonId, courseId }) => ({
        url: `/lessons/${lessonId}/course/${courseId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: "Lesson", id: `COURSE_${courseId}` },
        { type: "Course", id: courseId },
      ],
    }),

    // ==================== MEDIA ====================

    uploadAudio: builder.mutation<{ url: string }, FormData>({
      query: (formData) => ({
        url: "/media/upload/audio",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response: ApiResponse<{ url: string }>) =>
        response.data!,
    }),

    // ==================== USERS ====================

    searchCourses: builder.query<
      PageResponse<CourseResponseDTO>,
      {
        keyword: string;
        page?: number;
        size?: number;
        level?: string;
        category?: "all" | "free" | "paid" | "mine";
      }
    >({
      query: ({ keyword, page = 0, size = 10, level, category }) =>
        `/courses/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}${level ? `&level=${encodeURIComponent(level)}` : ""}${category ? `&category=${encodeURIComponent(category)}` : ""}`,
      transformResponse: (
        response: ApiResponse<PageResponse<CourseResponseDTO>>,
      ) => response.data!,
      providesTags: [{ type: "Course", id: "LIST" }],
    }),

    trackLessonProgress: builder.mutation<
      ApiResponse<void>,
      { courseId: number; lessonId: number }
    >({
      query: ({ courseId, lessonId }) => ({
        url: `/courses/${courseId}/lessons/${lessonId}/track`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: "Course", id: courseId },
      ],
    }),

    completeLesson: builder.mutation<
      ApiResponse<void>,
      { courseId: number; lessonId: number }
    >({
      query: ({ lessonId }) => ({
        url: `/lessons/${lessonId}/complete`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { courseId, lessonId }) => [
        { type: "Course", id: courseId },
        { type: "Lesson", id: lessonId },
        { type: "Lesson", id: `COURSE_${courseId}` },
      ],
    }),

    getInstructors: builder.query<InstructorDTO[], void>({
      query: () => "/users/instructors",
      transformResponse: (response: ApiResponse<InstructorDTO[]>) =>
        response.data!,
    }),
  }),
});

export const {
  useGetAllCoursesQuery,
  useGetCourseByIdQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  usePurchaseCourseMutation,
  usePreviewDiscountQuery,
  useLazyPreviewDiscountQuery,
  useRateCourseMutation,
  useGetCourseRatingsQuery,
  useUpdateCourseRatingMutation,
  useDeleteCourseRatingMutation,
  useLikeCourseRatingMutation,
  useUnlikeCourseRatingMutation,
  useGetLessonsByCourseQuery,
  useGetLessonByIdQuery,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
  useUploadAudioMutation,
  useSearchCoursesQuery,
  useTrackLessonProgressMutation,
  useCompleteLessonMutation,
  useGetInstructorsQuery,
} = courseApi;
