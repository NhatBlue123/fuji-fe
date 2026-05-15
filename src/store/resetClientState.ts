import type { AppDispatch } from "@/store";
import { adminChatModerationApi } from "@/store/services/adminChatModerationApi";
import { adminFlashcardApi } from "@/store/services/admin/flashcardApi";
import { adminJlptApi } from "@/store/services/adminJlptApi";
import { adminReportApi } from "@/store/services/adminReportApi";
import { aiBaseApi } from "@/store/services/aiBaseApi";
import { authApi } from "@/store/services/authApi";
import { baseApi } from "@/store/services/baseApi";
import { courseApi } from "@/store/services/courseApi";
import { flashcardApi } from "@/store/services/flashcardApi";
import { jlptAiApi, jlptApi } from "@/store/services/jlptApi";
import { userApi } from "@/store/services/admin/userApi";
import { userPreferenceApi } from "@/store/services/user/userPreferenceApi";

const apiSlices = [
  authApi,
  baseApi,
  aiBaseApi,
  flashcardApi,
  courseApi,
  jlptApi,
  jlptAiApi,
  adminJlptApi,
  adminFlashcardApi,
  userApi,
  adminReportApi,
  adminChatModerationApi,
  userPreferenceApi,
] as const;

export function resetClientApiState(dispatch: AppDispatch) {
  apiSlices.forEach((api) => {
    dispatch(api.util.resetApiState());
  });
}

export function clearUserScopedClientStorage() {
  if (typeof window === "undefined") return;

  Object.keys(window.localStorage).forEach((key) => {
    if (key.startsWith("jlpt_exam_state_")) {
      window.localStorage.removeItem(key);
    }
  });
}
