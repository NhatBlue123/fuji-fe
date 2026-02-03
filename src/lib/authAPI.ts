import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getToken } from './auth';

const BASE_URL = 'http://localhost:8080/api';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const token = getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  endpoints: (builder) => ({
    /* ========= REGISTER ========= */
    register: builder.mutation<
      { success: boolean; message: string },
      {
        username: string;
        email: string;
        password: string;
        fullName: string;
      }
    >({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
    }),

    /* ========= VERIFY OTP ========= */
    verifyOtp: builder.mutation<
      { success: boolean; message: string },
      {
        email: string;
        otpCode: string;
      }
    >({
      query: (body) => ({
        url: '/auth/verify-otp', 
        method: 'POST',
        body,
      }),
    }),

    /* ========= LOGIN ========= */
    login: builder.mutation<
      {
        success: boolean;
        data: {
          accessToken: string;
          refreshToken: string | null;
          username: string;
        };
      },
      {
        username: string;
        password: string;
      }
    >({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useVerifyOtpMutation,
  useLoginMutation,
} = authApi;
