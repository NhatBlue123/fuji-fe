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

  useEffect(() => {
    if (!lessonId || !token) return;

    const unsubState = subscribeStompConnectionState((state) => {
      setIsConnected(state === "CONNECTED");
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
  }, [lessonId, token]);

  const sendChanges = useCallback(
    (changes: unknown) => {
      if (!lessonId || !token) return;
      publishStomp(token, {
        destination: `/app/whiteboard/${lessonId}/change`,
        body: JSON.stringify({ changes }),
        headers: STOMP_JSON_HEADERS,
      });
    },
    [lessonId, token]
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
