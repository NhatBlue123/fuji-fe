// Listener middleware để handle các auth events
import { createListenerMiddleware } from "@reduxjs/toolkit";
import { authApi } from "../services/authApi";
import { loginSuccess, logout } from "../slices/authSlice";

// Listener middleware để handle các auth events
export const authListenerMiddleware = createListenerMiddleware();

// Listener cho refresh token thành công
authListenerMiddleware.startListening({
  matcher: authApi.endpoints.refreshToken.matchFulfilled,
  effect: async (action, listenerApi) => {
    console.log("✅ Refresh token successful");
    if (action.payload?.success && action.payload?.data?.user) {
      listenerApi.dispatch(loginSuccess(action.payload.data.user));
    }
  },
});

// Listener cho getCurrentUser thành công
authListenerMiddleware.startListening({
  matcher: authApi.endpoints.getCurrentUser.matchFulfilled,
  effect: async (action, listenerApi) => {
    console.log("✅ Get current user successful");
    if (action.payload?.success && action.payload?.data?.user) {
      listenerApi.dispatch(loginSuccess(action.payload.data.user));
    }
  },
});

// Listener cho logout action -> clear cache
authListenerMiddleware.startListening({
  actionCreator: logout,
  effect: async (_, listenerApi) => {
    console.log("🔄 Clearing RTK Query cache on logout");
    listenerApi.dispatch(authApi.util.resetApiState());
  },
});
