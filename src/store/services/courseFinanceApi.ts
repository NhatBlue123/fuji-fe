import { baseApi } from "@/store/services/baseApi";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type {
  CourseDiscount,
  CourseFinanceCourse,
  CourseFinanceSummary,
  CreateCourseDiscountPayload,
  CreateGlobalDiscountPayload,
  DeleteCourseDiscountPayload,
  GetCourseFinanceCoursesParams,
  UpdateCourseDiscountPayload,
  UpdateCoursePricePayload,
  UpdateGlobalDiscountPayload,
} from "@/types/course-finance";

export const courseFinanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCourseFinanceCourses: builder.query<
      PaginatedResponse<CourseFinanceCourse>,
      GetCourseFinanceCoursesParams | void
    >({
      query: (params) => ({
        url: "/course-finance/courses",
        params: params || {},
      }),
      transformResponse: (
        res: ApiResponse<PaginatedResponse<CourseFinanceCourse>>,
      ) => res.data,
      providesTags: (result) => {
        const baseTag = [{ type: "CourseFinance" as const, id: "LIST" }];
        if (!result?.content) return baseTag;
        return [
          ...baseTag,
          ...result.content.map((item) => ({
            type: "CourseFinance" as const,
            id: `COURSE_${item.courseId}`,
          })),
        ];
      },
    }),

    getCourseFinanceSummary: builder.query<CourseFinanceSummary, void>({
      query: () => "/course-finance/summary",
      transformResponse: (res: ApiResponse<CourseFinanceSummary>) => res.data,
      providesTags: [{ type: "CourseFinance", id: "SUMMARY" }],
    }),

    updateCourseFinancePrice: builder.mutation<
      CourseFinanceCourse,
      UpdateCoursePricePayload
    >({
      query: ({ courseId, price }) => ({
        url: `/course-finance/courses/${courseId}/price`,
        method: "PATCH",
        body: { price },
      }),
      transformResponse: (res: ApiResponse<CourseFinanceCourse>) => res.data,
      invalidatesTags: (_res, _err, arg) => [
        { type: "CourseFinance", id: "LIST" },
        { type: "CourseFinance", id: "SUMMARY" },
        { type: "CourseFinance", id: `COURSE_${arg.courseId}` },
      ],
    }),

    getCourseDiscounts: builder.query<CourseDiscount[], number>({
      query: (courseId) => `/course-finance/courses/${courseId}/discounts`,
      transformResponse: (res: ApiResponse<CourseDiscount[]>) => res.data,
      providesTags: (_res, _err, courseId) => [
        { type: "CourseFinance", id: `DISCOUNTS_${courseId}` },
      ],
    }),

    createCourseDiscount: builder.mutation<
      CourseDiscount,
      CreateCourseDiscountPayload
    >({
      query: ({ courseId, ...payload }) => ({
        url: `/course-finance/courses/${courseId}/discounts`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (res: ApiResponse<CourseDiscount>) => res.data,
      invalidatesTags: (_res, _err, arg) => [
        { type: "CourseFinance", id: "LIST" },
        { type: "CourseFinance", id: "SUMMARY" },
        { type: "CourseFinance", id: `DISCOUNTS_${arg.courseId}` },
        { type: "CourseFinance", id: `COURSE_${arg.courseId}` },
      ],
    }),

    updateCourseDiscount: builder.mutation<
      CourseDiscount,
      UpdateCourseDiscountPayload
    >({
      query: ({ courseId, discountId, ...payload }) => ({
        url: `/course-finance/courses/${courseId}/discounts/${discountId}`,
        method: "PATCH",
        body: payload,
      }),
      transformResponse: (res: ApiResponse<CourseDiscount>) => res.data,
      invalidatesTags: (_res, _err, arg) => [
        { type: "CourseFinance", id: "LIST" },
        { type: "CourseFinance", id: "SUMMARY" },
        { type: "CourseFinance", id: `DISCOUNTS_${arg.courseId}` },
        { type: "CourseFinance", id: `COURSE_${arg.courseId}` },
      ],
    }),

    deleteCourseDiscount: builder.mutation<void, DeleteCourseDiscountPayload>({
      query: ({ courseId, discountId }) => ({
        url: `/course-finance/courses/${courseId}/discounts/${discountId}`,
        method: "DELETE",
      }),
      transformResponse: () => undefined,
      invalidatesTags: (_res, _err, arg) => [
        { type: "CourseFinance", id: "LIST" },
        { type: "CourseFinance", id: "SUMMARY" },
        { type: "CourseFinance", id: `DISCOUNTS_${arg.courseId}` },
        { type: "CourseFinance", id: `COURSE_${arg.courseId}` },
      ],
    }),

    getGlobalDiscounts: builder.query<CourseDiscount[], void>({
      query: () => "/course-finance/discounts/global",
      transformResponse: (res: ApiResponse<CourseDiscount[]>) => res.data,
      providesTags: [{ type: "CourseFinance", id: "GLOBAL_DISCOUNTS" }],
    }),

    createGlobalDiscount: builder.mutation<CourseDiscount, CreateGlobalDiscountPayload>({
      query: (payload) => ({
        url: "/course-finance/discounts/global",
        method: "POST",
        body: payload,
      }),
      transformResponse: (res: ApiResponse<CourseDiscount>) => res.data,
      invalidatesTags: [
        { type: "CourseFinance", id: "GLOBAL_DISCOUNTS" },
        { type: "CourseFinance", id: "SUMMARY" },
      ],
    }),

    updateGlobalDiscount: builder.mutation<CourseDiscount, UpdateGlobalDiscountPayload>({
      query: ({ discountId, ...payload }) => ({
        url: `/course-finance/discounts/global/${discountId}`,
        method: "PATCH",
        body: payload,
      }),
      transformResponse: (res: ApiResponse<CourseDiscount>) => res.data,
      invalidatesTags: [
        { type: "CourseFinance", id: "GLOBAL_DISCOUNTS" },
        { type: "CourseFinance", id: "SUMMARY" },
      ],
    }),

    deleteGlobalDiscount: builder.mutation<void, number>({
      query: (discountId) => ({
        url: `/course-finance/discounts/global/${discountId}`,
        method: "DELETE",
      }),
      transformResponse: () => undefined,
      invalidatesTags: [
        { type: "CourseFinance", id: "GLOBAL_DISCOUNTS" },
        { type: "CourseFinance", id: "SUMMARY" },
      ],
    }),
  }),
});

export const {
  useGetCourseFinanceCoursesQuery,
  useGetCourseFinanceSummaryQuery,
  useUpdateCourseFinancePriceMutation,
  useGetCourseDiscountsQuery,
  useCreateCourseDiscountMutation,
  useUpdateCourseDiscountMutation,
  useDeleteCourseDiscountMutation,
  useGetGlobalDiscountsQuery,
  useCreateGlobalDiscountMutation,
  useUpdateGlobalDiscountMutation,
  useDeleteGlobalDiscountMutation,
} = courseFinanceApi;
