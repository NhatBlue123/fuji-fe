"use client";

import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useGetCurrentUserQuery } from "../store/services/authApi";
import { loginSuccess, logoutThunk, setInitialized } from "../store/slices/authSlice";
import { RootState } from "../store";
import { LoadingPage } from "@/components/common";

/**
 * Hook để khôi phục authentication state khi app khởi động
 * Sử dụng refresh token để kiểm tra xem user có còn logged in không
 */
export const useAuthInit = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);
  const loginTimeRef = useRef<number | null>(null);
  const retryCountRef = useRef<number>(0);

  // Track khi user login thành công (từ loginSuccess action)
  useEffect(() => {
    if (isAuthenticated && !isInitialized) {
      // User vừa mới login thành công, lưu thời gian
      loginTimeRef.current = Date.now();
      retryCountRef.current = 0;
    }
  }, [isAuthenticated, isInitialized]);

  // Gọi API để lấy thông tin user hiện tại (nếu có token trong cookie)
  const { data, isSuccess, isError, isLoading, error, refetch } = useGetCurrentUserQuery(undefined, {
    // Chỉ gọi API nếu chưa được khởi tạo
    skip: isInitialized,
  });

  useEffect(() => {
    if (isLoading) {
      return; // Đang loading, chưa làm gì
    }

    if (isSuccess && data?.success && data.data) {
      // Backend trả về user object trực tiếp trong data
      dispatch(loginSuccess(data.data));
      console.log("✅ Auth state restored from /me:", data.data);
      // Reset retry count khi success
      retryCountRef.current = 0;
      loginTimeRef.current = null;
    } else if (isError) {
      const errorStatus = (error as any)?.status;
      const errorMessage = (error as any)?.error || (error as any)?.message || "";

      // Kiểm tra nếu là network error (backend không chạy)
      const isNetworkError = errorStatus === "FETCH_ERROR" ||
                             errorMessage.includes("fetch") ||
                             errorMessage.includes("network") ||
                             !errorStatus; // Không có status = network error

      if (isNetworkError) {
        console.warn("⚠️ Backend không khả dụng, bỏ qua auth check");
        dispatch(setInitialized());
        return;
      }

      const timeSinceLogin = loginTimeRef.current ? Date.now() - loginTimeRef.current : Infinity;
      const isRecentLogin = timeSinceLogin < 5000; // 5 giây sau khi login

      // QUAN TRỌNG: Không logout nếu vừa mới login thành công (có thể cookies chưa được set kịp trong incognito)
      if (isAuthenticated && isRecentLogin && retryCountRef.current < 2) {
        // Retry sau một khoảng thời gian ngắn (cookies có thể chưa được set kịp)
        console.log(`🔄 Retrying auth check (attempt ${retryCountRef.current + 1}/2) - cookies may not be set yet in incognito mode`);
        retryCountRef.current += 1;

        setTimeout(() => {
          refetch();
        }, 1000 * retryCountRef.current); // Retry sau 1s, 2s

        return; // Không logout, đợi retry
      }

      // Chỉ logout nếu:
      // 1. Không phải vừa mới login (không có isAuthenticated hoặc đã quá 5 giây)
      // 2. Hoặc đã retry 2 lần mà vẫn fail
      if (errorStatus === 401 || errorStatus === 403) {
        if (isAuthenticated && isRecentLogin) {
          console.warn("⚠️ Auth check failed after login, but user is authenticated. Keeping session.");
          // Không logout nếu vừa mới login và vẫn còn authenticated state
          dispatch(setInitialized());
          return;
        }
        console.log("🔓 Session expired, logging out...");
        dispatch(logoutThunk() as any);
      } else {
        if (isAuthenticated && isRecentLogin) {
          console.warn("⚠️ Auth check failed after login, but user is authenticated. Keeping session.");
          dispatch(setInitialized());
          return;
        }
        console.log("❌ No valid session found - token may be expired or invalid");
        // Không logout nếu là lỗi khác (có thể backend restart)
        dispatch(setInitialized());
      }
    }

    // Đánh dấu đã khởi tạo xong
    dispatch(setInitialized());
  }, [isSuccess, isError, data, dispatch, error, isLoading, isAuthenticated, refetch]);

  // Nếu đã có auth state từ localStorage và chưa cần gọi API
  if (isAuthenticated && isInitialized) {
    return { isLoading: false };
  }

  return { isLoading: isLoading || !isInitialized };
};

/**
 * Component wrapper để init auth state
 */
export const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isLoading } = useAuthInit();

  // Hiển thị loading khi đang kiểm tra auth state
  if (isLoading) {
    return React.createElement(LoadingPage);
  }

  return React.createElement(React.Fragment, null, children);
};
