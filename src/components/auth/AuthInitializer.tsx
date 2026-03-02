"use client";

import { useEffect } from "react";
import { useGetCurrentUserQuery } from "@/store/services/authApi";
import { getAccessToken } from "@/lib/token";

/**
 * AuthInitializer - Restores user session on app startup
 * 
 * This component runs once when the app loads and checks if there's
 * a valid access token in cookies. If found, it fetches the user profile
 * to restore the authentication state.
 * 
 * Uses useGetCurrentUserQuery with skip to eagerly initialize the query.
 */
export default function AuthInitializer() {
  const token = getAccessToken();
  
  // Use the regular query hook with skip based on token existence
  // This ensures the query is cached and available to other components
  const { data: user, error, isLoading } = useGetCurrentUserQuery(undefined, {
    skip: !token, // Only run if token exists
  });

  useEffect(() => {
    console.log("🔄 AuthInitializer: Starting auth check...");
    
    if (!token) {
      console.log("ℹ️ AuthInitializer: No access token found - user not logged in");
      return;
    }
    
    console.log("✅ AuthInitializer: Token found, restoring session...");
    console.log("🔑 Token preview:", token.substring(0, 20) + "...");
  }, [token]);

  useEffect(() => {
    if (user) {
      console.log("✅ AuthInitializer: Session restored successfully!");
      console.log("👤 User:", user);
    } else if (error) {
      console.error("❌ AuthInitializer: Failed to restore session:", error);
    }
  }, [user, error]);

  // This component doesn't render anything
  return null;
}
