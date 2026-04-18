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
  toggleMic: () => void;
  toggleCamera: () => void;
  startScreenShare: () => void;
  stopScreenShare: () => void;
  leave: () => void;
}

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

  const refreshParticipants = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    const all = call.participants();
    const mapped = Object.values(all).map(mapParticipant);
    setParticipants(mapped);

    const local = all.local;
    if (local) {
      setLocalSessionId(local.session_id);
      setIsMicOn(local.audio ?? false);
      setIsCameraOn(local.video ?? false);
      setIsScreenSharing(local.screen ?? false);
    }
  }, []);

  useEffect(() => {
    if (!roomUrl || !token) return;

    const call = DailyIframe.createCallObject({
      audioSource: true,
      videoSource: true,
    });
    callRef.current = call;

    const handleJoined = () => {
      setIsJoined(true);
      setError(null);
      refreshParticipants();
    };

    const handleLeft = () => {
      setIsJoined(false);
      setParticipants([]);
      setLocalSessionId(null);
    };

    const handleParticipantJoined = (_evt?: DailyEventObjectParticipant) => {
      refreshParticipants();
    };

    const handleParticipantUpdated = (_evt?: DailyEventObjectParticipant) => {
      refreshParticipants();
    };

    const handleParticipantLeft = (_evt?: unknown) => {
      refreshParticipants();
    };

    const handleActiveSpeaker = (evt?: DailyEventObjectActiveSpeakerChange) => {
      if (evt?.activeSpeaker?.peerId) {
        setActiveSpeakerId(evt.activeSpeaker.peerId);
      }
    };

    const handleError = (evt?: { errorMsg?: string }) => {
      // Daily emits this when host closes room; treat as expected end-state.
      if (isMeetingEndedMessage(evt?.errorMsg)) {
        setError(null);
        return;
      }
      setError(evt?.errorMsg ?? "Unknown error");
    };

    call.on("joined-meeting", handleJoined);
    call.on("left-meeting", handleLeft);
    call.on("participant-joined", handleParticipantJoined);
    call.on("participant-updated", handleParticipantUpdated);
    call.on("participant-left", handleParticipantLeft);
    call.on("active-speaker-change", handleActiveSpeaker);
    call.on("error", handleError);

    call
      .join({ url: roomUrl, token })
      .then(() => {
        call.updateInputSettings({
          audio: { processor: { type: "noise-cancellation" as const } },
        }).catch(() => {
          // noise cancellation not supported in all browsers
        });
      })
      .catch((err: Error) => {
        if (isMeetingEndedMessage(err.message)) {
          setError(null);
          return;
        }
        setError(err.message);
      });

    return () => {
      call.off("joined-meeting", handleJoined);
      call.off("left-meeting", handleLeft);
      call.off("participant-joined", handleParticipantJoined);
      call.off("participant-updated", handleParticipantUpdated);
      call.off("participant-left", handleParticipantLeft);
      call.off("active-speaker-change", handleActiveSpeaker);
      call.off("error", handleError);
      call.destroy();
      callRef.current = null;
    };
  }, [roomUrl, token, refreshParticipants]);

  const toggleMic = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    call.setLocalAudio(!isMicOn);
    setIsMicOn(!isMicOn);
  }, [isMicOn]);

  const toggleCamera = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    call.setLocalVideo(!isCameraOn);
    setIsCameraOn(!isCameraOn);
  }, [isCameraOn]);

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
        const message =
          err instanceof Error ? err.message : typeof err === "string" ? err : null;
        if (!isMeetingEndedMessage(message)) {
          setError(message ?? "Unknown error");
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
    toggleMic,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    leave,
  };
}
