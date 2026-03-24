"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/hooks";

interface TeacherGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * Guard cho teacher dashboard.
 * - Teacher (INSTRUCTOR/TEACHER): được vào
 * - Admin: được vào như superuser
 * - User khác: chuyển hướng
 */
export const TeacherGuard: React.FC<TeacherGuardProps> = ({
  children,
  redirectTo = "/",
  fallback,
}) => {
  const { isAuthenticated, isInitialized, isTeacher, isAdmin } = useAuth();
  const router = useRouter();

  const canAccess = isTeacher || isAdmin;

  React.useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!canAccess) {
      router.replace(redirectTo);
    }
  }, [isInitialized, isAuthenticated, canAccess, router, redirectTo]);

  if (!isInitialized) {
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )
    );
  }

  if (!isAuthenticated || !canAccess) {
    return null;
  }

  return <>{children}</>;
};

export default TeacherGuard;
