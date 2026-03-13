/**
 * useReconnect — detects network loss via WebRTC iceConnectionState
 * and attempts to re-establish within a 10-second window.
 */
"use client";

import { useRef, useState, useCallback } from "react";
import { useSignaling } from "./useSignaling";
import { useWebRTC } from "./useWebRTC";

export type ReconnectState = "idle" | "disconnected" | "reconnecting" | "failed" | "connected";

export interface ReconnectHook {
  reconnectState: ReconnectState;
  countdown: number;             // seconds remaining in reconnect window
  handleConnectionStateChange: (state: RTCPeerConnectionState, roomId: string, userId: string) => void;
  reset: () => void;
}

const RECONNECT_WINDOW_SEC = 10;

export function useReconnect(
  signaling: ReturnType<typeof useSignaling>,
  webrtc: ReturnType<typeof useWebRTC>
): ReconnectHook {
  const [reconnectState, setReconnectState] = useState<ReconnectState>("idle");
  const [countdown, setCountdown] = useState(RECONNECT_WINDOW_SEC);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timerRef.current = null;
    intervalRef.current = null;
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setReconnectState("idle");
    setCountdown(RECONNECT_WINDOW_SEC);
  }, [clearTimers]);

  const handleConnectionStateChange = useCallback(
    (state: RTCPeerConnectionState, roomId: string, userId: string) => {
      if (state === "connected") {
        clearTimers();
        setReconnectState("connected");
        setCountdown(RECONNECT_WINDOW_SEC);
        return;
      }

      if (state === "disconnected" || state === "failed") {
        setReconnectState("disconnected");
        let remaining = RECONNECT_WINDOW_SEC;
        setCountdown(remaining);

        // Countdown ticker
        intervalRef.current = setInterval(() => {
          remaining--;
          setCountdown(remaining);
          if (remaining <= 0) clearTimers();
        }, 1000);

        // Attempt reconnect
        setReconnectState("reconnecting");
        signaling.reconnectAttempt(roomId, userId);

        // Fail after window
        timerRef.current = setTimeout(() => {
          clearTimers();
          setReconnectState("failed");
        }, RECONNECT_WINDOW_SEC * 1000);
      }
    },
    [clearTimers, signaling]
  );

  return { reconnectState, countdown, handleConnectionStateChange, reset };
}
