import { baseApi } from "./baseApi";

export interface WithdrawRequestPayload {
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface WithdrawRequestData {
  id: number;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: string;
  createdAt: string;
  userId: number;
  fullName: string;
  platformFeeBps?: number;
  platformFeeAmount?: number;
  netPayoutAmount?: number;
  netPayoutVnd?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export const withdrawApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createWithdrawRequest: builder.mutation<ApiResponse<WithdrawRequestData>, WithdrawRequestPayload>({
      query: (body) => ({
        url: "/withdraw",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Wallet", "Withdraw"],
    }),
    getMyWithdrawRequests: builder.query<ApiResponse<WithdrawRequestData[]>, void>({
      query: () => ({
        url: "/withdraw/my-requests",
        method: "GET",
      }),
      providesTags: ["Withdraw"],
    }),
    
    // --- ADMIN ENDPOINTS ---
    getPendingWithdrawRequests: builder.query<ApiResponse<WithdrawRequestData[]>, void>({
      query: () => ({
        url: "/admin/withdraw/pending",
        method: "GET",
      }),
      providesTags: ["Withdraw"],
    }),
    getAllWithdrawRequests: builder.query<ApiResponse<WithdrawRequestData[]>, void>({
      query: () => ({
        url: "/admin/withdraw/all",
        method: "GET",
      }),
      providesTags: ["Withdraw"],
    }),
    approveWithdrawRequest: builder.mutation<ApiResponse<string>, number>({
      query: (id) => ({
        url: `/admin/withdraw/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: ["Withdraw", "Wallet"],
    }),
    rejectWithdrawRequest: builder.mutation<ApiResponse<string>, number>({
      query: (id) => ({
        url: `/admin/withdraw/${id}/reject`,
        method: "POST",
      }),
      invalidatesTags: ["Withdraw", "Wallet"],
    }),
    
    // --- PAYOUT API (CHUYỂN TIỀN TỰ ĐỘNG) ---
    // Gọi API để tạo lệnh chuyển khoản tự động
    createPayout: builder.mutation<ApiResponse<{ orderId: string; status: string }>, number>({
      query: (id) => ({
        url: `/admin/withdraw/${id}/payout`, // Mutation URL
        method: "POST",
      }),
      invalidatesTags: ["Withdraw"],
    }),
    
    // API kiểm tra trạng thái chuyển khoản tự động (Polling)
    getPayoutStatus: builder.query<ApiResponse<{ orderId: string; status: "PENDING" | "SUCCESS" | "FAILED" | "COMPLETED"; message?: string }>, string>({
      query: (orderId) => ({
        url: `/admin/withdraw/payout-status/${orderId}`, // Polling URL
        method: "GET",
      }),
    }),
  }),
});

export const {
  useCreateWithdrawRequestMutation,
  useGetMyWithdrawRequestsQuery,
  useGetPendingWithdrawRequestsQuery,
  useGetAllWithdrawRequestsQuery,
  useApproveWithdrawRequestMutation,
  useRejectWithdrawRequestMutation,
  useCreatePayoutMutation,
  useGetPayoutStatusQuery,
} = withdrawApi;
