"use client";

import { useTranslation } from "react-i18next";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Settings,
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
}: ControlBarProps) {
  const { t } = useTranslation();
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

      {/* Settings placeholder for future phases */}
      <button
        className="w-12 h-12 rounded-full flex items-center justify-center text-[#8B8FA8] hover:text-[#F0F0F0] hover:bg-white/[0.06] transition-all"
        title={t('auto.lesson_control_1')}
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
        {isTeacher ? "Kết thúc" : "Rời lớp"}
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
