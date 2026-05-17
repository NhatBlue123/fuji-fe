import { baseApi } from "./baseApi";
import type {
  ApiEnvelope,
  BookingQuote,
  BookingStatusTab,
  BulkBookingQuote,
  CreateBookingRequest,
  CreateBookingResponse,
  CreateBulkBookingRequest,
  CreateBulkBookingResponse,
  DiscoveryResponse,
  MyBookingItem,
  MyTimeSlotItem,
  StudentBusySlot,
  StudentBusySlotsResponse,
  TeacherAvailabilityResponse,
  TeacherScheduleResponse,
  VideoSessionResponse,
  BookingDetail,
} from "@/types/booking";
import type { Weekday } from "@/components/user-component/booking-instructor/types";

export const bookingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDiscoverySlots: builder.query<
      DiscoveryResponse,
      { date: string; keyword?: string; teacherId?: number }
    >({
      query: ({ date, keyword, teacherId }) => {
        const qs = new URLSearchParams();
        qs.set("date", date);
        if (keyword) qs.set("keyword", keyword);
        if (teacherId) qs.set("teacherId", String(teacherId));
        return `/time-slots/discovery?${qs.toString()}`;
      },
      transformResponse: (res: ApiEnvelope<DiscoveryResponse>) => res.data,
      providesTags: [{ type: "Booking", id: "DISCOVERY" }],
    }),

    getTeacherAvailability: builder.query<
      TeacherAvailabilityResponse,
      { teacherId: number; fromDate: string; toDate: string }
    >({
      query: ({ teacherId, fromDate, toDate }) =>
        `/time-slots/teacher/${teacherId}/availability?fromDate=${fromDate}&toDate=${toDate}`,
      transformResponse: (res: ApiEnvelope<TeacherAvailabilityResponse>) => res.data,
      providesTags: (_r, _e, arg) => [{ type: "Booking", id: `TEACHER_${arg.teacherId}` }],
    }),

    getMyTeacherSchedule: builder.query<
      TeacherScheduleResponse,
      { fromDate: string; toDate: string }
    >({
      query: ({ fromDate, toDate }) =>
        `/time-slots/me/schedule?fromDate=${fromDate}&toDate=${toDate}`,
      transformResponse: (res: ApiEnvelope<TeacherScheduleResponse>) => res.data,
      providesTags: [{ type: "Booking", id: "MY_TEACHER_SCHEDULE" }],
    }),

    getBookingQuote: builder.query<BookingQuote, { timeSlotId: number; couponCode?: string }>({
      query: ({ timeSlotId, couponCode }) => {
        const qs = new URLSearchParams();
        qs.set("timeSlotId", String(timeSlotId));
        if (couponCode) qs.set("couponCode", couponCode);
        return `/bookings/quote?${qs.toString()}`;
      },
      transformResponse: (res: ApiEnvelope<BookingQuote>) => res.data,
      providesTags: (_r, _e, arg) => [
        { type: "Booking", id: `QUOTE_${arg.timeSlotId}_${arg.couponCode || "NO_COUPON"}` },
      ],
    }),

    getBulkBookingQuote: builder.mutation<
      BulkBookingQuote,
      { teacherId: number; timeSlotIds: number[]; couponCode?: string }
    >({
      query: (body) => ({
        url: "/bookings/quote-bulk",
        method: "POST",
        body,
      }),
      transformResponse: (res: ApiEnvelope<BulkBookingQuote>) => res.data,
    }),

    createBooking: builder.mutation<CreateBookingResponse, CreateBookingRequest>({
      query: (body) => ({
        url: "/bookings",
        method: "POST",
        body,
      }),
      transformResponse: (res: ApiEnvelope<CreateBookingResponse>) => res.data,
      invalidatesTags: [
        { type: "Booking", id: "DISCOVERY" },
        { type: "Booking", id: "MY_BOOKINGS" },
        "UserMonetization",
      ],
    }),

    createBulkBooking: builder.mutation<
      CreateBulkBookingResponse,
      CreateBulkBookingRequest
    >({
      query: (body) => ({
        url: "/bookings/bulk",
        method: "POST",
        body,
      }),
      transformResponse: (res: ApiEnvelope<CreateBulkBookingResponse>) => res.data,
      invalidatesTags: [
        { type: "Booking", id: "DISCOVERY" },
        { type: "Booking", id: "MY_BOOKINGS" },
        "UserMonetization",
      ],
    }),

    getMyBookings: builder.query<MyBookingItem[], { status: BookingStatusTab }>({
      query: ({ status }) => `/bookings/me?status=${status}`,
      transformResponse: (res: ApiEnvelope<MyBookingItem[]>) => res.data,
      providesTags: [{ type: "Booking", id: "MY_BOOKINGS" }],
    }),

    getBookingDetail: builder.query<BookingDetail, { bookingId: number }>({
      query: ({ bookingId }) => `/bookings/${bookingId}`,
      transformResponse: (res: ApiEnvelope<BookingDetail>) => res.data,
      providesTags: (_r, _e, { bookingId }) => [{ type: "Booking", id: `DETAIL_${bookingId}` }],
    }),

    cancelBooking: builder.mutation<{ message: string }, { bookingId: number }>({
      query: ({ bookingId }) => ({
        url: `/bookings/${bookingId}/cancel`,
        method: "POST",
      }),
      transformResponse: (res: ApiEnvelope<string>) => ({
        message: res.message || "Booking cancelled",
      }),
      invalidatesTags: [
        { type: "Booking", id: "DISCOVERY" },
        { type: "Booking", id: "MY_BOOKINGS" },
        "UserMonetization",
      ],
    }),

    cancelBookingByTeacher: builder.mutation<{ message: string }, { bookingId: number }>({
      query: ({ bookingId }) => ({
        url: `/bookings/${bookingId}/teacher-cancel`,
        method: "POST",
      }),
      transformResponse: (res: ApiEnvelope<string>) => ({
        message: res.message || "Booking cancelled",
      }),
      invalidatesTags: [
        { type: "Booking", id: "DISCOVERY" },
        { type: "Booking", id: "MY_BOOKINGS" },
        "UserMonetization",
      ],
    }),

    endBookingVideoSession: builder.mutation<{ message: string }, { bookingId: number }>({
      query: ({ bookingId }) => ({
        url: `/bookings/${bookingId}/video-session/end`,
        method: "POST",
      }),
      transformResponse: (res: ApiEnvelope<string>) => ({
        message: res.message || "Buổi học đã kết thúc",
      }),
      invalidatesTags: [{ type: "Booking", id: "MY_BOOKINGS" }],
    }),

    getMyTimeSlots: builder.query<MyTimeSlotItem[], void>({
      query: () => `/time-slots/me`,
      transformResponse: (res: ApiEnvelope<MyTimeSlotItem[]>) => res.data,
      providesTags: [{ type: "Booking", id: "MY_SLOTS" }],
    }),

    createBulkSlot: builder.mutation<
      { requested: number; created: number; skipped: number; conflicts: { startAt: string; endAt: string; reason: string }[] },
      {
        dateFrom: string;
        dateTo: string;
        daysOfWeek: Weekday[];
        timeRanges: { start: string; end: string }[];
        price: number;
        subject: string;
      }
    >({
      query: (body) => ({
        url: "/time-slots/bulk",
        method: "POST",
        body,
      }),
      transformResponse: (res: ApiEnvelope<{ requested: number; created: number; skipped: number; conflicts: { startAt: string; endAt: string; reason: string }[] }>) => res.data,
      invalidatesTags: [{ type: "Booking", id: "MY_TEACHER_SCHEDULE" }],
    }),

    deleteTimeSlot: builder.mutation<void, number>({
      query: (id) => ({
        url: `/time-slots/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Booking" }],
    }),

    updateTimeSlot: builder.mutation<
      unknown,
      { id: number; price?: number; subject?: string; startAt?: string; endAt?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/time-slots/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: (res: ApiEnvelope<unknown>) => res,
      invalidatesTags: [{ type: "Booking" }],
    }),

    getVideoSession: builder.mutation<VideoSessionResponse, { bookingId: number }>({
      query: ({ bookingId }) => ({
        url: `/bookings/${bookingId}/video-session`,
        method: "POST",
      }),
      transformResponse: (res: ApiEnvelope<VideoSessionResponse>) => res.data,
    }),

    submitSessionReview: builder.mutation<
      { reviewId: number; rating: number; comment: string },
      { bookingId: number; rating: number; comment?: string }
    >({
      query: ({ bookingId, ...body }) => ({
        url: `/bookings/${bookingId}/review`,
        method: "POST",
        body,
      }),
      transformResponse: (res: ApiEnvelope<{ reviewId: number; rating: number; comment: string }>) => res.data,
      invalidatesTags: [{ type: "Booking", id: "MY_BOOKINGS" }],
    }),

    getMyBusySlots: builder.query<StudentBusySlotsResponse, { date: string }>({
      query: ({ date }) => `/bookings/me/busy-slots?date=${date}`,
      transformResponse: (res: ApiEnvelope<StudentBusySlotsResponse>) => res.data,
    }),

    getMyBusySlotsInRange: builder.query<StudentBusySlot[], { fromDate: string; toDate: string }>({
      query: ({ fromDate, toDate }) =>
        `/bookings/me/busy-slots-range?fromDate=${fromDate}&toDate=${toDate}`,
      transformResponse: (res: ApiEnvelope<StudentBusySlot[]>) => res.data,
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetDiscoverySlotsQuery,
  useGetTeacherAvailabilityQuery,
  useGetBookingQuoteQuery,
  useGetBulkBookingQuoteMutation,
  useCreateBookingMutation,
  useCreateBulkBookingMutation,
  useGetMyBookingsQuery,
  useGetBookingDetailQuery,
  useGetMyTimeSlotsQuery,
  useDeleteTimeSlotMutation,
  useUpdateTimeSlotMutation,
  useCancelBookingMutation,
  useCancelBookingByTeacherMutation,
  useEndBookingVideoSessionMutation,
  useGetMyTeacherScheduleQuery,
  useGetVideoSessionMutation,
  useSubmitSessionReviewMutation,
  useGetMyBusySlotsQuery,
  useGetMyBusySlotsInRangeQuery,
  useCreateBulkSlotMutation,
} = bookingApi;
