"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback, useRef } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonHeaderProps {
  subject: string | null;
  teacherName: string;
  studentName: string;
  remainingSeconds: number;
  isConnected: boolean;
  role: "TEACHER" | "STUDENT";
  /** Đang ghi hình (cloud recording) */
  isRecording?: boolean;
  /** Callback khi đồng hồ về 0 */
  onTimeUp?: () => void;
}

export function LessonHeader({
  subject,
  teacherName,
  studentName,
  remainingSeconds: initialSeconds,
  isConnected,
  role,
  isRecording = false,
  onTimeUp,
}: LessonHeaderProps) {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(initialSeconds);
  const hasNotifiedTimeUp = useRef(false);

  useEffect(() => {
    setRemaining(initialSeconds);
    hasNotifiedTimeUp.current = false;
  }, [initialSeconds]);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) {
          clearInterval(timer);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [remaining > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (remaining > 0 || hasNotifiedTimeUp.current) return;
    hasNotifiedTimeUp.current = true;
    onTimeUp?.();
  }, [remaining, onTimeUp]);

  const formatTime = useCallback((s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    }
    return `${m}:${String(sec).padStart(2, "0")}`;
  }, []);

  const peerName = role === "TEACHER" ? studentName : teacherName;

  return (
    <div className="shrink-0 flex items-center justify-between px-6 py-3 bg-[#0f1117] border-b border-white/[0.08]">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#6C63FF]" />
          <span className="text-[#F0F0F0] font-semibold text-sm">
            {subject || "Buổi học"}
          </span>
        </div>

        <span className="text-[#8B8FA8] text-xs">
          với {peerName}
        </span>

        {isConnected && (
          <span className="text-[10px] bg-[#4ECDC4] text-[#0f1117] font-semibold px-2 py-0.5 rounded-full">
            Đã kết nối
          </span>
        )}

        {isRecording && (
          <span
            className="text-[10px] font-bold text-white bg-[#FF2D2D] px-2 py-0.5 rounded-full animate-pulse"
            title={t('auto.lesson_header_1')}
          >
            ● REC
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-[#8B8FA8]" />
        <span
          className={cn(
            "font-mono text-sm font-semibold",
            remaining <= 60
              ? "text-[#FF4444] animate-pulse"
              : remaining <= 300
                ? "text-amber-400"
                : "text-[#F0F0F0]"
          )}
        >
          {formatTime(remaining)}
        </span>
      </div>
    </div>
  );
}
