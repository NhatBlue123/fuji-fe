import { baseApi } from "./baseApi";

// ─── Types ────────────────────────────────────────────
export interface CreatePaymentResponse {
  orderId: string
  amount: number
  bankId: string
  accountNo: string
  accountName: string
}

export interface PaymentStatusResponse {
  orderId: string
  status: "PENDING" | "SUCCESS" | "FAILED"
  amount: number
  message?: string
}

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // API 1: Tạo đơn nạp - Backend trả về thông tin tài khoản nhận tiền
    // Mã ORDER_XXX được gán bởi backend dựa trên transaction ID
    createPayment: builder.mutation<
      CreatePaymentResponse,
      { amount: number }
    >({
      query: (body) => ({
        url: "/payments/create",
        method: "POST",
        body
      }),
      invalidatesTags: ["Wallet"]
    }),

    // API 2: Kiểm tra trạng thái thanh toán
    // Gọi liên tục (polling) để check xem tiền đã vào chưa
    getPaymentStatus: builder.query<
      PaymentStatusResponse,
      string
    >({
      query: (orderId) => ({
        url: `/payments/status/${orderId}`,
        method: "GET"
      })
    })

  })
})

export const {
  useCreatePaymentMutation,
  useGetPaymentStatusQuery
} = paymentApi