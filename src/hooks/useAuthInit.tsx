"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLazyGetCurrentUserQuery } from "../store/services/authApi";
import {
  loginSuccess,
  logout,
  setInitialized,
} from "../store/slices/authSlice";
import type { RootState, AppDispatch } from "../store";
import { getAccessToken } from "@/lib/token";
import type { User } from "@/types/auth";

/**
 * Hook để khôi phục authentication state khi app khởi động.
 * - Access token: JS-accessible cookie
 * - Refresh token: HttpOnly cookie (sent automatically)
 * - Token refresh scheduling: handled by authMiddleware
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
      console.log("🔄 useAuthInit: Starting session restore...");
      console.log("🔑 useAuthInit: accessToken =", accessToken ? "EXISTS" : "NULL");

      if (!accessToken) {
        console.log("❌ useAuthInit: No token found, marking as initialized");
        dispatch(setInitialized());
        return;
      }

      try {
        console.log("📡 useAuthInit: Fetching current user from API...");
        const result = await triggerGetCurrentUser(undefined, false).unwrap();

        if (result) {
          const backendUser = result as unknown as Record<string, unknown>;
          // Map backend UserDTO to frontend User type
          const user: User = {
            _id: String(backendUser.id || ""),
            id: backendUser.id as number,
            email: (backendUser.email as string) || "",
            username: (backendUser.username as string) || "",
            fullname:
              (backendUser.fullName as string) ||
              (backendUser.username as string) ||
              "",
            fullName: (backendUser.fullName as string) || "",
            avatar: (backendUser.avatarUrl as string) || "",
            avatarUrl: (backendUser.avatarUrl as string) || "",
            gender: (backendUser.gender as string) || "",
            role: (backendUser.role as string) || "STUDENT",
            level: (backendUser.jlptLevel ||
              backendUser.level ||
              "N5") as User["level"],
            isActive: true,
            isAdmin: backendUser.role === "ADMIN",
            isOnline: true,
            posts: 0,
            followers: [],
            following: [],
            lastActiveAt: new Date().toISOString(),
            createdAt: backendUser.createdAt as string,
            updatedAt: backendUser.updatedAt as string,
          };
          console.log("✅ useAuthInit: User fetched successfully:", user.username);
          console.log("👤 useAuthInit: fullName =", user.fullName);
          console.log("💾 useAuthInit: Dispatching loginSuccess...");
          dispatch(
            loginSuccess({
              user,
              accessToken,
            }),
          );
        } else {
          console.log("❌ useAuthInit: No user data in response, logging out");
          dispatch(logout());
        }
      } catch (error) {
        // Token hết hạn hoặc không hợp lệ
        console.error("❌ useAuthInit: Error fetching user, logging out:", error);
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
