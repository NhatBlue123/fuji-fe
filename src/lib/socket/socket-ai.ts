import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/token";

type AIAuthPayload = { token?: string };

const resolveAiSocketUrl = (): string => {
  if (typeof window === "undefined") {
    return (
      process.env.NEXT_PUBLIC_AI_SOCKET_URL ||
      process.env.NEXT_PUBLIC_AI_API_URL ||
      "http://localhost:3005"
    );
  }

  return (
    process.env.NEXT_PUBLIC_AI_SOCKET_URL ||
    process.env.NEXT_PUBLIC_AI_API_URL ||
    `${window.location.protocol}//${window.location.hostname}:3005`
  );
};

let aiSocket: Socket | null = null;

export function getAISocket(): Socket | null {
  return aiSocket;
}

export function connectAISocket(token?: string | null): Socket {
  const authToken = token || getAccessToken() || undefined;
  const authPayload: AIAuthPayload = authToken ? { token: authToken } : {};

  if (!aiSocket) {
    aiSocket = io(resolveAiSocketUrl(), {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      upgrade: true,
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: false,
      auth: authPayload,
    });
  }

  aiSocket.auth = authPayload;

  if (!aiSocket.connected) {
    aiSocket.connect();
  }

  return aiSocket;
}

export function disconnectAISocket(): void {
  if (aiSocket?.connected) {
    aiSocket.disconnect();
  }
}

export function destroyAISocket(): void {
  if (!aiSocket) return;
  aiSocket.removeAllListeners();
  aiSocket.disconnect();
  aiSocket = null;
}
