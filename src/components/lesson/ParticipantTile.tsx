"use client";

import { useEffect, useRef } from "react";
import { VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Participant } from "@/hooks/useDailyRoom";

interface ParticipantTileProps {
  participant: Participant;
  isActiveSpeaker: boolean;
  isMini?: boolean;
  label?: string;
}

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ParticipantTile({
  participant,
  isActiveSpeaker,
  isMini = false,
  label,
}: ParticipantTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (participant.video && participant.videoTrack) {
      el.srcObject = new MediaStream([participant.videoTrack]);
    } else {
      el.srcObject = null;
    }

    return () => {
      el.srcObject = null;
    };
  }, [participant.video, participant.videoTrack]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    if (!participant.local && participant.audioTrack) {
      el.srcObject = new MediaStream([participant.audioTrack]);
      el.muted = false;
      el.volume = 1;
      void el.play().catch(() => {
        // Browser autoplay policy may require a user gesture before remote audio can start.
      });
    } else {
      el.pause();
      el.srcObject = null;
    }

    return () => {
      el.pause();
      el.srcObject = null;
    };
  }, [participant.local, participant.audioTrack]);

  const displayName = label || participant.userName || "Unknown";
  const showVideo = participant.video && participant.videoTrack;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[#1a1d27] border transition-all duration-300",
        isMini
          ? "w-40 aspect-video rounded-2xl border-white/20 shadow-xl"
          : "w-full h-full rounded-[20px]",
        isActiveSpeaker
          ? "border-[#4ECDC4] shadow-[0_0_20px_rgba(78,205,196,0.3)]"
          : "border-white/[0.08]"
      )}
    >
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.local}
          className={cn(
            "w-full h-full object-cover",
            participant.local && "scale-x-[-1]"
          )}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#252838]">
          <div
            className={cn(
              "flex items-center justify-center rounded-full bg-[#6C63FF]/20 text-[#6C63FF] font-bold",
              isMini ? "w-10 h-10 text-sm" : "w-20 h-20 text-2xl"
            )}
          >
            {getInitials(displayName)}
          </div>
        </div>
      )}

      {!participant.local && (
        <audio
          ref={audioRef}
          autoPlay
          muted={false}
          className="hidden"
        />
      )}

      {/* Name badge */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        <span className="text-xs font-medium text-[#F0F0F0] bg-[#0f1117]/70 backdrop-blur-sm px-2.5 py-1 rounded-full">
          {displayName}
        </span>

        {!participant.audio && (
          <span className="w-5 h-5 rounded-full bg-[#FF6B6B]/90 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          </span>
        )}
      </div>

      {/* Camera off overlay for mini tile */}
      {isMini && !showVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1d27]/90">
          <VideoOff className="h-5 w-5 text-[#8B8FA8]" />
        </div>
      )}

      {/* Speaking indicator ring */}
      {isActiveSpeaker && (
        <div className="absolute inset-0 rounded-[inherit] border-2 border-[#4ECDC4] animate-pulse pointer-events-none" />
      )}
    </div>
  );
}
