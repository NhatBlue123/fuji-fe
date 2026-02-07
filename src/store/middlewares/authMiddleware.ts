// Listener middleware để handle các auth events
import { createListenerMiddleware } from "@reduxjs/toolkit";
import { authApi } from "../services/authApi";
import {
  loginSuccess,
  logout,
  tokenRefreshed,
  updateUser,
} from "../slices/authSlice";
import {
  scheduleTokenRefresh,
  cancelScheduledRefresh,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/lib/token";
import type { AppDispatch } from "../index";
import type { User } from "@/types/auth";

// Hàm helper để schedule refresh + dispatch khi có token mới
const setupTokenRefresh = (dispatch: AppDispatch) => {
  const accessToken = getAccessToken();
  if (!accessToken) return;

  scheduleTokenRefresh(accessToken, async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        dispatch(logout());
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8181/api/v1"}/refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
          credentials: "include",
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data?.accessToken) {
          setTokens(data.accessToken, data.refreshToken || refreshToken);
          dispatch(
            tokenRefreshed({
              accessToken: data.accessToken,
              refreshToken: data.refreshToken || refreshToken,
            }),
          );
          // Lên lịch refresh tiếp theo
          setupTokenRefresh(dispatch);
        } else {
          dispatch(logout());
        }
      } else {
        dispatch(logout());
      }
    } catch {
      dispatch(logout());
    }
  });
};

// ─── Middleware ─────────────────────────────────────────

export const authListenerMiddleware = createListenerMiddleware();

// Login API thành công → lưu tokens + fetch user profile + schedule refresh
authListenerMiddleware.startListening({
  matcher: authApi.endpoints.login.matchFulfilled,
  effect: async (action, listenerApi) => {
    const { accessToken, refreshToken } = action.payload;
    if (!accessToken) return;

    // Lưu tokens trước
    setTokens(accessToken, refreshToken);

    // Fetch user profile từ /me
    try {
      const result = await listenerApi.dispatch(
        authApi.endpoints.getCurrentUser.initiate(undefined, {
          forceRefetch: true,
        }),
      );

      if (result.data?.data) {
        listenerApi.dispatch(
          loginSuccess({
            user: result.data.data as User,
            accessToken,
            refreshToken,
          }),
        );
      } else {
        // Nếu không lấy được user, tạo minimal user từ login response
        const minimalUser: User = {
          _id: "",
          email: action.payload.email || "",
          username: action.payload.username,
          fullname: action.payload.username,
          gender: "",
          level: "N5",
          isActive: true,
          isAdmin: false,
          isOnline: true,
          posts: 0,
          followers: [],
          following: [],
          lastActiveAt: new Date().toISOString(),
        };
        listenerApi.dispatch(
          loginSuccess({ user: minimalUser, accessToken, refreshToken }),
        );
      }
    } catch {
      // Fallback: vẫn login thành công nhưng thiếu user detail
      const minimalUser: User = {
        _id: "",
        email: action.payload.email || "",
        username: action.payload.username,
        fullname: action.payload.username,
        gender: "",
        level: "N5",
        isActive: true,
        isAdmin: false,
        isOnline: true,
        posts: 0,
        followers: [],
        following: [],
        lastActiveAt: new Date().toISOString(),
      };
      listenerApi.dispatch(
        loginSuccess({ user: minimalUser, accessToken, refreshToken }),
      );
    }

    // Lên lịch refresh token tự động
    setupTokenRefresh(listenerApi.dispatch as AppDispatch);
  },
});

// getCurrentUser thành công (dùng cho auth init khi reload page)
authListenerMiddleware.startListening({
  matcher: authApi.endpoints.getCurrentUser.matchFulfilled,
  effect: async (action, listenerApi) => {
    if (action.payload?.data) {
      const user = action.payload.data as User;
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();

      if (accessToken && refreshToken) {
        listenerApi.dispatch(updateUser(user));
        // Schedule refresh nếu chưa có
        setupTokenRefresh(listenerApi.dispatch as AppDispatch);
      }
    }
  },
});

// Refresh token thành công (khi gọi thủ công qua RTK Query)
authListenerMiddleware.startListening({
  matcher: authApi.endpoints.refreshToken.matchFulfilled,
  effect: async (action, listenerApi) => {
    const data = action.payload;
    if (data?.accessToken) {
      const refreshToken = getRefreshToken() || "";
      listenerApi.dispatch(
        tokenRefreshed({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || refreshToken,
        }),
      );
      setupTokenRefresh(listenerApi.dispatch as AppDispatch);
    }
  },
});

// Logout → clear mọi thứ
authListenerMiddleware.startListening({
  actionCreator: logout,
  effect: async (_, listenerApi) => {
    cancelScheduledRefresh();
    clearTokens();
    listenerApi.dispatch(authApi.util.resetApiState());
  },
});
