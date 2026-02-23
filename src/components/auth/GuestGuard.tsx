"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/hooks";

interface GuestGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Guard component - chỉ render children khi user CHƯA đăng nhập.
 * Nếu đã đăng nhập, chuyển hướng về trang chủ.
 * Dùng cho trang login/register.
 */
export const GuestGuard: React.FC<GuestGuardProps> = ({
  children,
  redirectTo = "/",
}) => {
  const { isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isInitialized, isAuthenticated, router, redirectTo]);

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return <>{children}</>;
};

export default GuestGuard;
