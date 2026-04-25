"use client";

import { useMemo } from "react";
import { ParticipantTile } from "./ParticipantTile";
import type { Participant } from "@/hooks/useDailyRoom";

interface VideoGridProps {
  participants: Participant[];
  activeSpeakerId: string | null;
  localSessionId: string | null;
  screenShareParticipant?: Participant | null;
}

export function VideoGrid({
  participants,
  activeSpeakerId,
  localSessionId,
  screenShareParticipant,
}: VideoGridProps) {
  const { localParticipant, remoteParticipants } = useMemo(() => {
    const local = participants.find((p) => p.local);
    const remote = participants.filter((p) => !p.local);
    return { localParticipant: local, remoteParticipants: remote };
  }, [participants]);

  const mainParticipant = remoteParticipants[0] ?? localParticipant;
  const showScreenShare = screenShareParticipant && screenShareParticipant.screenVideoTrack;

  return (
    <div className="relative w-full h-full">
      {/* Screen share takes priority as main view */}
      {showScreenShare ? (
        <div className="w-full h-full flex flex-col gap-2">
          <div className="flex-1 relative rounded-[20px] overflow-hidden bg-[#1a1d27]">
            <ScreenShareView participant={screenShareParticipant} />
          </div>
        </div>
      ) : mainParticipant ? (
        <ParticipantTile
          participant={mainParticipant}
          isActiveSpeaker={activeSpeakerId === mainParticipant.sessionId}
          label={mainParticipant.local ? "You" : mainParticipant.userName}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#1a1d27] rounded-[20px]">
          <p className="text-[#8B8FA8] text-sm">Waiting for participant...</p>
        </div>
      )}

      {/* Local PiP (bottom-left) when remote is main */}
      {localParticipant && remoteParticipants.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10">
          <ParticipantTile
            participant={localParticipant}
            isActiveSpeaker={activeSpeakerId === localParticipant.sessionId}
            isMini
            label="You"
          />
        </div>
      )}
    </div>
  );
}

function ScreenShareView({ participant }: { participant: Participant }) {
  const videoRef = useMemo(() => {
    return { current: null as HTMLVideoElement | null };
  }, []);

  return (
    <video
      ref={(el) => {
        videoRef.current = el;
        if (el && participant.screenVideoTrack) {
          el.srcObject = new MediaStream([participant.screenVideoTrack]);
        }
      }}
      autoPlay
      playsInline
      className="w-full h-full object-contain bg-black"
    />
  );
}
