import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessToken } from "@/lib/token";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:8181/api",
    credentials: "include",
    prepareHeaders: (headers) => {
      // Token được lưu trong cookie, dùng getAccessToken() để đọc đúng
      const token = getAccessToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      const lang =
        typeof window !== "undefined"
          ? localStorage.getItem("i18nextLng") || "vi"
          : "vi";
      headers.set("Accept-Language", lang);

      return headers;
    },
  }),
  tagTypes: ["AdminUser", "MyPermissions"],
  endpoints: () => ({}),
});
