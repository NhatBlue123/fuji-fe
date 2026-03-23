// D:\Cap2\FE\fuji-fe\src\store\services\bookingApi.ts
import { baseApi } from "./baseApi";
import type {
  ApiEnvelope,
  BookingQuote,
  BookingStatusTab,
  CreateBookingRequest,
  CreateBookingResponse,
  DiscoveryResponse,
  MyBookingItem,
} from "@/types/booking";

export const bookingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1) Discovery slots (booking list page)
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

    // 2) Quote booking (bookappointment page)
    getBookingQuote: builder.query<BookingQuote, { timeSlotId: number }>({
      query: ({ timeSlotId }) => `/bookings/quote?timeSlotId=${timeSlotId}`,
      transformResponse: (res: ApiEnvelope<BookingQuote>) => res.data,
      providesTags: (_r, _e, arg) => [
        { type: "Booking", id: `QUOTE_${arg.timeSlotId}` },
      ],
    }),

    // 3) Create booking
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

    // 4) My bookings (bookingmodal tabs)
    getMyBookings: builder.query<MyBookingItem[], { status: BookingStatusTab }>({
      query: ({ status }) => `/bookings/me?status=${status}`,
      transformResponse: (res: ApiEnvelope<MyBookingItem[]>) => res.data,
      providesTags: [{ type: "Booking", id: "MY_BOOKINGS" }],
    }),

    // 5) Cancel booking
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
  useGetBookingQuoteQuery,
  useLazyGetBookingQuoteQuery,
  useCreateBookingMutation,
  useGetMyBookingsQuery,
  useCancelBookingMutation,
} = bookingApi;
