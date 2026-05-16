/**
 * Video call (Socket.IO signaling + ICE config) URL resolution.
 *
 * Why this exists:
 * - Two tabs on one PC work because both use the same localhost signaling + API.
 * - Two different PCs fail if one still points signaling/ICE to "localhost" on *that* PC
 *   instead of the machine running the backend.
 *
 * Set NEXT_PUBLIC_SIGNALING_URL for production or non-default ports.
 * Otherwise we derive the signaling host from NEXT_PUBLIC_API_URL (same LAN IP as REST API).
 */

const DEFAULT_SIGNALING_PORT = "8081";

function isProduction(): boolean {
  if (typeof window === "undefined") return false;
  const debug = new URLSearchParams(window.location.search).get("env");
  if (debug === "prod") return true;
  if (debug === "local") return false;
  const hostname = window.location.hostname;
  return hostname !== "localhost" && hostname !== "127.0.0.1" && !hostname.startsWith("192.168.")
    && !hostname.startsWith("10.") && !hostname.endsWith(".local");
}

export function getSignalingUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SIGNALING_URL?.trim();
  if (explicit) return explicit;

  // Production: always use wss for secure WebSocket
  if (isProduction()) {
    const api = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (api) {
      try {
        const u = new URL(api);
        return `wss://${u.host}/`;
      } catch { /* fall through */ }
    }
    return `wss://${window.location.host}/`;
  }

  // Development: derive from API URL or current location
  const api = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (typeof window !== "undefined" && api) {
    try {
      const u = new URL(api);
      const port =
        process.env.NEXT_PUBLIC_SIGNALING_PORT?.trim() || DEFAULT_SIGNALING_PORT;
      return `${u.protocol}//${u.hostname}:${port}`;
    } catch {
      /* fall through */
    }
  }

  if (typeof window !== "undefined") {
    const port =
      process.env.NEXT_PUBLIC_SIGNALING_PORT?.trim() || DEFAULT_SIGNALING_PORT;
    return `${window.location.protocol}//${window.location.hostname}:${port}`;
  }

  return `http://localhost:${DEFAULT_SIGNALING_PORT}`;
}

/** GET JSON { iceServers: RTCIceServer[] } — must match backend VideoCallRestController */
export function getVideoCallIceConfigUrl(): string {
  const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8181/api").replace(
    /\/$/,
    "",
  );
  return `${base}/video-call/config`;
}
