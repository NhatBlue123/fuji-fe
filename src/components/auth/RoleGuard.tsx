"use client";

import React from "react";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@/store/hooks";

interface RoleGuardProps {
  children: React.ReactNode;
  /** Roles được phép truy cập (chỉ cần có 1 trong các role) */
  allowedRoles?: string[];
  /** URL chuyển hướng khi không có quyền (mặc định: /) */
  redirectTo?: string;
  /** Hiển thị loading component tuỳ chỉnh */
  fallback?: React.ReactNode;
}

/**
 * Guard component - chỉ render children khi user có ít nhất 1 role trong allowedRoles.
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  // allowedRoles,
  // redirectTo = "/",
  // fallback,
}) => {
  // TEMPORARY: Tắt role guard để dev - CHỈ DÙNG KHI DEV, NHỚ BẬT LẠI!
  return <>{children}</>;

  /* const { isAuthenticated, isInitialized, roles } = useAuth();
  const router = useRouter();

  const hasRequiredRole = allowedRoles.some((role) => roles.includes(role));

  React.useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!hasRequiredRole) {
      router.replace(redirectTo);
    }
  }, [isInitialized, isAuthenticated, hasRequiredRole, router, redirectTo]);

  if (!isInitialized) {
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )
    );
  }

  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }

  return <>{children}</>; */
};

export default RoleGuard;
