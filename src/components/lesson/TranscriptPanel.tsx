"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Loader2, Radio, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LessonTranscriptItem } from "@/hooks/useLessonTranscript";
import type { VoiceTranscriptStatus } from "@/hooks/useVoiceTranscript";

interface TranscriptPanelProps {
  transcripts: LessonTranscriptItem[];
  isLoading?: boolean;
  error?: string | null;
  voiceStatus?: VoiceTranscriptStatus;
  voiceError?: string | null;
  partialText?: string;
  currentUserName: string;
  currentUserRole: "TEACHER" | "STUDENT";
  enabled: boolean;
}

function formatElapsed(ms?: number | null): string {
  if (ms == null || !Number.isFinite(ms)) return "";
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatTranscriptTime(item: LessonTranscriptItem): string {
  if (item.createdAt) {
    const date = new Date(item.createdAt);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }
  return formatElapsed(item.startTimeMs);
}

function roleLabel(role?: string): string {
  if (role === "TEACHER") return "Giảng viên";
  if (role === "STUDENT") return "Học viên";
  return "Người dùng";
}

function statusLabel(status?: VoiceTranscriptStatus, enabled = true): string {
  if (!enabled) return "Đang tắt";
  if (status === "active") return "Đang nghe";
  if (status === "connecting") return "Đang kết nối";
  if (status === "reconnecting") return "Đang nối lại";
  if (status === "error") return "Lỗi";
  return "Chờ mic";
}

function statusClass(status?: VoiceTranscriptStatus, enabled = true): string {
  if (!enabled) return "border-white/10 bg-white/[0.04] text-[#8B8FA8]";
  if (status === "active") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  if (status === "error") return "border-[#FF6B6B]/30 bg-[#FF6B6B]/10 text-[#FF9B9B]";
  if (status === "connecting" || status === "reconnecting") {
    return "border-[#6C63FF]/30 bg-[#6C63FF]/10 text-[#B9B4FF]";
  }
  return "border-white/10 bg-white/[0.04] text-[#8B8FA8]";
}

export function TranscriptPanel({
  transcripts,
  isLoading = false,
  error,
  voiceStatus,
  voiceError,
  partialText = "",
  currentUserName,
  currentUserRole,
  enabled,
}: TranscriptPanelProps) {
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  const filteredTranscripts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return transcripts;

    return transcripts.filter((item) => {
      const speaker = item.speakerName || roleLabel(item.speakerRole);
      return `${speaker} ${item.content}`.toLowerCase().includes(needle);
    });
  }, [query, transcripts]);

  useEffect(() => {
    const el = listRef.current;
    if (!el || query.trim()) return;
    el.scrollTop = el.scrollHeight;
  }, [filteredTranscripts.length, partialText, query]);

  const handleSave = () => {
    if (transcripts.length === 0) return;

    const lines = transcripts.map((item) => {
      const speaker = item.speakerName || roleLabel(item.speakerRole);
      const time = formatTranscriptTime(item);
      return `${time ? `[${time}] ` : ""}${speaker}: ${item.content}`;
    });
    const blob = new Blob([lines.join("\n\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `lesson-transcript-${transcripts[0]?.sessionId ?? "room"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const hasStatusSpinner = voiceStatus === "connecting" || voiceStatus === "reconnecting" || isLoading;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#1e2130] text-[#F0F0F0]">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.08] px-4">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-[#6C63FF]" />
          <span className="text-sm font-semibold">Transcript</span>
        </div>
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px]", statusClass(voiceStatus, enabled))}>
          {hasStatusSpinner ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
          {statusLabel(voiceStatus, enabled)}
        </span>
      </div>

      <div className="shrink-0 border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#171a24] px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-[#8B8FA8]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search transcript"
            className="min-w-0 flex-1 bg-transparent text-sm text-[#F0F0F0] outline-none placeholder:text-[#8B8FA8]"
          />
        </div>
        {(error || voiceError) && (
          <p className="mt-2 text-xs text-[#FF9B9B]">{error || voiceError}</p>
        )}
      </div>

      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
        {filteredTranscripts.length === 0 && !partialText.trim() ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <p className="text-sm font-medium text-[#F0F0F0]">
              {enabled ? "Chưa có transcript lời nói" : "Transcript đang tắt"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#8B8FA8]">
              {enabled
                ? "Bật mic và nói vài câu, nội dung sẽ hiện ở đây sau từng lượt nói."
                : "Bật AI Summary trong cài đặt để lấy speech-to-text realtime."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTranscripts.map((item) => {
              const speaker = item.speakerName || roleLabel(item.speakerRole);
              return (
                <div key={transcriptKeyForRender(item)} className="rounded-xl bg-[#171a24] px-3 py-2.5">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-[#D8D9E8]">{speaker}</span>
                    <span className="shrink-0 text-[11px] text-[#8B8FA8]">{formatTranscriptTime(item)}</span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#F0F0F0]">{item.content}</p>
                </div>
              );
            })}

            {partialText.trim() && (
              <div className="rounded-xl border border-[#6C63FF]/30 bg-[#6C63FF]/10 px-3 py-2.5">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold text-[#D8D9E8]">
                    {currentUserName || roleLabel(currentUserRole)}
                  </span>
                  <span className="text-[11px] text-[#B9B4FF]">Đang nói</span>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#F0F0F0]">{partialText}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-white/[0.08] px-4 py-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={transcripts.length === 0}
          className={cn(
            "mx-auto flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
            transcripts.length > 0
              ? "border-white/15 bg-white/[0.04] text-[#F0F0F0] hover:bg-white/[0.08]"
              : "cursor-not-allowed border-white/10 text-[#8B8FA8]/50"
          )}
        >
          <Download className="h-3.5 w-3.5" />
          Save transcript
        </button>
      </div>
    </div>
  );
}

function transcriptKeyForRender(item: LessonTranscriptItem): string {
  if (item.id) return `transcript-${item.id}`;
  return `${item.sessionId}-${item.speakerId ?? "speaker"}-${item.startTimeMs ?? "time"}-${item.content}`;
}
