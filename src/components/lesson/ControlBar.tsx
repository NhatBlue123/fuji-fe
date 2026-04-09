"use client";

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Settings,
  Circle,
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
  /** Giáo viên: bật/tắt ghi hình cloud */
  isTeacher?: boolean;
  isRecording?: boolean;
  onToggleRecording?: () => void;
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
  isRecording = false,
  onToggleRecording,
}: ControlBarProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-4 px-6 bg-[#0f1117]/80 backdrop-blur-md border-t border-white/[0.08]">
      {/* Mic */}
      <ControlButton
        active={isMicOn}
        onClick={onToggleMic}
        activeIcon={<Mic className="h-5 w-5" />}
        inactiveIcon={<MicOff className="h-5 w-5" />}
        tooltip={isMicOn ? "Tắt mic" : "Bật mic"}
      />

      {/* Camera */}
      <ControlButton
        active={isCameraOn}
        onClick={onToggleCamera}
        activeIcon={<Video className="h-5 w-5" />}
        inactiveIcon={<VideoOff className="h-5 w-5" />}
        tooltip={isCameraOn ? "Tắt camera" : "Bật camera"}
      />

      {/* Screen Share */}
      <ControlButton
        active={!isScreenSharing}
        onClick={onToggleScreenShare}
        activeIcon={<Monitor className="h-5 w-5" />}
        inactiveIcon={<MonitorOff className="h-5 w-5" />}
        tooltip={isScreenSharing ? "Dừng chia sẻ" : "Chia sẻ màn hình"}
        highlight={isScreenSharing}
      />

      <div className="w-px h-8 bg-white/10 mx-2" />

      {isTeacher && onToggleRecording && (
        <button
          type="button"
          onClick={onToggleRecording}
          title={isRecording ? "Dừng ghi hình" : "Bắt đầu ghi hình"}
          className={cn(
            "h-12 px-4 rounded-full flex items-center gap-2 text-xs font-semibold border transition-all",
            isRecording
              ? "bg-[#FF2D2D]/25 border-[#FF2D2D] text-[#ffb4b4] animate-pulse"
              : "bg-[#252838] border-white/10 text-[#F0F0F0] hover:bg-[#2f3347]"
          )}
        >
          <Circle className="h-3 w-3 fill-current" />
          {isRecording ? "Dừng REC" : "Ghi hình"}
        </button>
      )}

      <div className="w-px h-8 bg-white/10 mx-2" />

      {/* Settings placeholder for future phases */}
      <button
        className="w-12 h-12 rounded-full flex items-center justify-center text-[#8B8FA8] hover:text-[#F0F0F0] hover:bg-white/[0.06] transition-all"
        title="Cài đặt"
      >
        <Settings className="h-5 w-5" />
      </button>

      <div className="w-px h-8 bg-white/10 mx-2" />

      {/* End Call */}
      <button
        onClick={onEndCall}
        className="h-12 px-8 rounded-full bg-[#FF6B6B] hover:bg-[#ff5252] text-white font-semibold flex items-center gap-2 transition-all shadow-[0_4px_20px_rgba(255,107,107,0.3)]"
      >
        <PhoneOff className="h-5 w-5" />
        Kết thúc
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
}

function ControlButton({
  active,
  onClick,
  activeIcon,
  inactiveIcon,
  tooltip,
  highlight,
}: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center transition-all border",
        active
          ? "bg-[#252838] border-white/10 text-[#F0F0F0] hover:bg-[#2f3347]"
          : "bg-[#FF6B6B] border-[#FF6B6B] text-white hover:bg-[#ff5252]",
        highlight && "bg-[#6C63FF] border-[#6C63FF] hover:bg-[#5a52e0]"
      )}
    >
      {active ? activeIcon : inactiveIcon}
    </button>
  );
}
