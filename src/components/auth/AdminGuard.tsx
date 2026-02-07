"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/hooks";

interface AdminGuardProps {
  children: React.ReactNode;
  /** URL chuyển hướng khi không phải admin (mặc định: /) */
  redirectTo?: string;
  /** Hiển thị loading component tuỳ chỉnh */
  fallback?: React.ReactNode;
}

/**
 * Guard component - chỉ render children khi user có role ADMIN.
 * Nếu chưa đăng nhập → chuyển về /login
 * Nếu đăng nhập nhưng không phải admin → chuyển về redirectTo
 */
export const AdminGuard: React.FC<AdminGuardProps> = ({
  children,
  redirectTo = "/",
  fallback,
}) => {
  const { isAuthenticated, isInitialized, isAdmin } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!isAdmin) {
      router.replace(redirectTo);
    }
  }, [isInitialized, isAuthenticated, isAdmin, router, redirectTo]);

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

  // Chưa đăng nhập hoặc không phải admin
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return <>{children}</>;
};

export default AdminGuard;
