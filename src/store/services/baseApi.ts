import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessToken } from "@/lib/token";

/**
 * [FRONTEND I18N ROLE] Base API cho RTK Query.
 * Không thực hiện dịch tự động (Automatic Translation) trong Layer Service/BaseQuery.
 * Việc dịch phải được thực hiện ở UI Layer bằng tMsg(data.messageKey).
 */
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
  tagTypes: [
    "Wallet",
    "Payment",
    "AdminUser",
    "MyPermissions",
    "Withdraw",
    "VoiceTopic",
    "Booking",
    "Subscription",
    "User",
    "CourseFinance",
    "AdminPlan",
    "AdminRevenue",
    "SystemError",
    "SystemErrorSummary",
    "Progress",
    "Streak",
    "WeeklyStats",
    "WeeklySummary",
    "TodayStats",
    "Insight"
  ],
  endpoints: () => ({}),
});
