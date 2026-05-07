import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/token";
import { getSignalingUrl } from "@/lib/video-call-urls";

function getPaymentUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_PAYMENT_SOCKET_URL?.trim();
  if (explicit) {
    const base = explicit.replace(/\/$/, "");
    return base.endsWith("/payment") ? base : `${base}/payment`;
  }

  const base = getSignalingUrl().replace(/\/$/, "");
  return `${base}/payment`;
}

let paymentSocket: Socket | null = null;

/**
 * Kết nối Socket.IO namespace /payment
 * Dùng cùng pattern như socket-notification.ts
 */
export function connectPaymentSocket(token?: string | null, userId?: number | string): Socket {
  const authToken = token || getAccessToken() || undefined;

  const authPayload = authToken ? { token: authToken } : {};
  const queryPayload = userId ? { userId: userId.toString() } : {};

  if (!paymentSocket) {
    paymentSocket = io(getPaymentUrl(), {
      transports: ["websocket"],
      auth: authPayload,
      query: queryPayload,
      autoConnect: false,
    });
  } else {
    // Update auth and query if socket already exists
    paymentSocket.auth = authPayload;
    if (userId) {
      paymentSocket.io.opts.query = {
        ...paymentSocket.io.opts.query,
        userId: userId.toString(),
      };
    }
  }

  if (!paymentSocket.connected) {
    paymentSocket.connect();
  }

  return paymentSocket;
}

export function disconnectPaymentSocket(): void {
  if (paymentSocket?.connected) {
    paymentSocket.disconnect();
  }
}

export function getPaymentSocket(): Socket | null {
  return paymentSocket;
}
