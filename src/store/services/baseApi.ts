import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessToken } from "@/lib/token";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8181/api",
    credentials: "include",
    prepareHeaders: (headers) => {
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
  tagTypes: ["Wallet", "Payment", "AdminUser", "MyPermissions", "Withdraw", "VoiceTopic","Booking", "Subscription", "User", "AdminPlan"],
  endpoints: () => ({}),
});
