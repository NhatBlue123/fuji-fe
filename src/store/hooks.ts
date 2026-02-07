"use client";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";

/**
 * Custom hook để access auth state và methods
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading, error, isInitialized } = useSelector(
    (state: RootState) => state.auth,
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    isInitialized,
  };
};
