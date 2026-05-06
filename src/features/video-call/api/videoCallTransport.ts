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
  if (explicit) {
    // Add userId to explicit URL if not already present
    return addUserIdToWsUrl(explicit);
  }

  const apiUrl = getApiOrigin();
  const protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
  const baseUrl = `${protocol}//${apiUrl.host}/ws-video-call`;
  return addUserIdToWsUrl(baseUrl);
}

function addUserIdToWsUrl(baseUrl: string): string {
  if (typeof window === "undefined") return baseUrl;
  
  try {
    const authState = localStorage.getItem("auth_state");
    if (!authState) return baseUrl;
    
    const parsed = JSON.parse(authState);
    const user = parsed?.user ?? parsed?.userInfo ?? parsed?.profile;
    const userId = user?.id;
    
    if (!userId) return baseUrl;
    
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}userId=${encodeURIComponent(userId)}`;
  } catch {
    return baseUrl;
  }
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
