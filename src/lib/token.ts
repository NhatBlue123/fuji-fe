/**
 * Token Utilities
 * Decode JWT, check expiry, manage cookie-based access token,
 * and schedule proactive refresh.
 *
 * Architecture:
 * - Access token: stored in JS-accessible cookie (for Authorization header)
 * - Refresh token: HttpOnly cookie managed by backend (not accessible from JS)
 */

interface JwtPayload {
  sub: string;
  exp: number;
  iat: number;
  username?: string;
  roles?: string[];
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

// ─── Cookie Helpers ───────────────────────────────────────

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(
      "(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)",
    ),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

// ─── Access Token (cookie-based) ──────────────────────────

const ACCESS_TOKEN_COOKIE = "access_token";

export function getAccessToken(): string | null {
  return getCookie(ACCESS_TOKEN_COOKIE);
}

export function setAccessToken(accessToken: string): void {
  setCookie(ACCESS_TOKEN_COOKIE, accessToken, 1);
}

/** @deprecated Refresh token is HttpOnly cookie, not accessible from JS */
export function getRefreshToken(): string | null {
  return null;
}

/**
 * Save access token to cookie.
 * refreshToken param is kept for backward compat but ignored (it's HttpOnly cookie).
 */
export function setTokens(accessToken: string, _refreshToken?: string): void {
  setAccessToken(accessToken);
}

export function clearTokens(): void {
  deleteCookie(ACCESS_TOKEN_COOKIE);
  // Clean up old localStorage data from previous implementation
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("auth_state");
  }
}

// ─── Proactive Refresh Scheduler ───
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleTokenRefresh(
  accessToken: string,
  refreshFn: () => void,
): void {
  cancelScheduledRefresh();

  const ttl = getTimeUntilExpiry(accessToken);
  if (ttl <= 0) {
    refreshFn();
    return;
  }

  // Refresh at 80% of TTL, but at least 30s before expiry
  const refreshIn = Math.max(ttl - 30_000, ttl * 0.8);
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
