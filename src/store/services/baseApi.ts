import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:8181/api",
    credentials: "include",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("access_token");
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
