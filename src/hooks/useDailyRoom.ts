"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import DailyIframe, {
  DailyCall,
  DailyParticipant as DailySDKParticipant,
  DailyEventObjectActiveSpeakerChange,
  DailyEventObjectCameraError,
  DailyEventObjectLocalAudioLevel,
  DailyEventObjectNonFatalError,
  DailyFactoryOptions,
} from "@daily-co/daily-js";

export interface Participant {
  sessionId: string;
  userId: string;
  userName: string;
  local: boolean;
  video: boolean;
  audio: boolean;
  screen: boolean;
  videoTrack: MediaStreamTrack | null;
  audioTrack: MediaStreamTrack | null;
  screenVideoTrack: MediaStreamTrack | null;
}

interface UseDailyRoomReturn {
  participants: Participant[];
  activeSpeakerId: string | null;
  localSessionId: string | null;
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  isJoined: boolean;
  error: string | null;
  mediaError: string | null;
  isMicLoading: boolean;
  isCameraLoading: boolean;
  localAudioLevel: number;
  toggleMic: () => void;
  toggleCamera: () => void;
  startScreenShare: () => void;
  stopScreenShare: () => void;
  leave: () => void;
}

const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1280, max: 1280 },
  height: { ideal: 720, max: 720 },
  frameRate: { ideal: 24, max: 30 },
  facingMode: "user",
};

function isMeetingEndedMessage(message?: string | null): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return lower.includes("meeting has ended") || lower.includes("meeting ended");
}

function mapParticipant(p: DailySDKParticipant): Participant {
  const tracks = p.tracks as
    | Record<string, { persistentTrack?: MediaStreamTrack | null; track?: MediaStreamTrack | null }>
    | undefined;

  return {
    sessionId: p.session_id,
    userId: p.user_id || "",
    userName: p.user_name || "",
    local: p.local,
    video: p.video ?? false,
    audio: p.audio ?? false,
    screen: p.screen ?? false,
    videoTrack: tracks?.video?.persistentTrack ?? tracks?.video?.track ?? null,
    audioTrack: tracks?.audio?.persistentTrack ?? tracks?.audio?.track ?? null,
    screenVideoTrack:
      tracks?.screenVideo?.persistentTrack ?? tracks?.screenVideo?.track ?? null,
  };
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  // Handle nested objects from Daily.co (e.g. { errorMsg: "..." } or { error: { msg: "..." } })
  if (err && typeof err === "object") {
    const obj = err as Record<string, unknown>;
    if (typeof obj.errorMsg === "string") return obj.errorMsg;
    if (
      obj.errorMsg &&
      typeof obj.errorMsg === "object" &&
      typeof (obj.errorMsg as Record<string, unknown>).errorMsg === "string"
    ) {
      return String((obj.errorMsg as Record<string, unknown>).errorMsg);
    }
    if (typeof obj.msg === "string") return obj.msg;
    if (obj.error && typeof (obj.error as Record<string, unknown>).msg === "string") {
      return String((obj.error as Record<string, unknown>).msg);
    }
  }
  return fallback;
}

function mediaSupportWarning(): string | null {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return "Browser does not support camera or microphone access.";
  }

  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "Camera requires HTTPS in production, or localhost while testing.";
  }

  return null;
}

function localAudioState(call: DailyCall): boolean {
  const direct = (call as unknown as { localAudio?: () => boolean }).localAudio?.();
  if (typeof direct === "boolean") return direct;
  return Boolean(call.participants().local?.audio);
}

function localVideoState(call: DailyCall): boolean {
  const direct = (call as unknown as { localVideo?: () => boolean }).localVideo?.();
  if (typeof direct === "boolean") return direct;
  return Boolean(call.participants().local?.video);
}

