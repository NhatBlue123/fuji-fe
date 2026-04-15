"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { getStompClient, STOMP_JSON_HEADERS } from "@/lib/stomp";
import type { StompSubscription, IMessage } from "@stomp/stompjs";

export interface WhiteboardBroadcast {
  userId: string;
  userName: string;
  changes: unknown;
}

interface UseWhiteboardReturn {
  sendChanges: (changes: unknown) => void;
  clearBoard: () => void;
  onRemoteChange: (handler: (data: WhiteboardBroadcast) => void) => void;
  onRemoteClear: (handler: () => void) => void;
  isConnected: boolean;
}

export function useWhiteboard(
  lessonId: number | null,
  token: string | null
): UseWhiteboardReturn {
  const [isConnected, setIsConnected] = useState(false);
  const subsRef = useRef<StompSubscription[]>([]);
  const changeHandlerRef = useRef<((data: WhiteboardBroadcast) => void) | null>(null);
  const clearHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!lessonId || !token) return;

    const client = getStompClient(token);
    let cancelled = false;
    let subscribed = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const subscribe = () => {
      if (cancelled || subscribed) return;
      subscribed = true;
      setIsConnected(true);

      const changeSub = client.subscribe(
        `/topic/room/${lessonId}/whiteboard`,
        (frame: IMessage) => {
          const data: WhiteboardBroadcast = JSON.parse(frame.body);
          changeHandlerRef.current?.(data);
        }
      );

      const clearSub = client.subscribe(
        `/topic/room/${lessonId}/whiteboard/clear`,
        () => {
          clearHandlerRef.current?.();
        }
      );

      subsRef.current = [changeSub, clearSub];
    };

    const waitUntilConnected = () => {
      if (cancelled) return;
      if (client.connected) {
        subscribe();
        return;
      }
      retryTimer = setTimeout(waitUntilConnected, 150);
    };

    waitUntilConnected();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      setIsConnected(false);
      subsRef.current.forEach((s) => {
        try { s.unsubscribe(); } catch { /* ignore */ }
      });
      subsRef.current = [];
    };
  }, [lessonId, token]);

  const sendChanges = useCallback(
    (changes: unknown) => {
      if (!lessonId || !token) return;
      const client = getStompClient(token);
      if (!client.connected) return;

      client.publish({
        destination: `/app/whiteboard/${lessonId}/change`,
        body: JSON.stringify({ changes }),
        headers: STOMP_JSON_HEADERS,
      });
    },
    [lessonId, token]
  );

  const clearBoard = useCallback(() => {
    if (!lessonId || !token) return;
    const client = getStompClient(token);
    if (!client.connected) return;

    client.publish({
      destination: `/app/whiteboard/${lessonId}/clear`,
      body: "{}",
      headers: STOMP_JSON_HEADERS,
    });
  }, [lessonId, token]);

  const onRemoteChange = useCallback((handler: (data: WhiteboardBroadcast) => void) => {
    changeHandlerRef.current = handler;
  }, []);

  const onRemoteClear = useCallback((handler: () => void) => {
    clearHandlerRef.current = handler;
  }, []);

  return { sendChanges, clearBoard, onRemoteChange, onRemoteClear, isConnected };
}
