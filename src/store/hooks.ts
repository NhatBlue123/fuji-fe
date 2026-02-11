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

  return {
    user,
    accessToken,
    roles,
    isAuthenticated,
    isLoading,
    error,
    isInitialized,
    // Helper kiểm tra role
    hasRole: (role: string) => roles.includes(role),
    isAdmin: roles.includes("ROLE_ADMIN") || roles.includes("ADMIN"),
  };
};
