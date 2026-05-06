export type VideoCallStatus =
  | "idle"
  | "connecting"
  | "searching"
  | "matched"
  | "calling"
  | "connected"
  | "reconnecting"
  | "closed"
  | "error";

export type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export type VideoCallMatchMode = "same_level" | "over_level";

export interface VideoCallMatchPreferences {
  level: JLPTLevel;
  matchMode: VideoCallMatchMode;
}

export type ChatMessageItem = {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
  isLocal: boolean;
  isViolation?: boolean;
  status?: "sending" | "sent" | "failed";
};

export type VideoCallChatMessage = {
  type: "chat_message";
  messageId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
  isViolation?: boolean;
};

export type VideoCallSignalMessage =
  | ({ type: "ready_for_peer" } & VideoCallMatchPreferences)
  | { type: "initiateOffer" }
  | { type: "waitForOffer" }
  | { type: "offer"; offer: RTCSessionDescriptionInit }
  | { type: "answer"; answer: RTCSessionDescriptionInit }
  | { type: "ice"; candidate: RTCIceCandidateInit | null }
  | { type: "media_status"; kind: "audio" | "video"; enabled: boolean }
  | { type: "leave"; reason?: string }
  | VideoCallChatMessage;

export interface RemoteMediaStatus {
  audio: boolean;
  video: boolean;
}
