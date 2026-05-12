"use client";

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ControlBarProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
  isTeacher?: boolean;
  isMicLoading?: boolean;
  isCameraLoading?: boolean;
  mediaError?: string | null;
  audioLevel?: number;
}

export function ControlBar({
  isMicOn,
  isCameraOn,
  isScreenSharing,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onEndCall,
  isTeacher = false,
  isMicLoading = false,
  isCameraLoading = false,
  mediaError,
  audioLevel = 0,
}: ControlBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 py-4 px-6 bg-[#0f1117]/80 backdrop-blur-md border-t border-white/[0.08]">
      <ControlButton
        active={isMicOn}
        onClick={onToggleMic}
        activeIcon={<Mic className="h-5 w-5" />}
        inactiveIcon={<MicOff className="h-5 w-5" />}
        tooltip={isMicOn ? "Turn mic off" : "Turn mic on"}
        loading={isMicLoading}
        level={isMicOn ? audioLevel : 0}
      />

      <ControlButton
        active={isCameraOn}
        onClick={onToggleCamera}
        activeIcon={<Video className="h-5 w-5" />}
        inactiveIcon={<VideoOff className="h-5 w-5" />}
        tooltip={isCameraOn ? "Turn camera off" : "Turn camera on"}
        loading={isCameraLoading}
      />

      <ControlButton
        active={!isScreenSharing}
        onClick={onToggleScreenShare}
        activeIcon={<Monitor className="h-5 w-5" />}
        inactiveIcon={<MonitorOff className="h-5 w-5" />}
        tooltip={isScreenSharing ? "Stop sharing" : "Share screen"}
        highlight={isScreenSharing}
      />

      <div className="w-px h-8 bg-white/10 mx-2" />

      {mediaError && (
        <div
          className="flex max-w-[260px] items-center gap-2 rounded-md border border-[#FFB84D]/30 bg-[#FFB84D]/10 px-3 py-2 text-xs text-[#FFD18A]"
          title={mediaError}
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="truncate">{mediaError}</span>
        </div>
      )}

      <button
        onClick={onEndCall}
        className="h-12 px-8 rounded-full bg-[#FF6B6B] hover:bg-[#ff5252] text-white font-semibold flex items-center gap-2 transition-all shadow-[0_4px_20px_rgba(255,107,107,0.3)]"
      >
        <PhoneOff className="h-5 w-5" />
        {isTeacher ? "End" : "Leave"}
      </button>
    </div>
  );
}

interface ControlButtonProps {
  active: boolean;
  onClick: () => void;
  activeIcon: React.ReactNode;
  inactiveIcon: React.ReactNode;
  tooltip: string;
  highlight?: boolean;
  loading?: boolean;
  level?: number;
}

function ControlButton({
  active,
  onClick,
  activeIcon,
  inactiveIcon,
  tooltip,
  highlight,
  loading = false,
  level = 0,
}: ControlButtonProps) {
  const normalizedLevel = Math.max(0, Math.min(level, 1));

  return (
    <button
      onClick={onClick}
      title={tooltip}
      disabled={loading}
      style={
        normalizedLevel > 0.02
          ? {
              boxShadow: `0 0 0 ${Math.round(
                2 + normalizedLevel * 8
              )}px rgba(100, 210, 255, ${0.08 + normalizedLevel * 0.18})`,
            }
          : undefined
      }
      className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center transition-all border",
        active
          ? "bg-[#252838] border-white/10 text-[#F0F0F0] hover:bg-[#2f3347]"
          : "bg-[#FF6B6B] border-[#FF6B6B] text-white hover:bg-[#ff5252]",
        highlight && "bg-[#6C63FF] border-[#6C63FF] hover:bg-[#5a52e0]",
        loading && "cursor-wait opacity-80"
      )}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : active ? (
        activeIcon
      ) : (
        inactiveIcon
      )}
    </button>
  );
}
