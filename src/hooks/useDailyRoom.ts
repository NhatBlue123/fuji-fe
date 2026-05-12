"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import DailyIframe, {
  DailyCall,
  DailyEventObjectParticipant,
  DailyParticipant as DailySDKParticipant,
  DailyEventObjectActiveSpeakerChange,
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
  return {
    sessionId: p.session_id,
    userId: p.user_id || "",
    userName: p.user_name || "",
    local: p.local,
    video: p.video ?? false,
    audio: p.audio ?? false,
    screen: p.screen ?? false,
    videoTrack: p.tracks?.video?.persistentTrack ?? null,
    audioTrack: p.tracks?.audio?.persistentTrack ?? null,
    screenVideoTrack: p.tracks?.screenVideo?.persistentTrack ?? null,
  };
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  // Handle nested objects from Daily.co (e.g. { errorMsg: "..." } or { error: { msg: "..." } })
  if (err && typeof err === "object") {
    const obj = err as Record<string, unknown>;
    if (typeof obj.errorMsg === "string") return obj.errorMsg;
    if (typeof obj.msg === "string") return obj.msg;
    if (obj.error && typeof (obj.error as Record<string, unknown>).msg === "string") {
      return String((obj.error as Record<string, unknown>).msg);
    }
  }
  return fallback;
}

async function probeMediaPermissions(): Promise<string | null> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return "Browser does not support camera or microphone access.";
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: AUDIO_CONSTRAINTS,
      video: VIDEO_CONSTRAINTS,
    });
    stream.getTracks().forEach((track) => track.stop());
    return null;
  } catch (videoAndAudioError) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: AUDIO_CONSTRAINTS,
      });
      stream.getTracks().forEach((track) => track.stop());
      return "Camera is unavailable. Microphone permission is available.";
    } catch {
      return errorMessage(
        videoAndAudioError,
        "Camera or microphone permission was denied."
      );
    }
  }
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
      const permissionWarning = await probeMediaPermissions();
      if (destroyed) return;
      setMediaError(permissionWarning);

      call = DailyIframe.createCallObject({
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
      } as any);
      callRef.current = call;
      const daily = call as any;

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

      const handleParticipantChange = (_evt?: DailyEventObjectParticipant) => {
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

      const handleMediaError = (evt?: { errorMsg?: string; error?: { msg?: string } }) => {
        const msg = errorMessage(
          evt ?? {},
          "Camera or microphone failed."
        );
        setMediaError(msg);
        refreshParticipants();
      };

      const handleTrackChanged = () => {
        refreshParticipants();
      };

      const handleAudioLevel = (evt?: { audioLevel?: number }) => {
        setLocalAudioLevel(typeof evt?.audioLevel === "number" ? evt.audioLevel : 0);
      };

      call.on("joined-meeting", handleJoined);
      call.on("left-meeting", handleLeft);
      call.on("participant-joined", handleParticipantChange);
      call.on("participant-updated", handleParticipantChange);
      call.on("participant-left", handleParticipantChange);
      call.on("active-speaker-change", handleActiveSpeaker);
      call.on("error", handleError);
      daily.on("camera-error", handleMediaError);
      daily.on("input-settings-error", handleMediaError);
      daily.on("track-started", handleTrackChanged);
      daily.on("track-stopped", handleTrackChanged);
      daily.on("local-audio-level", handleAudioLevel);
      await Promise.resolve(daily.startLocalAudioLevelObserver?.(500)).catch(() => undefined);

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
      const daily = activeCall as any;
      daily.stopLocalAudioLevelObserver?.();
      activeCall.destroy();
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
    callRef.current?.startScreenShare();
  }, []);

  const stopScreenShare = useCallback(() => {
    callRef.current?.stopScreenShare();
  }, []);

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
