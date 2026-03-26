import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessToken } from "@/lib/token";

/**
 * RTK Query base riêng cho AI-FUJI service (tách khỏi FUJI-BE).
 * Base URL mặc định: http://localhost:3005
 */
export const aiBaseApi = createApi({
  reducerPath: "aiApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:3005",
    prepareHeaders: (headers) => {
      const token = getAccessToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: () => ({}),
});
