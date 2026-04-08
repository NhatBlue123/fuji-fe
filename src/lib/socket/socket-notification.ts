import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/token";
import { getSignalingUrl } from "@/lib/video-call-urls";

function getNotificationUrl(): string {
  const base = getSignalingUrl().replace(/\/$/, "");
  return `${base}/notifications`;
}

let notificationSocket: Socket | null = null;

export function connectNotificationSocket(token?: string | null, userId?: number | string): Socket {
  const authToken = token || getAccessToken() || undefined;
  
  // Handshake data according to netty-socketio setup
  const authPayload = authToken ? { token: authToken } : {};
  const queryPayload = userId ? { userId: userId.toString() } : {};

  if (!notificationSocket) {
    notificationSocket = io(getNotificationUrl(), {
      transports: ["websocket"],
      auth: authPayload,
      query: queryPayload,
      autoConnect: false,
    });
  } else {
    // Update auth and query if already exists
    notificationSocket.auth = authPayload;
    if (userId) {
      notificationSocket.io.opts.query = { 
        ...notificationSocket.io.opts.query,
        userId: userId.toString() 
      };
    }
  }

  if (!notificationSocket.connected) {
    notificationSocket.connect();
  }

  return notificationSocket;
}

export function disconnectNotificationSocket(): void {
  if (notificationSocket?.connected) {
    notificationSocket.disconnect();
  }
}
