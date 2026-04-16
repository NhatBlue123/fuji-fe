import axios from "axios";
import { getAccessToken } from "./token";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8181/api",
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Set language from local storage for backend i18n
  if (typeof window !== "undefined") {
    const lang = localStorage.getItem("i18nextLng") || "vi";
    config.headers["Accept-Language"] = lang;
  }

  return config;
});

/**
 * [FRONTEND I18N ROLE] Interceptor phản hồi.
 * KHÔNG thực hiện dịch (trans) tại đây để đảm bảo Single Source of Truth.
 * Các component lớp trên (UI Layer) có trách nhiệm dùng tMsg(res.data.messageKey).
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Chỉ chuẩn hóa lỗi, không can thiệp nội dung messageKey
    if (!error.response) {
      logError("Network error or server down");
    }
    return Promise.reject(error);
  }
);

function logError(msg: string) {
  if (process.env.NODE_ENV === "development") {
    console.error("[API Error]", msg);
  }
}

export default api;
