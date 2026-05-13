"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  publishStomp,
  subscribeStomp,
  subscribeStompConnectionState,
  STOMP_JSON_HEADERS,
} from "@/lib/stomp";
import type { IMessage } from "@stomp/stompjs";

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
  const changeHandlerRef = useRef<((data: WhiteboardBroadcast) => void) | null>(null);
  const clearHandlerRef = useRef<(() => void) | null>(null);
  const pendingChangesRef = useRef<unknown[]>([]);

  const publishChanges = useCallback(
    (changes: unknown): boolean => {
      if (!lessonId || !token) return false;
      return publishStomp(token, {
        destination: `/app/whiteboard/${lessonId}/change`,
        body: JSON.stringify({ changes }),
        headers: STOMP_JSON_HEADERS,
      });
    },
    [lessonId, token]
  );

  const flushPendingChanges = useCallback(() => {
    if (!pendingChangesRef.current.length) return;
    const pending = pendingChangesRef.current;
    pendingChangesRef.current = [];

    for (let i = 0; i < pending.length; i += 1) {
      const changes = pending[i];
      if (!publishChanges(changes)) {
        pendingChangesRef.current.unshift(...pending.slice(i));
        pendingChangesRef.current = pendingChangesRef.current.slice(-100);
        break;
      }
    }
  }, [publishChanges]);

  useEffect(() => {
    if (!lessonId || !token) return;

    const unsubState = subscribeStompConnectionState((state) => {
      const connected = state === "CONNECTED";
      setIsConnected(connected);
      if (connected) {
        flushPendingChanges();
      }
    });

    const unsubChanges = subscribeStomp(
      token,
      `/topic/room/${lessonId}/whiteboard`,
      (frame: IMessage) => {
        try {
          const data: WhiteboardBroadcast = JSON.parse(frame.body);
          changeHandlerRef.current?.(data);
        } catch (err) {
          console.error("[Whiteboard] Failed to parse change:", err);
        }
      }
    );

    const unsubClear = subscribeStomp(
      token,
      `/topic/room/${lessonId}/whiteboard/clear`,
      () => {
        clearHandlerRef.current?.();
      }
    );

    return () => {
      setIsConnected(false);
      unsubState();
      unsubChanges();
      unsubClear();
    };
  }, [lessonId, token, flushPendingChanges]);

  const sendChanges = useCallback(
    (changes: unknown) => {
      if (publishChanges(changes)) return;
      pendingChangesRef.current = [...pendingChangesRef.current, changes].slice(-100);
    },
    [publishChanges]
  );

  const clearBoard = useCallback(() => {
    if (!lessonId || !token) return;
    publishStomp(token, {
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
