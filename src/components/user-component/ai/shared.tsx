"use client";

import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FuriganaData } from "@/types/voice";

/** Tách <think>...</think> ra khỏi phần nội dung chính */
export function parseResponse(raw: string): { think: string; content: string } {
  const m = raw.match(/<think>([\s\S]*?)<\/think>/i);
  const think = m ? m[1].trim() : "";
  const content = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  return { think, content };
}

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

export type SenseiMessage = {
  id: number;
  role: "ai" | "user";
  textJp?: string;
  textVn?: string;
  furigana?: FuriganaData;
  audioBase64?: string;
  audioFormat?: string;
  feedback?: "good" | "bad";
};

export type AssistantMessage = {
  id: number;
  role: "ai" | "user";
  textJp?: string;
  textVn?: string;
  think?: string;
  _streaming?: boolean;
};

export type PracticeMode = "sensei" | "assistant";

/* ------------------------------------------------------------------ */
/* Constants                                                            */
/* ------------------------------------------------------------------ */

export const LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;

export const TOPICS = [
  { value: "shopping", label: "Mua sắm (Shopping)" },
  { value: "interview", label: "Phỏng vấn xin việc" },
  { value: "restaurant", label: "Đặt món tại nhà hàng" },
  { value: "direction", label: "Hỏi đường" },
] as const;

export const ASSISTANT_CHIPS = [
  { emoji: "📚", text: "Giải thích ngữ pháp て-form" },
  { emoji: "🔤", text: "Cho ví dụ với から" },
  { emoji: "❓", text: "Sự khác nhau giữa は và が" },
  { emoji: "✍️", text: "Luyện viết Hiragana" },
];

/* ------------------------------------------------------------------ */
/* Shared sub-components                                                */
/* ------------------------------------------------------------------ */

/**
 * Furigana display with karaoke highlight.
 * `highlightIndex` = index of last highlighted segment (-1 = none, segments.length = all).
 */
export const FuriganaDisplay = memo(function FuriganaDisplay({
  furigana,
  highlightIndex,
}: {
  furigana: FuriganaData;
  highlightIndex: number;
}) {
  return (
    <div className="space-y-2">
      {/* Main line: kanji + furigana */}
      <p className="text-foreground text-base font-medium leading-[2.2] flex flex-wrap gap-x-1">
        {furigana.segments.map((seg, i) => {
          const active = i <= highlightIndex;
          return (
            <ruby
              key={i}
              className={`transition-colors duration-300 ${
                active
                  ? "text-secondary"
                  : highlightIndex >= 0
                    ? "text-muted-foreground/50"
                    : "text-foreground"
              }`}
            >
              {seg.kanji}
              {seg.hiragana && seg.hiragana !== seg.kanji && (
                <rt className="text-[0.6em] font-normal text-muted-foreground">
                  {seg.hiragana}
                </rt>
              )}
            </ruby>
          );
        })}
      </p>
      {/* Romaji line */}
      <p className="text-xs text-muted-foreground/60 leading-relaxed flex flex-wrap gap-x-2">
        {furigana.segments.map((seg, i) => (
          <span
            key={i}
            className={`transition-colors duration-300 ${
              i <= highlightIndex ? "text-secondary/70" : ""
            }`}
          >
            {seg.romaji}
          </span>
        ))}
      </p>
      {/* Vietnamese translation */}
      {furigana.translation && (
        <p className="text-xs text-muted-foreground italic">
          🇻🇳 {furigana.translation}
        </p>
      )}
    </div>
  );
});

/** Three bouncing dots with label */
export const TypingIndicator = memo(function TypingIndicator({
  label,
}: {
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 ml-14 opacity-60">
      <div className="flex gap-1">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1.5 bg-muted-foreground rounded-full animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
});

/** Khối think — có thể mở/đóng */
export const ThinkBlock = memo(function ThinkBlock({
  content,
}: {
  content: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="material-symbols-outlined text-sm">
          {open ? "expand_less" : "expand_more"}
        </span>
        💭 Đã suy nghĩ xong
      </button>
      {open && (
        <div className="mt-1 text-xs text-muted-foreground bg-muted/40 border border-border/50 rounded-lg p-3 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
      )}
    </div>
  );
});

/** Shared input area */
export const ChatInputArea = memo(function ChatInputArea({
  input,
  onInputChange,
  onSend,
  chips,
  placeholder,
  showEmoji = false,
  showMic = false,
}: {
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  chips: { emoji: string; text: string }[];
  placeholder: string;
  showEmoji?: boolean;
  showMic?: boolean;
}) {
  return (
    <div className="p-6 border-t border-border bg-background/80 backdrop-blur-sm shrink-0">
      {chips.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {chips.map((chip) => (
            <Button
              key={chip.text}
              onClick={() => onInputChange(chip.text)}
              className="whitespace-nowrap px-4 py-2 rounded-full bg-muted border border-border text-xs font-medium text-foreground hover:bg-card hover:border-primary/40 hover:text-primary transition-all"
            >
              {chip.emoji} {chip.text}
            </Button>
          ))}
        </div>
      )}
      <div className="relative flex items-center gap-3">
        <div className="flex-1 relative">
          <Input
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            className="w-full bg-card border border-border text-foreground rounded-xl py-3.5 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-muted-foreground shadow-sm transition-all"
            placeholder={placeholder}
            type="text"
          />
          {showEmoji && (
            <Button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <span className="material-symbols-outlined">
                sentiment_satisfied
              </span>
            </Button>
          )}
        </div>
        {showMic && (
          <Button className="p-3.5 rounded-xl bg-muted border border-border text-foreground hover:bg-card transition-all flex items-center justify-center group shadow-sm">
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
              mic
            </span>
          </Button>
        )}
        <Button
          onClick={onSend}
          disabled={!input.trim()}
          className="p-3.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center shadow-lg shadow-primary/20 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined group-hover:translate-x-0.5 transition-transform">
            send
          </span>
        </Button>
      </div>
    </div>
  );
});

