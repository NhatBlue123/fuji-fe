"use client";

import { useEffect, useCallback } from "react";
import { useSignaling } from "./useSignaling";

export interface BookingRoomJoined {
  roomId: string;
  role: "TEACHER" | "STUDENT";
  peerName: string;
  peerAvatarUrl: string | null;
  subject: string;
  remainingSeconds: number;
  isInitiator: boolean;
  peerOnline: boolean;
}

export interface BookingRoomExpired {
  roomId: string;
  message: string;
}

export interface BookingError {
  code: string;
  message: string;
}

export interface BookingSignalingHook {
  joinBookingRoom: (bookingId: number, displayName: string, avatarUrl?: string) => void;
  leaveBookingRoom: (roomId: string) => void;
  endBookingSession: (roomId: string) => void;
  sendOffer: (roomId: string, sdp: string) => void;
  sendAnswer: (roomId: string, sdp: string) => void;
  sendIceCandidate: (roomId: string, candidate: RTCIceCandidate) => void;
  sendChatMessage: (
    roomId: string,
    senderId: string,
    senderName: string,
    message: string,
    messageId: string,
  ) => void;
  reconnectAttempt: (roomId: string, userId: string) => void;
  on: <T = unknown>(event: string, handler: (data: T) => void) => void;
  off: (event: string) => void;
  socket: ReturnType<typeof useSignaling>["socket"];
}

export function useBookingSignaling(): BookingSignalingHook {
  const signaling = useSignaling();

  const emit = useCallback(
    (event: string, data?: unknown) => {
      if (signaling.socket?.connected) {
        signaling.socket.emit(event, data);
      } else {
        console.error(`[BookingSignaling] emit FAILED — not connected! event="${event}"`);
      }
    },
    [signaling.socket],
  );

  return {
    socket: signaling.socket,

    joinBookingRoom: (bookingId, displayName, avatarUrl) =>
      emit("join-booking-room", { bookingId, displayName, avatarUrl }),

    leaveBookingRoom: (roomId) => emit("leave-booking-room", { roomId }),

    endBookingSession: (roomId) => emit("end-booking-session", { roomId }),

    sendOffer: (roomId, sdp) => emit("offer", { roomId, sdp, type: "offer" }),
    sendAnswer: (roomId, sdp) => emit("answer", { roomId, sdp, type: "answer" }),
    sendIceCandidate: (roomId, candidate) =>
      emit("ice-candidate", {
        roomId,
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
      }),
    sendChatMessage: (roomId, senderId, senderName, message, messageId) =>
      emit("send-message", { roomId, senderId, senderName, message, messageId }),

    reconnectAttempt: (roomId, userId) =>
      emit("reconnect-attempt", { roomId, userId }),

    on: <T = unknown>(event: string, handler: (data: T) => void) => {
      signaling.socket?.on(event, handler);
    },
    off: (event: string) => signaling.socket?.off(event),
  };
}
