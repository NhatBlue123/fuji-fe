import { baseApi } from "../baseApi";

type ApiEnvelope<T> = { data?: T };

const unwrapData = <T,>(res: unknown, fallback: T): T => {
  if (res && typeof res === "object" && "data" in res) {
    return (res as ApiEnvelope<T>).data ?? fallback;
  }
  return (res as T) ?? fallback;
};

export interface BookingPolicy {
  id: number;
  defaultServiceFeeBps: number;
  proServiceFeeBps?: number | null;
  premiumServiceFeeBps?: number | null;
  normalCancelPenaltyBps: number;
  lateCancelPenaltyBps: number;
  lateCancelThresholdHours: number;
  teacherCancelRefundBps: number;
  noShowPenaltyBps: number;
  active: boolean;
}

export interface BookingHold {
  id: number;
  bookingId: number;
  userId: number;
  amountHoa: number;
  heldAmountHoa: number;
  capturedAmountHoa: number;
  releasedAmountHoa: number;
  status: string;
  expiresAt?: string;
}

export const bookingPolicyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBookingPolicy: builder.query<BookingPolicy, void>({
      query: () => "/admin/booking-policy",
      transformResponse: (res: unknown) => unwrapData<BookingPolicy>(res, res as BookingPolicy),
      providesTags: ["BookingPolicy"],
    }),
    updateBookingPolicy: builder.mutation<BookingPolicy, Partial<BookingPolicy>>({
      query: (body) => ({ url: "/admin/booking-policy", method: "PUT", body }),
      transformResponse: (res: unknown) => unwrapData<BookingPolicy>(res, res as BookingPolicy),
      invalidatesTags: ["BookingPolicy"],
    }),
    getBookingHolds: builder.query<BookingHold[], void>({
      query: () => "/admin/booking-holds",
      transformResponse: (res: unknown) => unwrapData<BookingHold[]>(res, []),
      providesTags: ["BookingPolicy"],
    }),
  }),
});

export const {
  useGetBookingPolicyQuery,
  useUpdateBookingPolicyMutation,
  useGetBookingHoldsQuery,
} = bookingPolicyApi;
