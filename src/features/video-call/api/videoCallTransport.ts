import { API_CONFIG } from "@/config/api";
import { getAccessToken } from "@/lib/token";

let cachedIceServers: RTCIceServer[] | null = null;

function getApiOrigin(): URL {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || API_CONFIG.BASE_URL;
  if (typeof window === "undefined") {
    return new URL(apiBase);
  }
  return new URL(apiBase, window.location.origin);
}

export function getRandomVideoCallWsUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_VIDEO_CALL_WS_URL?.trim();
  if (explicit) return explicit;

  const apiUrl = getApiOrigin();
  const protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${apiUrl.host}/ws-video-call`;
}

export async function fetchVideoCallIceServers(): Promise<RTCIceServer[]> {
  if (cachedIceServers) return cachedIceServers;

  try {
    const headers: HeadersInit = {};
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const base = API_CONFIG.BASE_URL.replace(/\/$/, "");
    const res = await fetch(`${base}/video-call/config`, {
      headers,
      credentials: "include",
    });
    if (!res.ok) throw new Error(`ICE config HTTP ${res.status}`);

    const json: { iceServers?: RTCIceServer[] } | RTCIceServer[] =
      await res.json();
    const iceServers = Array.isArray(json) ? json : json.iceServers;

    if (iceServers?.length) {
      cachedIceServers = iceServers;
      return cachedIceServers;
    }
  } catch (error) {
    console.warn("[VideoCall] Failed to load ICE config; using STUN fallback.", error);
  }

  cachedIceServers = [{ urls: "stun:stun.l.google.com:19302" }];
  return cachedIceServers;
}
