"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useLazyGetCurrentUserQuery,
} from "../store/services/authApi";
import {
  loginSuccess,
  logout,
  setInitialized,
} from "../store/slices/authSlice";
import type { RootState, AppDispatch } from "../store";
import {
  getAccessToken,
  getRefreshToken,
} from "@/lib/token";
import type { User } from "@/types/auth";

/**
 * Hook để khôi phục authentication state khi app khởi động.
 * Token refresh scheduling được xử lý bởi authMiddleware.
 */
export const useAuthInit = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isInitialized } = useSelector((state: RootState) => state.auth);
  const [triggerGetCurrentUser] = useLazyGetCurrentUserQuery();

  // Khôi phục session khi app mount
  useEffect(() => {
    if (isInitialized) return;

    const restoreSession = async () => {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();

      if (!accessToken || !refreshToken) {
        dispatch(setInitialized());
        return;
      }

      try {
        const result = await triggerGetCurrentUser(undefined, false).unwrap();

        if (result?.data) {
          dispatch(
            loginSuccess({
              user: result.data as User,
              accessToken,
              refreshToken,
            }),
          );
        } else {
          dispatch(logout());
        }
      } catch {
        // Token hết hạn hoặc không hợp lệ
        dispatch(logout());
      }
    };

    restoreSession();
  }, [dispatch, isInitialized, triggerGetCurrentUser]);

  // Khi user quay lại tab, refetch user info
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const token = getAccessToken();
        if (token) {
          triggerGetCurrentUser(undefined, true);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [triggerGetCurrentUser]);

  return { isLoading: !isInitialized };
};

/**
 * Component wrapper để init auth state
 * Không block render, cho phép children render ngay
 */
export const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useAuthInit();
  return <>{children}</>;
};

