"use client";

import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/store";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useAuth = () => {
  const {
    user,
    accessToken,
    roles,
    isAuthenticated,
    isLoading,
    error,
    isInitialized,
  } = useAppSelector((state) => state.auth);

  const normalizedRoles = Array.from(
    new Set([
      ...roles,
      ...(user?.role ? [user.role] : []),
      ...(user?.role ? [`ROLE_${user.role}`] : []),
    ]),
  );

  return {
    user,
    accessToken,
    roles: normalizedRoles,
    isAuthenticated,
    isLoading,
    error,
    isInitialized,
    // Helper kiểm tra role
    hasRole: (role: string) => normalizedRoles.includes(role),
    isAdmin:
      normalizedRoles.includes("ROLE_ADMIN") ||
      normalizedRoles.includes("ADMIN"),
    isTeacher:
      normalizedRoles.includes("ROLE_INSTRUCTOR") ||
      normalizedRoles.includes("INSTRUCTOR") ||
      normalizedRoles.includes("ROLE_TEACHER") ||
      normalizedRoles.includes("TEACHER"),
  };
};
