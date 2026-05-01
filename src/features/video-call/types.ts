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

export type VideoCallSignalMessage =
  | ({ type: "ready_for_peer" } & VideoCallMatchPreferences)
  | { type: "initiateOffer" }
  | { type: "waitForOffer" }
  | { type: "offer"; offer: RTCSessionDescriptionInit }
  | { type: "answer"; answer: RTCSessionDescriptionInit }
  | { type: "ice"; candidate: RTCIceCandidateInit | null }
  | { type: "media_status"; kind: "audio" | "video"; enabled: boolean }
  | { type: "leave"; reason?: string };

export interface RemoteMediaStatus {
  audio: boolean;
  video: boolean;
}
