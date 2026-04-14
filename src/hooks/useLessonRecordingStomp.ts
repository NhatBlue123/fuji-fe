"use client";

import { useEffect, useState, useCallback } from "react";
import { getStompClient } from "@/lib/stomp";
import type { IMessage, StompSubscription } from "@stomp/stompjs";

export function useLessonRecordingStomp(lessonId: number | null, token: string | null) {
  const [remoteRecording, setRemoteRecording] = useState(false);

  useEffect(() => {
    if (!lessonId || !token) return;

    const client = getStompClient(token);
    let sub: StompSubscription | undefined;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const attach = () => {
      if (cancelled || sub) return;
      sub = client.subscribe(`/topic/room/${lessonId}/recording`, (frame: IMessage) => {
        try {
          const p = JSON.parse(frame.body) as { recording?: boolean };
          if (typeof p.recording === "boolean") {
            setRemoteRecording(p.recording);
          }
        } catch {
          /* ignore */
        }
      });
    };

    const waitUntilConnected = () => {
      if (cancelled) return;
      if (client.connected) {
        attach();
        return;
      }
      retryTimer = setTimeout(waitUntilConnected, 150);
    };

    waitUntilConnected();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      sub?.unsubscribe();
    };
  }, [lessonId, token]);

  const resetRemote = useCallback(() => setRemoteRecording(false), []);

  return { remoteRecording, resetRemote };
}
