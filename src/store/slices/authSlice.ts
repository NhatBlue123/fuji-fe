// Quản lý state authentication của user
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { AuthState, User } from "../../types/auth";
import { API_CONFIG } from "@/config/api";
import {
  getAccessToken,
  clearTokens,
  setTokens,
  getRolesFromToken,
} from "@/lib/token";

// Khôi phục auth state từ localStorage nếu có
const getInitialAuthState = (): AuthState => {
  if (typeof window === "undefined") {
    return {
      user: null,
      accessToken: null,
      roles: [],
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isInitialized: false,
    };
  }

  try {
    const token = getAccessToken();
    const savedAuth = localStorage.getItem("auth_state");
    if (savedAuth && token) {
      const parsed = JSON.parse(savedAuth);
      return {
        ...parsed,
        accessToken: token,
        roles: getRolesFromToken(token),
        isLoading: false,
        error: null,
        isInitialized: false,
      };
    }
  } catch (error) {
    console.warn("Failed to parse saved auth state:", error);
  }

  return {
    user: null,
    accessToken: null,
    roles: [],
    isAuthenticated: false,
    isLoading: false,
    error: null,
    isInitialized: false,
  };
};

const initialState: AuthState = getInitialAuthState();

// Async thunk để logout - gọi backend API để clear cookies
export const logoutThunk = createAsyncThunk(
  "auth/logoutThunk",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAccessToken();
      const response = await fetch(`${API_CONFIG.BASE_URL}/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        console.warn("Logout API failed, but clearing local state anyway");
      }

      return true;
    } catch (error) {
      console.error("Logout API error:", error);
      return rejectWithValue(error);
    } finally {
      clearTokens();
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Bắt đầu quá trình đăng nhập
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },

    // Đăng nhập thành công, lưu thông tin user + token
    loginSuccess: (
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>,
    ) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.roles = getRolesFromToken(accessToken);
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      state.isInitialized = true;

      // Lưu tokens và auth_state
      setTokens(accessToken, refreshToken);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            "auth_state",
            JSON.stringify({
              user,
              isAuthenticated: true,
              isInitialized: true,
            }),
          );
        } catch (error) {
          console.warn("Failed to save auth state:", error);
        }
      }
    },

    // Cập nhật user profile (không thay đổi token)
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            "auth_state",
            JSON.stringify({
              user: action.payload,
              isAuthenticated: true,
              isInitialized: true,
            }),
          );
        } catch (error) {
          console.warn("Failed to save auth state:", error);
        }
      }
    },

    // Cập nhật tokens mới (sau refresh)
    tokenRefreshed: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
      }>,
    ) => {
      const { accessToken, refreshToken } = action.payload;
      state.accessToken = accessToken;
      state.roles = getRolesFromToken(accessToken);
      setTokens(accessToken, refreshToken);
    },

    // Đăng nhập thất bại
    loginFailure: (state, action: PayloadAction<string>) => {
      state.user = null;
      state.accessToken = null;
      state.roles = [];
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = action.payload;
      state.isInitialized = true;
      clearTokens();
    },

    // Đăng xuất, reset toàn bộ state
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.roles = [];
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      state.isInitialized = true;
      clearTokens();
    },

    // Đánh dấu auth đã được khởi tạo
    setInitialized: (state) => {
      state.isInitialized = true;
    },

    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logoutThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.roles = [];
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
        state.isInitialized = true;
      })
      .addCase(logoutThunk.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.roles = [];
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
        state.isInitialized = true;
      });
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  clearError,
  setInitialized,
  updateUser,
  tokenRefreshed,
} = authSlice.actions;
export default authSlice.reducer;
