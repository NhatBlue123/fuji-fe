import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { AuthState, User } from "../../types/auth";
import { API_CONFIG } from "@/config/api";
import {
  getAccessToken,
  clearTokens,
  setAccessToken,
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
    console.log("🔍 getInitialAuthState: token =", token ? "EXISTS" : "NULL");
    console.log("🔍 getInitialAuthState: savedAuth =", savedAuth ? "EXISTS" : "NULL");
    if (savedAuth && token) {
      const parsed = JSON.parse(savedAuth);
      console.log("✅ getInitialAuthState: Restoring user from localStorage:", parsed.user?.username);
      return {
        ...parsed,
        accessToken: token,
        roles: getRolesFromToken(token),
        isLoading: false,
        error: null,
        isInitialized: false,
      };
    } else {
      console.log("❌ getInitialAuthState: Cannot restore - missing token or savedAuth");
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
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/logout`, {
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
      }>,
    ) => {
      const { user, accessToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.roles = getRolesFromToken(accessToken);
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      state.isInitialized = true;

      // Lưu access token vào cookie
      setAccessToken(accessToken);
      
      // Persist user data to localStorage
      if (typeof window !== "undefined") {
        try {
          const authState = {
            user,
            isAuthenticated: true,
            isInitialized: true,
          };
          localStorage.setItem("auth_state", JSON.stringify(authState));
        } catch (error) {
          console.warn("Failed to save auth state to localStorage:", error);
        }
      }
    },

    // Cập nhật user profile (không thay đổi token)
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true; // Mark as authenticated when user is set
      state.isInitialized = true; // Mark as initialized
      
      // Persist user data to localStorage
      if (typeof window !== "undefined") {
        try {
          const authState = {
            user: action.payload,
            isAuthenticated: true,
            isInitialized: true,
          };
          localStorage.setItem("auth_state", JSON.stringify(authState));
        } catch (error) {
          console.warn("Failed to save auth state to localStorage:", error);
        }
      }
    },

    // Cập nhật access token mới (sau refresh)
    tokenRefreshed: (
      state,
      action: PayloadAction<{
        accessToken: string;
      }>,
    ) => {
      const { accessToken } = action.payload;
      state.accessToken = accessToken;
      state.roles = getRolesFromToken(accessToken);
      setAccessToken(accessToken);
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
      
      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_state");
      }
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
        
        // Clear localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_state");
        }
      })
      .addCase(logoutThunk.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.roles = [];
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
        state.isInitialized = true;
        
        // Clear localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_state");
        }
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
