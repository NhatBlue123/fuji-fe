// RTK Query API cho authentication
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import type { User } from "../../types/auth";
import { API_CONFIG, API_ENDPOINTS } from "@/config/api";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "@/lib/token";

// Flag để tránh nhiều request refresh đồng thời
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Base query - tự động gắn Bearer token từ localStorage
const baseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.BASE_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// Base query with auto refresh token khi gặp 401
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Bỏ qua nếu endpoint là login/register/refresh
  const url = typeof args === "string" ? args : args.url;
  const skipReauth = [
    API_ENDPOINTS.AUTH.LOGIN,
    API_ENDPOINTS.AUTH.REGISTER,
    API_ENDPOINTS.AUTH.REFRESH,
    API_ENDPOINTS.AUTH.VERIFY_OTP,
    API_ENDPOINTS.AUTH.SEND_OTP_REGISTER,
  ].some((ep) => url.includes(ep));

  if (result.error && result.error.status === 401 && !skipReauth) {
    // Nếu đang có refresh request khác, chờ nó xong
    if (isRefreshing && refreshPromise) {
      const success = await refreshPromise;
      if (success) {
        // Retry với token mới
        result = await baseQuery(args, api, extraOptions);
      } else {
        api.dispatch({ type: "auth/logout" });
      }
    } else {
      // Bắt đầu refresh mới
      isRefreshing = true;

      refreshPromise = (async (): Promise<boolean> => {
        try {
          const refreshToken = getRefreshToken();
          if (!refreshToken) {
            api.dispatch({ type: "auth/logout" });
            return false;
          }

          const refreshResult = await baseQuery(
            {
              url: API_ENDPOINTS.AUTH.REFRESH,
              method: "POST",
              body: { refreshToken },
            },
            api,
            extraOptions,
          );

          const data = refreshResult.data as RefreshResponseData | undefined;

          if (data?.accessToken) {
            // Lưu tokens mới
            setTokens(data.accessToken, data.refreshToken || refreshToken);
            // Cập nhật Redux state
            api.dispatch({
              type: "auth/tokenRefreshed",
              payload: {
                accessToken: data.accessToken,
                refreshToken: data.refreshToken || refreshToken,
              },
            });
            return true;
          } else {
            api.dispatch({ type: "auth/logout" });
            return false;
          }
        } catch {
          api.dispatch({ type: "auth/logout" });
          return false;
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      })();

      const success = await refreshPromise;
      if (success) {
        result = await baseQuery(args, api, extraOptions);
      }
    }
  }

  return result;
};

// ─── Response types ────────────────────────────────────

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
  fullName: string;
  otpCode: string;
}

interface SendOtpRegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

// Backend trả về khi login thành công
export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  username: string;
  email?: string;
}

// Backend trả về khi refresh thành công
interface RefreshResponseData {
  accessToken: string;
  refreshToken?: string;
}

export interface VerifyOtpRequest {
  email: string;
  otpCode: string;
}

export interface OAuth2VerifyOtpRequest {
  sessionId: string;
  otpCode: string;
}

// ─── API Definition ────────────────────────────────────

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Auth", "User"],
  endpoints: (builder) => ({
    // Đăng nhập - trả về tokens
    login: builder.mutation<LoginResponseData, LoginRequest>({
      query: (credentials) => ({
        url: API_ENDPOINTS.AUTH.LOGIN,
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    // Gửi OTP để đăng ký (validate đầy đủ thông tin trước, không tạo tài khoản)
    sendOtpRegister: builder.mutation<
      ApiResponse<string>,
      SendOtpRegisterRequest
    >({
      query: (data) => ({
        url: API_ENDPOINTS.AUTH.SEND_OTP_REGISTER,
        method: "POST",
        body: data,
      }),
    }),

    // Đăng ký - gửi đầy đủ thông tin + OTP
    register: builder.mutation<ApiResponse<string>, RegisterRequest>({
      query: (userData) => ({
        url: API_ENDPOINTS.AUTH.REGISTER,
        method: "POST",
        body: userData,
      }),
    }),

    // Đăng xuất
    logout: builder.mutation<ApiResponse, void>({
      query: () => ({
        url: API_ENDPOINTS.AUTH.LOGOUT,
        method: "POST",
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    // Xác thực OTP
    verifyOtp: builder.mutation<
      ApiResponse<string>,
      { email: string; otpCode: string }
    >({
      query: (data) => ({
        url: API_ENDPOINTS.AUTH.VERIFY_OTP,
        method: "POST",
        body: data,
      }),
    }),

    // Xác thực OTP cho OAuth2
    verifyOAuth2Otp: builder.mutation<ApiResponse<LoginResponseData>, OAuth2VerifyOtpRequest>({
      query: (data) => ({
        url: API_ENDPOINTS.AUTH.VERIFY_OAUTH2_OTP,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    // Refresh token
    refreshToken: builder.mutation<RefreshResponseData, void>({
      query: () => {
        const refreshToken = getRefreshToken();
        return {
          url: API_ENDPOINTS.AUTH.REFRESH,
          method: "POST",
          body: { refreshToken },
        };
      },
      invalidatesTags: ["Auth"],
    }),

    // Lấy thông tin user hiện tại (cần Bearer token)
    getCurrentUser: builder.query<ApiResponse<User>, void>({
      query: () => API_ENDPOINTS.AUTH.ME,
      providesTags: ["User"],
    }),

    // Verify email
    verifyEmail: builder.mutation<ApiResponse, { token: string }>({
      query: ({ token }) => ({
        url: `/verify-email?token=${token}`,
        method: "POST",
      }),
    }),

    // Forgot password
    forgotPassword: builder.mutation<ApiResponse, { email: string }>({
      query: ({ email }) => ({
        url: API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
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
        url: API_ENDPOINTS.AUTH.RESET_PASSWORD,
        method: "POST",
        body: { token, password },
      }),
    }),
  }),
});

// Export auto-generated hooks
export const {
  useSendOtpRegisterMutation,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useVerifyOtpMutation,
  useVerifyOAuth2OtpMutation,
  useVerifyEmailMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
  useLazyGetCurrentUserQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
