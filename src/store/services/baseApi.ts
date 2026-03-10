import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessToken } from "@/lib/token";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:8181/api",
    credentials: "include",
    prepareHeaders: (headers) => {
      const token = getAccessToken(); // đọc từ cookie, không phải localStorage
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["AdminUsers", "JLPTTests", "JLPTAttempts", "AdminJLPTTests"],
  endpoints: () => ({}),
});
