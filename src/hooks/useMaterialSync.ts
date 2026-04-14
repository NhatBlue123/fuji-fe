"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { getStompClient } from "@/lib/stomp";
import type { StompSubscription, IMessage } from "@stomp/stompjs";

export interface PageSyncEvent {
  materialId: number;
  pageNumber: number;
  syncedBy: string;
}

interface UseMaterialSyncReturn {
  syncedPage: PageSyncEvent | null;
  sendPageSync: (materialId: number, pageNumber: number) => void;
  isSyncEnabled: boolean;
  toggleSync: () => void;
}

export function useMaterialSync(
  lessonId: number | null,
  token: string | null
): UseMaterialSyncReturn {
  const [syncedPage, setSyncedPage] = useState<PageSyncEvent | null>(null);
  const [isSyncEnabled, setIsSyncEnabled] = useState(true);
  const subRef = useRef<StompSubscription | null>(null);

  useEffect(() => {
    if (!lessonId || !token) return;

    const client = getStompClient(token);
    let cancelled = false;
    let subscribed = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const subscribe = () => {
      if (cancelled || subscribed) return;
      subscribed = true;
      subRef.current = client.subscribe(
        `/topic/room/${lessonId}/materials/page`,
        (frame: IMessage) => {
          const data: PageSyncEvent = JSON.parse(frame.body);
          setSyncedPage(data);
        }
      );
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
      try { subRef.current?.unsubscribe(); } catch { /* ignore */ }
    };
  }, [lessonId, token]);

  const sendPageSync = useCallback(
    (materialId: number, pageNumber: number) => {
      if (!lessonId || !token) return;
      const client = getStompClient(token);
      if (!client.connected) return;

      client.publish({
        destination: `/app/materials/${lessonId}/page`,
        body: JSON.stringify({ materialId, pageNumber }),
      });
    },
    [lessonId, token]
  );

  const toggleSync = useCallback(() => {
    setIsSyncEnabled((v) => !v);
  }, []);

  return { syncedPage, sendPageSync, isSyncEnabled, toggleSync };
}
