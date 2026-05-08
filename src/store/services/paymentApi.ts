import { baseApi } from "./baseApi";

const unwrapApiData = <T,>(res: unknown): T => {
  if (res && typeof res === "object" && "data" in res) {
    return (res as { data: T }).data;
  }

  return res as T;
};

// ─── Types ────────────────────────────────────────────
export interface CreatePaymentResponse {
  orderId: string;
  // Canonical app unit
  amount?: number;
  currency?: "BLOSSOM" | string;
  // Bank transfer boundary unit
  transferAmountVnd?: number;
  bankId?: string;
  accountNo?: string;
  accountName?: string;
}

export interface PaymentStatusResponse {
  orderId: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  // Canonical app unit
  amount: number;
  currency?: "BLOSSOM" | string;
  // Bank transfer boundary unit
  transferAmountVnd?: number;
  message?: string;
}

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // API 1: Tạo đơn nạp - Backend trả về thông tin tài khoản nhận tiền
    // Mã ORDER_XXX được gán bởi backend dựa trên transaction ID
    createPayment: builder.mutation<CreatePaymentResponse, { amount: number }>({
      query: (body) => ({
        url: "/payments/create",
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown) =>
        unwrapApiData<CreatePaymentResponse>(res),
      invalidatesTags: ["Wallet"],
    }),

    // API 2: Kiểm tra trạng thái thanh toán
    // Gọi liên tục (polling) để check xem tiền đã vào chưa
    getPaymentStatus: builder.query<PaymentStatusResponse, string>({
      query: (orderId) => ({
        url: `/payments/status/${orderId}`,
        method: "GET",
      }),
      transformResponse: (res: unknown) =>
        unwrapApiData<PaymentStatusResponse>(res),
    }),
  }),
});

export const {
  useCreatePaymentMutation,
  useGetPaymentStatusQuery,
  useLazyGetPaymentStatusQuery,
} = paymentApi;
