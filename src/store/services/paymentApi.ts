import { baseApi } from "./baseApi";

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    createPayment: builder.mutation<
      { orderId: string; amount: number },
      { amount: number }
    >({
      query: (body) => ({
        url: "/payments/create",
        method: "POST",
        body
      })
    }),

    // 🔧 SỬA Ở ĐÂY
    getTestSignature: builder.query<
      string,
      { orderId: string; amount: number; status: string }
    >({
      query: ({ orderId, amount, status }) => ({
        url: "/payments/test-signature",
        params: {
          order_id: orderId,
          amount,
          status
        },
        responseHandler: (response) => response.text() // 👈 đọc raw text
      })
    }),

    simulateXGatePayment: builder.mutation<
      any,
      {
        orderId: string
        transactionId: string
        amount: number
        status: string
        signature: string
      }
    >({
      query: (body) => ({
        url: "/payments/callback",
        method: "POST",
        body: {
          order_id: body.orderId,
          transaction_id: body.transactionId,
          amount: body.amount,
          status: body.status,
          signature: body.signature
        }
      }),
      invalidatesTags: ["Wallet"]
    })

  })
})

export const {
  useCreatePaymentMutation,
  useLazyGetTestSignatureQuery,
  useSimulateXGatePaymentMutation
} = paymentApi