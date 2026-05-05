"use client";

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
  useGetCurrentUserQuery(undefined, {
    skip: !token, // Only run if token exists
  });

  // This component doesn't render anything
  return null;
}
