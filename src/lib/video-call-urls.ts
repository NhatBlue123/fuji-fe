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

export function getSignalingUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SIGNALING_URL?.trim();
  if (explicit) return explicit;

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
    return `${window.location.protocol}//${window.location.hostname}:${DEFAULT_SIGNALING_PORT}`;
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
