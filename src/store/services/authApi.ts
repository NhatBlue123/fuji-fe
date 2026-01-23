// RTK Query API cho authentication
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import type { User } from "../../types/auth";

// Flag để tránh nhiều request refresh đồng thời
let isRefreshing = false;
let refreshPromise: Promise<unknown> | null = null;

// Base query với credentials để gửi cookies
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1",
  credentials: "include", // Gửi cookies với mọi request
  prepareHeaders: (headers) => {
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

// Base query with auto refresh token
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Nếu gặp 401 và chưa phải endpoint refresh
  if (result.error && result.error.status === 401) {
    const isRefreshEndpoint =
      typeof args === "string"
        ? args.includes("/auth/refresh")
        : args.url.includes("/auth/refresh");

    if (!isRefreshEndpoint) {
      // Nếu đang có refresh request khác, chờ nó xong
      if (isRefreshing && refreshPromise) {
        await refreshPromise;
        // Retry request ban đầu sau khi refresh xong
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Bắt đầu refresh mới
        isRefreshing = true;
        console.log("🔄 Token expired, refreshing...");

        refreshPromise = (async () => {
          try {
            const refreshResult = await baseQuery(
              { url: "/auth/refresh", method: "POST" },
              api,
              extraOptions,
            );

            if (refreshResult.data) {
              console.log("✅ Token refreshed successfully");
              return refreshResult;
            } else {
              console.log("❌ Refresh failed, logging out");
              api.dispatch({ type: "auth/logout" });
              return null;
            }
          } catch (error) {
            console.error("❌ Refresh error:", error);
            api.dispatch({ type: "auth/logout" });
            return null;
          } finally {
            isRefreshing = false;
            refreshPromise = null;
          }
        })();

        await refreshPromise;
        // Retry request ban đầu
        result = await baseQuery(args, api, extraOptions);
      }
    }
  }

  return result;
};

// Response types
interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth, // Dùng baseQuery có auto refresh
  tagTypes: ["Auth", "User"],
  endpoints: (builder) => ({
    // Đăng nhập
    login: builder.mutation<ApiResponse<{ user: User }>, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    // Đăng ký
    register: builder.mutation<ApiResponse<{ user: User }>, RegisterRequest>({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
    }),

    // Đăng xuất
    logout: builder.mutation<ApiResponse, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    // Refresh token
    refreshToken: builder.mutation<ApiResponse<{ user: User }>, void>({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
      invalidatesTags: ["Auth"],
    }),

    // Lấy thông tin user hiện tại
    getCurrentUser: builder.query<ApiResponse<{ user: User }>, void>({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),

    // Verify email
    verifyEmail: builder.mutation<ApiResponse, { token: string }>({
      query: ({ token }) => ({
        url: `/auth/verify-email?token=${token}`,
        method: "POST",
      }),
    }),

    // Forgot password
    forgotPassword: builder.mutation<ApiResponse, { email: string }>({
      query: ({ email }) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: { email },
      }),
    }),

    // Reset password
    resetPassword: builder.mutation<
      ApiResponse,
      { token: string; password: string }
    >({
      query: ({ token, password }) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: { token, password },
      }),
    }),
  }),
});

// Export hooks
export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
  useLazyGetCurrentUserQuery,
  useVerifyEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
