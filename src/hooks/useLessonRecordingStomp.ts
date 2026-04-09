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

    const attach = () => {
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

    if (client.connected) {
      attach();
    } else {
      client.onConnect = () => attach();
    }

    return () => {
      sub?.unsubscribe();
    };
  }, [lessonId, token]);

  const resetRemote = useCallback(() => setRemoteRecording(false), []);

  return { remoteRecording, resetRemote };
}
