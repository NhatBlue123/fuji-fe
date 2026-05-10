import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

/** Spring MappingJackson2MessageConverter binds @Payload JSON when this header is set. */
export const STOMP_JSON_HEADERS = { "content-type": "application/json" } as const;

let stompClient: Client | null = null;

const WS_URL = `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "http://localhost:8181"}/ws`;

export function getStompClient(token: string): Client {
  // Reuse existing client in all states (connecting/connected/reconnecting)
  // to avoid losing subscriptions by recreating the socket repeatedly.
  if (stompClient) return stompClient;

  stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
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
