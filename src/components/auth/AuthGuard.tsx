"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/hooks";

interface AuthGuardProps {
  children: React.ReactNode;
  /** URL chuyển hướng khi chưa đăng nhập (mặc định: /login) */
  redirectTo?: string;
  /** Hiển thị loading component tuỳ chỉnh */
  fallback?: React.ReactNode;
}

/**
 * Guard component - chỉ render children khi user đã đăng nhập.
 * Nếu chưa đăng nhập, chuyển hướng đến trang login.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  redirectTo = "/login",
  fallback,
}) => {
  const { isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isInitialized, isAuthenticated, router, redirectTo]);

  // Đang kiểm tra auth
  if (!isInitialized) {
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )
    );
  }

  // Chưa đăng nhập
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