export function useDailyRoom(roomUrl: string | null, token: string | null): UseDailyRoomReturn {
  const callRef = useRef<DailyCall | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [localSessionId, setLocalSessionId] = useState<string | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isMicLoading, setIsMicLoading] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [localAudioLevel, setLocalAudioLevel] = useState(0);

  const refreshParticipants = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    const all = call.participants();
    const mapped = Object.values(all).map(mapParticipant);
    setParticipants(mapped);

    const local = all.local;
    if (local) {
      setLocalSessionId(local.session_id);
      setIsMicOn(localAudioState(call));
      setIsCameraOn(localVideoState(call));
      setIsScreenSharing(local.screen ?? false);
    }
  }, []);

  useEffect(() => {
    if (!roomUrl || !token) return;

    let destroyed = false;
    let call: DailyCall | null = null;

    const setup = async () => {
      const permissionWarning = mediaSupportWarning();
      if (destroyed) return;
      setMediaError(permissionWarning);

      const callOptions: DailyFactoryOptions = {
        audioSource: true,
        videoSource: true,
        inputSettings: {
          audio: {
            settings: AUDIO_CONSTRAINTS,
          },
          video: {
            settings: VIDEO_CONSTRAINTS,
          },
        },
      };
      call = DailyIframe.createCallObject(callOptions);
      callRef.current = call;

      const handleJoined = async () => {
        setIsJoined(true);
        setError(null);
        refreshParticipants();

        try {
          await Promise.resolve(call?.setLocalAudio(true));
          await Promise.resolve(call?.setLocalVideo(true));
        } catch (err) {
          setMediaError(errorMessage(err, "Unable to enable local media."));
        } finally {
          refreshParticipants();
        }
      };

      const handleLeft = () => {
        setIsJoined(false);
        setParticipants([]);
        setLocalSessionId(null);
        setLocalAudioLevel(0);
      };

      const handleParticipantChange = () => {
        refreshParticipants();
      };

      const handleActiveSpeaker = (evt?: DailyEventObjectActiveSpeakerChange) => {
        if (evt?.activeSpeaker?.peerId) {
          setActiveSpeakerId(evt.activeSpeaker.peerId);
        }
      };

      const handleError = (evt?: { errorMsg?: string }) => {
        if (isMeetingEndedMessage(evt?.errorMsg)) {
          setError(null);
          return;
        }
        const msg = errorMessage(evt, "Unknown Daily.co error");
        if (isMeetingEndedMessage(msg)) {
          setError(null);
          return;
        }
        setError(msg);
      };

      const handleMediaError = (
        evt?: DailyEventObjectCameraError | DailyEventObjectNonFatalError
      ) => {
        const msg = errorMessage(
          evt ?? {},
          "Camera or microphone failed."
        );
        setMediaError(msg);
        setIsCameraOn(localVideoState(call as DailyCall));
        setIsMicOn(localAudioState(call as DailyCall));
        refreshParticipants();
      };

      const handleTrackChanged = () => {
        refreshParticipants();
      };

      const handleAudioLevel = (evt?: DailyEventObjectLocalAudioLevel) => {
        setLocalAudioLevel(typeof evt?.audioLevel === "number" ? evt.audioLevel : 0);
      };

      const handleNonFatalError = (evt?: DailyEventObjectNonFatalError) => {
        if (
          evt?.type === "input-settings-error" ||
          evt?.type === "local-audio-level-observer-error"
        ) {
          handleMediaError(evt);
        }
      };

      call.on("joined-meeting", handleJoined);
      call.on("left-meeting", handleLeft);
      call.on("participant-joined", handleParticipantChange);
      call.on("participant-updated", handleParticipantChange);
      call.on("participant-left", handleParticipantChange);
      call.on("active-speaker-change", handleActiveSpeaker);
      call.on("error", handleError);
      call.on("camera-error", handleMediaError);
      call.on("nonfatal-error", handleNonFatalError);
      call.on("track-started", handleTrackChanged);
      call.on("track-stopped", handleTrackChanged);
      call.on("local-audio-level", handleAudioLevel);
      await Promise.resolve(call.startLocalAudioLevelObserver(500)).catch(() => undefined);

      call
        .join({ url: roomUrl, token })
        .catch((err: unknown) => {
          const msg = errorMessage(err, "Unknown Daily.co error");
          if (isMeetingEndedMessage(msg)) {
            setError(null);
            return;
          }
          setError(msg);
        });
    };

    void setup();

    return () => {
      destroyed = true;
      const activeCall = call ?? callRef.current;
      if (!activeCall) return;
      activeCall.stopLocalAudioLevelObserver();
      void Promise.resolve(activeCall.destroy()).catch(() => undefined);
      callRef.current = null;
      setLocalAudioLevel(0);
    };
  }, [roomUrl, token, refreshParticipants]);

  const toggleMic = useCallback(async () => {
    const call = callRef.current;
    if (!call || isMicLoading) return;
    setIsMicLoading(true);
    setMediaError(null);

    try {
      const next = !localAudioState(call);
      await Promise.resolve(call.setLocalAudio(next));
      refreshParticipants();
    } catch (err) {
      setMediaError(errorMessage(err, "Unable to toggle microphone."));
    } finally {
      setIsMicLoading(false);
    }
  }, [isMicLoading, refreshParticipants]);

  const toggleCamera = useCallback(async () => {
    const call = callRef.current;
    if (!call || isCameraLoading) return;
    setIsCameraLoading(true);
    setMediaError(null);

    try {
      const next = !localVideoState(call);
      await Promise.resolve(call.setLocalVideo(next));
      refreshParticipants();
    } catch (err) {
      setMediaError(errorMessage(err, "Unable to toggle camera."));
    } finally {
      setIsCameraLoading(false);
    }
  }, [isCameraLoading, refreshParticipants]);

  const startScreenShare = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    Promise.resolve(call.startScreenShare()).catch((err: unknown) => {
      setMediaError(errorMessage(err, "Unable to start screen sharing."));
      refreshParticipants();
    });
  }, [refreshParticipants]);

  const stopScreenShare = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    Promise.resolve(call.stopScreenShare()).catch((err: unknown) => {
      setMediaError(errorMessage(err, "Unable to stop screen sharing."));
      refreshParticipants();
    });
  }, [refreshParticipants]);

  const leave = useCallback(() => {
    callRef.current
      ?.leave()
      .catch((err: unknown) => {
        const message = errorMessage(err, "Unknown Daily.co error");
        if (!isMeetingEndedMessage(message)) {
          setError(message);
        }
      });
  }, []);

  return {
    participants,
    activeSpeakerId,
    localSessionId,
    isMicOn,
    isCameraOn,
    isScreenSharing,
    isJoined,
    error,
    mediaError,
    isMicLoading,
    isCameraLoading,
    localAudioLevel,
    toggleMic,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    leave,
  };
}
