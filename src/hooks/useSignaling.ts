/**
 * useSignaling — manages Socket.IO connection to the signaling server
 * and exposes typed emit helpers + event subscription utilities.
 */
import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getSignalingUrl } from "@/lib/video-call-urls";

export interface SignalingHook {
  socket: Socket | null;
  joinQueue: (payload: JoinQueuePayload) => void;
  leaveQueue: () => void;
  sendOffer: (roomId: string, sdp: string) => void;
  sendAnswer: (roomId: string, sdp: string) => void;
  sendIceCandidate: (roomId: string, candidate: RTCIceCandidate) => void;
  sendChatMessage: (
    roomId: string,
    senderId: string,
    senderName: string,
    message: string,
    messageId: string,
    isViolation?: boolean
  ) => void;
  sendMessageDelivered: (roomId: string, messageIds: string[]) => void;
  sendMessageRead: (roomId: string, messageIds: string[]) => void;
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
let lastTimeoutWarnAt = 0;

if (typeof window !== "undefined") {
  globalSocket = io(getSignalingUrl() + "/video-call", {
    transports: ["websocket", "polling"],
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 8000,
    timeout: 12000,
    autoConnect: false,
    query: {},
  });

  globalSocket.on("connect", () => {
    console.log("[Signaling] Connected:", globalSocket?.id, "| server:", getSignalingUrl());
  });

  globalSocket.on("connect_error", (err) => {
    const msg = String(err?.message || "");
    const isTimeout = msg.toLowerCase().includes("timeout");
    if (isTimeout) {
      const now = Date.now();
      // Prevent noisy repeated timeout logs in dev console.
      if (now - lastTimeoutWarnAt > 15000) {
        lastTimeoutWarnAt = now;
        console.warn("[Signaling] Server timeout. Video-call socket is temporarily unavailable.");
      }
      return;
    }
    console.error("[Signaling] Connection error:", msg);
  });
}

function getUserIdFromStorage(): string | null {
  try {
    const saved = localStorage.getItem("auth_state");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed?.user?.id ? String(parsed.user.id) : null;
    }
  } catch { /* ignore */ }
  return null;
}

export function useSignaling(): SignalingHook {
  useEffect(() => {
    activeCount++;
    if (globalSocket && !globalSocket.connected) {
      const userId = getUserIdFromStorage();
      if (userId) {
        (globalSocket.io.opts.query as Record<string, string>).userId = userId;
      }
      globalSocket.connect();
    }

    return () => {
      activeCount--;
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
    sendChatMessage: (
      roomId,
      senderId,
      senderName,
      message,
      messageId,
      isViolation
    ) =>
      emit("send-message", {
        roomId,
        senderId,
        senderName,
        message,
        messageId,
        isViolation,
      }),
    sendMessageDelivered: (roomId, messageIds) =>
      emit("message_delivered", { roomId, messageIds }),
    sendMessageRead: (roomId, messageIds) =>
      emit("message_read", { roomId, messageIds }),
    leaveRoom: (roomId) => emit("leave-room", { roomId }),
    reconnectAttempt: (roomId, userId) =>
      emit("reconnect-attempt", { roomId, userId }),

    on: <T = unknown>(event: string, handler: (data: T) => void) =>
      globalSocket?.on(event, handler),
    off: (event: string, handler?: any) => globalSocket?.off(event, handler),
  };
}
