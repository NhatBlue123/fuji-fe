/**
 * Origin của backend (không có path /api), dùng cho OAuth2 redirect (/oauth2/authorization/google).
 */
export function getBackendOrigin(): string {
  const api =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8181/api";
  try {
    const u = new URL(api);
    return `${u.protocol}//${u.host}`;
  } catch {
    return "http://localhost:8181";
  }
}

export function getGoogleOAuthAuthorizationUrl(): string {
  return `${getBackendOrigin()}/oauth2/authorization/google`;
}
