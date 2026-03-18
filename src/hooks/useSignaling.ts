/**
 * useSignaling — manages Socket.IO connection to the signaling server
 * and exposes typed emit helpers + event subscription utilities.
 */
import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

// Resolve signaling URL in a way that works across devices:
// - Prefer explicit NEXT_PUBLIC_SIGNALING_URL (for production / custom domains)
// - Fallback: use current hostname + default signaling port (8081)
const SIGNALING_URL =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_SIGNALING_URL || "http://localhost:8081"
    : process.env.NEXT_PUBLIC_SIGNALING_URL ||
      `${window.location.protocol}//${window.location.hostname}:8081`;

export interface SignalingHook {
  socket: Socket | null;
  joinQueue: (payload: JoinQueuePayload) => void;
  leaveQueue: () => void;
  sendOffer: (roomId: string, sdp: string) => void;
  sendAnswer: (roomId: string, sdp: string) => void;
  sendIceCandidate: (roomId: string, candidate: RTCIceCandidate) => void;
  sendChatMessage: (roomId: string, senderId: string, senderName: string, message: string) => void;
  leaveRoom: (roomId: string) => void;
  reconnectAttempt: (roomId: string, userId: string) => void;
  on: <T = unknown>(event: string, handler: (data: T) => void) => void;
  off: (event: string) => void;
}

export interface JoinQueuePayload {
  userId: string;
  jlptLevel: "N1" | "N2" | "N3" | "N4" | "N5";
  displayName: string;
  avatarUrl?: string;
}

let globalSocket: Socket | null = null;
let activeCount = 0;

if (typeof window !== "undefined") {
  globalSocket = io(SIGNALING_URL, {
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    autoConnect: false, // connect when first hook mounts
  });

  globalSocket.on("connect", () => {
    console.log("[Signaling] Connected:", globalSocket?.id);
  });

  globalSocket.on("connect_error", (err) => {
    console.error("[Signaling] Connection error:", err.message);
  });
}

export function useSignaling(): SignalingHook {
  useEffect(() => {
    activeCount++;
    if (globalSocket && !globalSocket.connected) {
      globalSocket.connect();
    }

    return () => {
      activeCount--;
      // Delay disconnect to survive page transitions (e.g. match -> room)
      setTimeout(() => {
        if (activeCount === 0 && globalSocket?.connected) {
          globalSocket.disconnect();
          console.log("[Signaling] No active hooks, disconnected.");
        }
      }, 3000);
    };
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    if (globalSocket?.connected) {
      globalSocket.emit(event, data);
    } else {
      console.error(`[Signaling] ❌ emit FAILED — not connected! event="${event}" socketId=${globalSocket?.id}`);
    }
  }, []);

  return {
    socket: globalSocket,

    joinQueue: (payload) => emit("join-queue", payload),
    leaveQueue: () => emit("leave-queue"),
    sendOffer: (roomId, sdp) => emit("offer", { roomId, sdp, type: "offer" }),
    sendAnswer: (roomId, sdp) => emit("answer", { roomId, sdp, type: "answer" }),
    sendIceCandidate: (roomId, candidate) =>
      emit("ice-candidate", {
        roomId,
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
      }),
    sendChatMessage: (roomId, senderId, senderName, message) =>
      emit("send-message", { roomId, senderId, senderName, message }),
    leaveRoom: (roomId) => emit("leave-room", { roomId }),
    reconnectAttempt: (roomId, userId) =>
      emit("reconnect-attempt", { roomId, userId }),

    on: <T = unknown>(event: string, handler: (data: T) => void) =>
      globalSocket?.on(event, handler),
    off: (event: string, handler?: any) => globalSocket?.off(event, handler),
  };
}
