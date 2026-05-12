import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

/** Spring MappingJackson2MessageConverter binds @Payload JSON when this header is set. */
export const STOMP_JSON_HEADERS = { "content-type": "application/json" } as const;

export type StompConnectionState =
  | "CONNECTING"
  | "CONNECTED"
  | "DISCONNECTED"
  | "ERROR";

type SubscriptionRecord = {
  destination: string;
  callback: (frame: IMessage) => void;
  headers?: Record<string, string>;
  subscription?: StompSubscription;
};

type PublishParams = {
  destination: string;
  body?: string;
  headers?: Record<string, string>;
};

const BASE_WS_URL = `${
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "http://localhost:8181"
}/ws`;
const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

let stompClient: Client | null = null;
let clientToken: string | null = null;
let connectionState: StompConnectionState = "DISCONNECTED";
let reconnectAttempt = 0;
let intentionalDisconnect = false;
let subscriptionSeq = 0;

const subscriptions = new Map<number, SubscriptionRecord>();
const stateListeners = new Set<(state: StompConnectionState) => void>();

function shouldDebug(): boolean {
  if (process.env.NEXT_PUBLIC_STOMP_DEBUG === "true") return true;
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("stompDebug") === "1";
}

function debug(message: string, payload?: unknown) {
  if (!shouldDebug()) return;
  if (payload === undefined) {
    console.debug(`[STOMP] ${message}`);
    return;
  }
  console.debug(`[STOMP] ${message}`, payload);
}

function sanitizeStompDebug(message: string): string {
  return message
    .replace(/Authorization:Bearer\s+[^\n\r]+/gi, "Authorization:Bearer [redacted]")
    .replace(/([?&](?:token|access_token)=)[^&\s]+/gi, "$1[redacted]");
}

function setConnectionState(next: StompConnectionState) {
  if (connectionState === next) return;
  connectionState = next;
  stateListeners.forEach((listener) => listener(next));
}

function wsUrlForToken(token: string): string {
  const separator = BASE_WS_URL.includes("?") ? "&" : "?";
  return `${BASE_WS_URL}${separator}token=${encodeURIComponent(token)}`;
}

function nextReconnectDelay(): number {
  const delay = Math.min(
    MAX_RECONNECT_DELAY_MS,
    BASE_RECONNECT_DELAY_MS * 2 ** Math.min(reconnectAttempt, 5)
  );
  reconnectAttempt += 1;
  return delay;
}

function resubscribeAll(client: Client) {
  subscriptions.forEach((record, id) => {
    try {
      record.subscription?.unsubscribe();
    } catch {
      // The underlying socket is already gone.
    }

    record.subscription = client.subscribe(
      record.destination,
      (frame) => {
        debug("receive", record.destination);
        record.callback(frame);
      },
      record.headers
    );
    debug("subscribed", { id, destination: record.destination });
  });
}

function createClient(token: string): Client {
  const client = new Client({
    webSocketFactory: () => new SockJS(wsUrlForToken(token)),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
      access_token: token,
    },
    reconnectDelay: BASE_RECONNECT_DELAY_MS,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: shouldDebug()
      ? (message) => console.debug(`[STOMP] ${sanitizeStompDebug(message)}`)
      : () => undefined,
    beforeConnect: () => {
      setConnectionState("CONNECTING");
      debug("connecting");
    },
    onConnect: () => {
      reconnectAttempt = 0;
      client.reconnectDelay = BASE_RECONNECT_DELAY_MS;
      setConnectionState("CONNECTED");
      debug("connected");
      resubscribeAll(client);
    },
    onDisconnect: () => {
      if (!intentionalDisconnect) {
        setConnectionState("DISCONNECTED");
      }
      debug("disconnected");
    },
    onStompError: (frame) => {
      setConnectionState("ERROR");
      client.reconnectDelay = nextReconnectDelay();
      debug("broker error", frame.headers["message"]);
    },
    onWebSocketClose: () => {
      if (intentionalDisconnect) {
        setConnectionState("DISCONNECTED");
        return;
      }
      client.reconnectDelay = nextReconnectDelay();
      setConnectionState("DISCONNECTED");
      debug("socket closed; reconnect scheduled", client.reconnectDelay);
    },
    onWebSocketError: () => {
      setConnectionState("ERROR");
      debug("socket error");
    },
  });

  client.activate();
  return client;
}

export function getStompClient(token: string): Client {
  if (stompClient && clientToken === token) return stompClient;

  if (stompClient && clientToken !== token) {
    intentionalDisconnect = true;
    void stompClient.deactivate();
    stompClient = null;
  }

  intentionalDisconnect = false;
  clientToken = token;
  stompClient = createClient(token);
  return stompClient;
}

export function subscribeStomp(
  token: string,
  destination: string,
  callback: (frame: IMessage) => void,
  headers?: Record<string, string>
): () => void {
  const id = ++subscriptionSeq;
  const record: SubscriptionRecord = { destination, callback, headers };
  subscriptions.set(id, record);

  const client = getStompClient(token);
  if (client.connected) {
    record.subscription = client.subscribe(destination, callback, headers);
    debug("subscribed", { id, destination });
  }

  return () => {
    const current = subscriptions.get(id);
    subscriptions.delete(id);
    try {
      current?.subscription?.unsubscribe();
    } catch {
      // No-op.
    }
    debug("unsubscribed", { id, destination });
  };
}

export function publishStomp(token: string, params: PublishParams): boolean {
  const client = getStompClient(token);
  if (!client.connected) {
    debug("publish skipped while disconnected", params.destination);
    return false;
  }

  client.publish(params);
  debug("publish", params.destination);
  return true;
}

export function subscribeStompConnectionState(
  listener: (state: StompConnectionState) => void
): () => void {
  stateListeners.add(listener);
  listener(connectionState);
  return () => {
    stateListeners.delete(listener);
  };
}

export function getStompConnectionState(): StompConnectionState {
  return connectionState;
}

export function disconnectStomp(): void {
  intentionalDisconnect = true;
  subscriptions.forEach((record) => {
    try {
      record.subscription?.unsubscribe();
    } catch {
      // No-op.
    }
  });
  subscriptions.clear();

  if (stompClient) {
    void stompClient.deactivate();
    stompClient = null;
  }
  clientToken = null;
  reconnectAttempt = 0;
  setConnectionState("DISCONNECTED");
}
