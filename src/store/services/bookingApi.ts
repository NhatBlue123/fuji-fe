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
  TeacherAvailabilityResponse,
  TeacherScheduleResponse,
} from "@/types/booking";

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

    getBookingQuote: builder.query<BookingQuote, { timeSlotId: number }>({
      query: ({ timeSlotId }) => `/bookings/quote?timeSlotId=${timeSlotId}`,
      transformResponse: (res: ApiEnvelope<BookingQuote>) => res.data,
      providesTags: (_r, _e, arg) => [{ type: "Booking", id: `QUOTE_${arg.timeSlotId}` }],
    }),

    getBulkBookingQuote: builder.mutation<
      BulkBookingQuote,
      { teacherId: number; timeSlotIds: number[] }
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
      ],
    }),

    getMyBookings: builder.query<MyBookingItem[], { status: BookingStatusTab }>({
      query: ({ status }) => `/bookings/me?status=${status}`,
      transformResponse: (res: ApiEnvelope<MyBookingItem[]>) => res.data,
      providesTags: [{ type: "Booking", id: "MY_BOOKINGS" }],
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
      ],
    }),
  }),
});

export const {
  useGetDiscoverySlotsQuery,
  useGetTeacherAvailabilityQuery,
  useGetBookingQuoteQuery,
  useGetBulkBookingQuoteMutation,
  useCreateBookingMutation,
  useCreateBulkBookingMutation,
  useGetMyBookingsQuery,
  useCancelBookingMutation,
  useGetMyTeacherScheduleQuery,
} = bookingApi;
