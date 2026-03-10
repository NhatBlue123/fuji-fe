import { createListenerMiddleware } from "@reduxjs/toolkit";
import { loginSuccess, logout, tokenRefreshed } from "../slices/authSlice";

/**
 * Middleware để lắng nghe các action liên quan đến authentication 
 * và đồng bộ hóa với localStorage để duy trì trạng thái đăng nhập khi refresh trang.
 */
export const authListenerMiddleware = createListenerMiddleware();

authListenerMiddleware.startListening({
    actionCreator: loginSuccess,
    effect: async (action, listenerApi) => {
        if (typeof window !== "undefined") {
            const { user } = action.payload;
            localStorage.setItem(
                "auth_state",
                JSON.stringify({
                    user,
                    isAuthenticated: true,
                })
            );
        }
    },
});

authListenerMiddleware.startListening({
    actionCreator: tokenRefreshed,
    effect: async (action, listenerApi) => {
        if (typeof window !== "undefined") {
            const state = (listenerApi.getState() as any).auth;
            localStorage.setItem(
                "auth_state",
                JSON.stringify({
                    user: state.user,
                    isAuthenticated: true,
                })
            );
        }
    },
});

authListenerMiddleware.startListening({
    actionCreator: logout,
    effect: async (action, listenerApi) => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("auth_state");
        }
    },
});
