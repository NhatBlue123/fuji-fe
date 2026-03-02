import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessToken } from "@/lib/token";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:8181/api",
    credentials: "include",
    prepareHeaders: (headers) => {
      const token = getAccessToken(); // đọc từ cookie
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      const lang = localStorage.getItem("i18nextLng") || "vi";
      headers.set("Accept-Language", lang);

      return headers;
    },
  }),
  endpoints: () => ({}),
});