/** Shared right sidebar */
export interface SenseiFeedback {
  score?: number;
  comment?: string;
  strengths?: string[];
  improvements?: string[];
}

interface RightSidebarTopic {
  id: number;
  title: string;
}

interface RightSidebarScenario {
  id: number;
  level: string;
  title: string;
  situation: string;
}

export const RightSidebar = memo(function RightSidebar({
  settingsTitle,
  topics,
  selectedTopicId,
  onTopicChange,
  scenarios,
  selectedScenarioId,
  onScenarioChange,
  disabled = false,
  feedback,
}: {
  settingsTitle: string;
  topics: RightSidebarTopic[];
  selectedTopicId: number | null;
  onTopicChange: (v: string) => void;
  scenarios: RightSidebarScenario[];
  selectedScenarioId: number | null;
  onScenarioChange: (v: string) => void;
  disabled?: boolean;
  feedback?: SenseiFeedback | null;
}) {
  return (
    <aside className="w-80 border-l border-border bg-card/50 overflow-y-auto hidden lg:block shrink-0 flex flex-col">
      {/* Settings */}
      <div className="p-6 border-b border-border">
        <h3 className="text-sm font-bold text-foreground tracking-wider mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-secondary">
            tune
          </span>
          {settingsTitle}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-foreground mb-2">
              Chủ đề hội thoại
            </label>
            <Select
              disabled={disabled}
              value={selectedTopicId?.toString() || ""}
              onValueChange={onTopicChange}
            >
              <SelectTrigger className="w-full bg-card border border-border text-foreground text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all disabled:opacity-60">
                <SelectValue placeholder="Chọn chủ đề" />
              </SelectTrigger>
              <SelectContent>
                {topics.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-foreground mb-2 mt-4">
              Kịch bản (độ khó)
            </label>
            <div className="space-y-2">
              {scenarios.map((s) => (
                <div
                  key={s.id}
                  onClick={() => !disabled && onScenarioChange(s.id.toString())}
                  className={`p-3 rounded-lg border transition-all ${
                    disabled
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer"
                  } ${
                    selectedScenarioId === s.id
                      ? "bg-primary/5 border-primary shadow-sm"
                      : "bg-card border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground font-bold shrink-0">
                      {s.level}
                    </span>
                    <span className="text-xs font-semibold text-foreground truncate">
                      {s.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {s.situation}
                  </p>
                </div>
              ))}
              {scenarios.length === 0 && (
                <p className="text-[11px] text-muted-foreground italic text-center py-2">
                  (Không có kịch bản)
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sensei Feedback / Suggestions */}
      <div className="p-6 pb-8">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-primary">
            rate_review
          </span>
          Nhận xét của ss
        </h3>
        <div className="space-y-3">
          {feedback ? (
            <>
              {/* Điểm số */}
              {feedback.score !== undefined && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Điểm số
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-yellow-500 text-lg">
                        star
                      </span>
                      <span className="text-lg font-bold text-foreground">
                        {feedback.score}/100
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${feedback.score}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Nhận xét chính */}
              {feedback.comment && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-secondary text-base">
                      chat
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      Nhận xét
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feedback.comment}
                  </p>
                </div>
              )}

              {/* Điểm mạnh */}
              {feedback.strengths && feedback.strengths.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-green-500 text-base">
                      thumb_up
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      Điểm mạnh
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {feedback.strengths.map((strength, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-muted-foreground flex items-start gap-1.5"
                      >
                        <span className="text-green-500 mt-0.5">✓</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cần cải thiện */}
              {feedback.improvements && feedback.improvements.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-orange-500 text-base">
                      trending_up
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      Cần cải thiện
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {feedback.improvements.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-muted-foreground flex items-start gap-1.5"
                      >
                        <span className="text-orange-500 mt-0.5">→</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="bg-muted/50 border border-border rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-muted-foreground text-xl">
                  rate_review
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Hoàn thành một phiên hội thoại để nhận nhận xét từ Sensei
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
});
