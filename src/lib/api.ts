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

/**
 * Lấy extension từ tên file
 */
function getExtension(fileName: string): string | null {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return ext || null;
}

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "tiff"]);

/**
 * Kiểm tra URL có phải là ảnh dựa trên extension
 */
function isImageFile(fileName: string): boolean {
  const ext = getExtension(fileName);
  return ext ? IMAGE_EXTS.has(ext) : false;
}

/**
 * Fix Cloudinary URL:
 * 1. Thêm extension nếu bị thiếu
 * 2. Đổi resource type: image/upload -> raw/upload cho file không phải ảnh
 *    (Backend upload nhầm resource type nên file không tải được)
 */
function fixCloudinaryUrl(url: string, fileName: string): string {
  if (!url.includes("cloudinary.com")) return url;

  let fixed = url;
  const ext = getExtension(fileName);

  // 1. Thêm extension nếu URL bị cắt (VD: file_xxx- -> file_xxx.pdf)
  if (ext && url.endsWith("-")) {
    fixed = url + ext;
  }

  // 2. Đổi image/upload -> raw/upload cho file không phải ảnh
  if (!isImageFile(fileName)) {
    fixed = fixed.replace("/image/upload/", "/raw/upload/");
  }

  return fixed;
}

/**
 * Tải file từ URL, tự động fix URL Cloudinary
 */
export async function downloadFile(url: string, fileName: string): Promise<void> {
  const fixedUrl = fixCloudinaryUrl(url, fileName);
  try {
    const response = await axios.get(fixedUrl, {
      responseType: "blob",
      headers: {
        Authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : undefined,
      },
    });
    const blob = response.data;
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("[downloadFile] Error:", error);
    window.open(fixedUrl, "_blank");
  }
}

export default api;
