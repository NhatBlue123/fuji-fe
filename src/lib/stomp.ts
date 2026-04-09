import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let stompClient: Client | null = null;

const WS_URL = `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "http://localhost:8181"}/ws`;

export function getStompClient(token: string): Client {
  if (stompClient?.connected) return stompClient;

  stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: (str) => {
      if (process.env.NODE_ENV === "development") {
        console.log("[STOMP]", str);
      }
    },
  });

  stompClient.activate();
  return stompClient;
}

export function disconnectStomp(): void {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
}
