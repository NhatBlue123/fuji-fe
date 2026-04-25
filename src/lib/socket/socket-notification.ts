import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/token";
import { getSignalingUrl } from "@/lib/video-call-urls";

function getNotificationUrl(): string {
  const base = getSignalingUrl().replace(/\/$/, "");
  return `${base}/notifications`;
}

let notificationSocket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

export function connectNotificationSocket(token?: string | null, userId?: number | string): Socket {
  const authToken = token || getAccessToken() || undefined;

  // Build query payload for netty-socketio (token & userId in query)
  const queryPayload: Record<string, string> = {};
  if (userId) {
    queryPayload.userId = userId.toString();
  }
  if (authToken) {
    queryPayload.token = authToken;
  }

  console.log("[SocketNotification] Connecting with query:", queryPayload, "to URL:", getNotificationUrl());

  if (!notificationSocket) {
    notificationSocket = io(getNotificationUrl(), {
      transports: ["websocket"],
      autoConnect: false,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_DELAY,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      query: queryPayload,
    });

    // Event listeners
    notificationSocket.on("connect", () => {
      console.log("[SocketNotification] Connected to notification namespace, socketId:", notificationSocket?.id);
      reconnectAttempts = 0;
      // Room will be auto-joined by backend using userId from query
    });

    notificationSocket.on("connect_error", (error) => {
      console.error("[SocketNotification] Connection error:", error.message, error);
    });

    notificationSocket.on("disconnect", (reason) => {
      console.log("[SocketNotification] Disconnected:", reason);
    });

    notificationSocket.on("error", (error) => {
      console.error("[SocketNotification] Error:", error);
    });

    // Debug: Listen for ALL events to see what's coming from server
    notificationSocket.on("new-notification", (data) => {
      console.log("[SocketNotification] 🔥 RAW EVENT 'new-notification' received:", data);
    });

    // Also log any event that comes through
    notificationSocket.onAny((eventName, ...args) => {
      console.log("[SocketNotification] 📡 Event received:", eventName, args);
    });
  }

  if (!notificationSocket.connected) {
    console.log("[SocketNotification] Socket not connected, connecting now...");
    notificationSocket.connect();
  }

  return notificationSocket;
}

export function disconnectNotificationSocket(): void {
  if (notificationSocket) {
    notificationSocket.off("connect");
    notificationSocket.off("connect_error");
    notificationSocket.off("disconnect");
    notificationSocket.off("error");

    if (notificationSocket.connected) {
      notificationSocket.disconnect();
    }
    notificationSocket = null;
    reconnectAttempts = 0;
  }
}

export function isNotificationSocketConnected(): boolean {
  return notificationSocket?.connected || false;
}
