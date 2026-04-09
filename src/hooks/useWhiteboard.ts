"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { getStompClient } from "@/lib/stomp";
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

    const subscribe = () => {
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

    if (client.connected) {
      subscribe();
    } else {
      const origOnConnect = client.onConnect;
      client.onConnect = (frame) => {
        origOnConnect?.(frame);
        subscribe();
      };
    }

    return () => {
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
