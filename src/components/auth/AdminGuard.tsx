"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/store/hooks";
import { usePermissions } from "@/hooks/usePermissions";

interface AdminGuardProps {
  children: React.ReactNode;
  /** URL chuyển hướng khi không có quyền (mặc định: /) */
  redirectTo?: string;
  /** Hiển thị loading component tuỳ chỉnh */
  fallback?: React.ReactNode;
}

/**
 * Guard component - render children khi user là ADMIN hoặc INSTRUCTOR có quyền.
 * Nếu chưa đăng nhập → chuyển về /login
 * Nếu không có quyền admin → chuyển về redirectTo
 */
export const AdminGuard: React.FC<AdminGuardProps> = ({
  children,
  redirectTo = "/",
  fallback,
}) => {
  const { isAuthenticated, isInitialized, isAdmin } = useAuth();
  const {
    hasAnyAdminAccess,
    canAccessRoute,
    isInstructor,
    isLoading: permLoading,
  } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();

  const instructorFallback = React.useMemo(() => {
    const candidates = [
      "/admin/teacher-dashboard",
      "/admin/teacher-schedules",
      "/admin/courses",
      "/admin/courses/finance/teacher",
      "/admin/my-wallet",
    ];
    return candidates.find((route) => canAccessRoute(route)) ?? redirectTo;
  }, [canAccessRoute, redirectTo]);

  const canAccess =
    isAdmin || (hasAnyAdminAccess && canAccessRoute(pathname || ""));
  const isReady = isInitialized && !permLoading;

  React.useEffect(() => {
    if (!isReady) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!canAccess) {
      router.replace(isInstructor ? instructorFallback : redirectTo);
    }
  }, [
    isReady,
    isAuthenticated,
    canAccess,
    router,
    redirectTo,
    isInstructor,
    instructorFallback,
  ]);

  // Đang kiểm tra auth hoặc permissions
  if (!isReady) {
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )
    );
  }

  // Không có quyền truy cập
  if (!isAuthenticated || !canAccess) {
    return null;
  }

  return <>{children}</>;
};

export default AdminGuard;
