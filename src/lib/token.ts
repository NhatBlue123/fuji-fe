/**
 * Token Utilities
 * Decode JWT, check expiry, manage localStorage tokens,
 * and schedule proactive refresh.
 */

interface JwtPayload {
  sub: string; // subject (username or userId)
  exp: number; // expiry timestamp (seconds)
  iat: number; // issued at (seconds)
  roles?: string[]; // user roles
  email?: string;
  [key: string]: unknown;
}

// ─── Decode JWT without library ───
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

// ─── Check if token is expired ───
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload?.exp) return true;
  // Add 10s buffer
  return Date.now() >= payload.exp * 1000 - 10_000;
}

// ─── Get time until expiry in ms ───
export function getTimeUntilExpiry(token: string): number {
  const payload = decodeJwt(token);
  if (!payload?.exp) return 0;
  return Math.max(0, payload.exp * 1000 - Date.now());
}

// ─── Extract roles from token ───
export function getRolesFromToken(token: string): string[] {
  const payload = decodeJwt(token);
  return payload?.roles ?? [];
}

// ─── Token Storage Keys ───
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// ─── Storage helpers ───
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("auth_state");
}

// ─── Proactive Refresh Scheduler ───
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Schedule a token refresh to fire before the access token expires.
 * Refreshes at 80% of the token's lifetime (e.g. 48 min for a 60 min token).
 */
export function scheduleTokenRefresh(
  accessToken: string,
  refreshFn: () => void,
): void {
  cancelScheduledRefresh();

  const ttl = getTimeUntilExpiry(accessToken);
  if (ttl <= 0) {
    // Already expired, refresh immediately
    refreshFn();
    return;
  }

  // Refresh at 80% of remaining lifetime, min 30s
  const refreshIn = Math.max(ttl * 0.8, 30_000);
  console.log(`⏰ Token refresh scheduled in ${Math.round(refreshIn / 1000)}s`);

  refreshTimer = setTimeout(() => {
    console.log("🔄 Proactive token refresh triggered");
    refreshFn();
  }, refreshIn);
}

export function cancelScheduledRefresh(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}
