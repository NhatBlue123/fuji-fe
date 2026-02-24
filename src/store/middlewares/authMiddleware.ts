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
  setAccessToken,
} from "@/lib/token";
import type { AppDispatch } from "../index";
import type { User } from "@/types/auth";
import { API_CONFIG } from "@/config/api";

// Hàm helper để refresh token via HttpOnly cookie
const doRefreshToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Sends HttpOnly refreshToken cookie
    });

    if (response.ok) {
      const json = await response.json();
      // Backend returns ApiResponse<RefreshResponse> = { success, data: { accessToken } }
      const accessToken = json?.data?.accessToken || json?.accessToken;
      if (accessToken) {
        return accessToken;
      }
    }
    return null;
  } catch {
    return null;
  }
};

// Schedule proactive token refresh
const setupTokenRefresh = (dispatch: AppDispatch) => {
  const accessToken = getAccessToken();
  if (!accessToken) return;

  scheduleTokenRefresh(accessToken, async () => {
    const newAccessToken = await doRefreshToken();
    if (newAccessToken) {
      setAccessToken(newAccessToken);
      dispatch(tokenRefreshed({ accessToken: newAccessToken }));
      // Schedule next refresh
      setupTokenRefresh(dispatch);
    } else {
      dispatch(logout());
    }
  });
};

// ─── Middleware ─────────────────────────────────────────

export const authListenerMiddleware = createListenerMiddleware();

// Login API thành công → lưu accessToken cookie + fetch user profile + schedule refresh
authListenerMiddleware.startListening({
  matcher: authApi.endpoints.login.matchFulfilled,
  effect: async (action, listenerApi) => {
    console.log("🔐 Middleware: Login successful, processing...");
    const { accessToken } = action.payload;
    if (!accessToken) {
      console.error("❌ Middleware: No accessToken in login response!");
      return;
    }

    // Lưu access token vào cookie
    console.log("💾 Middleware: Saving access token to cookie...");
    setAccessToken(accessToken);

    // Fetch user profile từ /users/me
    try {
      const result = await listenerApi.dispatch(
        authApi.endpoints.getCurrentUser.initiate(undefined, {
          forceRefetch: true,
        }),
      );

      // After transformResponse, result.data is directly the AuthUser object
      if (result.data) {
        const authUser = result.data;
        // Map AuthUser to legacy User type
        const user: User = {
          _id: String(authUser.id || ""),
          id: authUser.id as number,
          email: authUser.email || "",
          username: authUser.username || "",
          fullname: authUser.fullName || authUser.username || "",
          fullName: authUser.fullName || "",
          avatar: authUser.avatarUrl || "",
          avatarUrl: authUser.avatarUrl || "",
          gender: authUser.gender || "",
          role: "STUDENT", // Default role
          level: (authUser.jlptLevel || "N5") as User["level"],
          isActive: authUser.active ?? true,
          isAdmin: false, // Will be set based on role if available
          isOnline: true,
          posts: 0,
          followers: [],
          following: [],
          lastActiveAt: new Date().toISOString(),
          createdAt: authUser.createdAt || new Date().toISOString(),
          updatedAt: authUser.createdAt || new Date().toISOString(),
        };
        console.log("✅ Middleware: Dispatching loginSuccess with user:", user.username);
        listenerApi.dispatch(loginSuccess({ user, accessToken }));
      } else {
        // Fallback minimal user
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
        listenerApi.dispatch(loginSuccess({ user: minimalUser, accessToken }));
      }
    } catch {
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
      listenerApi.dispatch(loginSuccess({ user: minimalUser, accessToken }));
    }

    // Lên lịch refresh token tự động
    setupTokenRefresh(listenerApi.dispatch as AppDispatch);
  },
});

// getCurrentUser thành công (dùng cho auth init khi reload page)
authListenerMiddleware.startListening({
  matcher: authApi.endpoints.getCurrentUser.matchFulfilled,
  effect: async (action, listenerApi) => {
    console.log("👤 Middleware: getCurrentUser fulfilled, processing...");
    // After transformResponse, payload is directly the AuthUser object
    const authUser = action.payload;
    const accessToken = getAccessToken();

    if (accessToken && authUser) {
      // Map AuthUser to legacy User type
      const user: User = {
        _id: String(authUser.id || ""),
        id: authUser.id as number,
        email: authUser.email || "",
        username: authUser.username || "",
        fullname: authUser.fullName || authUser.username || "",
        fullName: authUser.fullName || "",
        avatar: authUser.avatarUrl || "",
        avatarUrl: authUser.avatarUrl || "",
        gender: authUser.gender || "",
        role: "STUDENT", // Default role
        level: (authUser.jlptLevel || "N5") as User["level"],
        isActive: authUser.active ?? true,
        isAdmin: false, // Will be set based on role if available
        isOnline: true,
        posts: 0,
        followers: [],
        following: [],
        lastActiveAt: new Date().toISOString(),
        createdAt: authUser.createdAt || new Date().toISOString(),
        updatedAt: authUser.createdAt || new Date().toISOString(),
      };
      console.log("✅ Middleware: Dispatching updateUser with:", user.username);
      console.log("🔄 Middleware: isAuthenticated should now be TRUE");
      listenerApi.dispatch(updateUser(user));
      setupTokenRefresh(listenerApi.dispatch as AppDispatch);
    }
  },
});

// Refresh token thành công (khi gọi thủ công qua RTK Query)
authListenerMiddleware.startListening({
  matcher: authApi.endpoints.refreshToken.matchFulfilled,
  effect: async (action, listenerApi) => {
    const data = action.payload?.data || action.payload;
    const accessToken = (data as { accessToken?: string })?.accessToken;
    if (accessToken) {
      setAccessToken(accessToken);
      listenerApi.dispatch(tokenRefreshed({ accessToken }));
      setupTokenRefresh(listenerApi.dispatch as AppDispatch);
    }
  },
});

// tokenRefreshed action dispatched (e.g. by baseQueryWithReauth in any API slice)
// → re-schedule proactive refresh so the next expiry is covered
authListenerMiddleware.startListening({
  actionCreator: tokenRefreshed,
  effect: async (_, listenerApi) => {
    setupTokenRefresh(listenerApi.dispatch as AppDispatch);
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
