import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/token";
import { getSignalingUrl } from "@/lib/video-call-urls";

function getNotificationUrl(): string {
  const base = getSignalingUrl().replace(/\/$/, "");
  return `${base}/notifications`;
}

let notificationSocket: Socket | null = null;
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
    notificationSocket.on("connect_error", (error) => {
      console.error("[SocketNotification] Connection error:", error.message, error);
    });

    notificationSocket.on("error", (error) => {
      console.error("[SocketNotification] Error:", error);
    });
  }

  if (!notificationSocket.connected) {
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
  }
}

export function isNotificationSocketConnected(): boolean {
  return notificationSocket?.connected || false;
}
