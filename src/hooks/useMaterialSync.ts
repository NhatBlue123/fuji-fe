"use client";

import { useEffect, useCallback, useState } from "react";
import { publishStomp, subscribeStomp, STOMP_JSON_HEADERS } from "@/lib/stomp";
import type { IMessage } from "@stomp/stompjs";

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

  useEffect(() => {
    if (!lessonId || !token) return;

    const unsubscribe = subscribeStomp(
      token,
      `/topic/room/${lessonId}/materials/page`,
      (frame: IMessage) => {
        try {
          const data: PageSyncEvent = JSON.parse(frame.body);
          setSyncedPage(data);
        } catch (err) {
          console.error("[MaterialSync] Failed to parse page sync:", err);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [lessonId, token]);

  const sendPageSync = useCallback(
    (materialId: number, pageNumber: number) => {
      if (!lessonId || !token) return;
      publishStomp(token, {
        destination: `/app/materials/${lessonId}/page`,
        body: JSON.stringify({ materialId, pageNumber }),
        headers: STOMP_JSON_HEADERS,
      });
    },
    [lessonId, token]
  );

  const toggleSync = useCallback(() => {
    setIsSyncEnabled((v) => !v);
  }, []);

  return { syncedPage, sendPageSync, isSyncEnabled, toggleSync };
}
