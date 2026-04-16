"use client";

import { useTranslation } from "react-i18next";

import { memo, useEffect, useState } from "react";
import LiquidGlass from "@/components/ui/liquid-glass-safe";
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
  responseTimeMs?: number;
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
  const { t } = useTranslation();
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
  isStreaming = false,
}: {
  content: string;
  isStreaming?: boolean;
}) {
  const [open, setOpen] = useState(isStreaming);
  useEffect(() => {
    setOpen(isStreaming);
  }, [isStreaming]);

  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const latestLine = lines[lines.length - 1] || "Dang phan tich...";

  return (
    <div className="mb-3">
      {isStreaming ? (
        <div className="flex items-center gap-2 rounded-lg border border-border/55 bg-muted/45 px-2.5 py-1.5 text-xs text-muted-foreground">
          <div className="relative flex size-3 items-center justify-center">
            <span className="size-1.5 rounded-full bg-muted-foreground/80 animate-pulse" />
          </div>
          <span className="font-medium text-foreground/80">Dang suy nghi:</span>
          <span className="min-w-0 flex-1 truncate font-medium text-muted-foreground animate-pulse">
            {latestLine}
          </span>
        </div>
      ) : (
        <button
          onClick={() => setOpen((p) => !p)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
        >
          <span className="material-symbols-outlined text-sm group-hover:text-primary/70 transition-colors">
            {open ? "unfold_less" : "unfold_more"}
          </span>
          <span className="flex items-center gap-1">💭 Quá trình suy nghĩ</span>
        </button>
      )}
      {open && !isStreaming && (
        <div className="mt-2 text-xs text-muted-foreground bg-gradient-to-b from-muted/50 to-muted/30 border border-border/50 rounded-lg p-3 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
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
    <div className="shrink-0 border-t border-border/60 bg-gradient-to-b from-white/28 to-white/8 p-6 backdrop-blur-md dark:from-slate-900/24 dark:to-slate-900/6">
      {chips.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {chips.map((chip) => (
            <Button
              key={chip.text}
              onClick={() => onInputChange(chip.text)}
              className="whitespace-nowrap rounded-full border border-white/55 bg-white/72 px-4 py-2 text-xs font-medium text-foreground transition-all hover:border-primary/40 hover:bg-white/90 hover:text-primary dark:border-white/15 dark:bg-slate-900/55 dark:hover:bg-slate-900/65"
            >
              {chip.emoji} {chip.text}
            </Button>
          ))}
        </div>
      )}
      <LiquidGlass
        displacementScale={72}
        blurAmount={0.074}
        saturation={152}
        elasticity={0.16}
        mode="prominent"
        cornerRadius={18}
        className="rounded-2xl"
      >
        <div className="relative flex items-center gap-2 rounded-2xl border border-border/70 bg-background/65 p-1.5 shadow-[0_24px_56px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="relative flex-1">
            <Input
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSend()}
              className="h-8 w-full rounded-xl border-input bg-background/90 py-1.5 pl-4 pr-12 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground/90 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0"
              placeholder={placeholder}
              type="text"
            />
            {showEmoji && (
              <Button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground">
                <span className="material-symbols-outlined">
                  sentiment_satisfied
                </span>
              </Button>
            )}
          </div>
          {showMic && (
            <Button className="group flex items-center justify-center rounded-lg border border-white/55 bg-white/70 p-2 text-foreground shadow-sm transition-all hover:bg-white/90 dark:border-white/15 dark:bg-slate-900/58 dark:hover:bg-slate-900/65">
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:scale-110">
                mic
              </span>
            </Button>
          )}
          <Button
            onClick={onSend}
            disabled={!input.trim()}
            className="group flex items-center justify-center rounded-lg border border-white/60 bg-gradient-to-r from-primary to-blue-500 p-2 text-primary-foreground shadow-[0_18px_30px_-20px_rgba(37,99,235,0.75)] transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-0.5">
              send
            </span>
          </Button>
        </div>
      </LiquidGlass>
    </div>
  );
});

/** Shared right sidebar */
export interface SenseiFeedback {
  score?: number;
  comment?: string;
  scoreGrammar?: number | null;
  scoreVocabulary?: number | null;
  totalScore?: number | null;
  feedbackText?: string | null;
  strengths?: string[];
  improvements?: string[];
}

export type SenseiEvaluationStatus = "idle" | "waiting" | "failed";

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
  evaluationStatus = "idle",
  evaluationMessage,
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
  evaluationStatus?: SenseiEvaluationStatus;
  evaluationMessage?: string | null;
}) {
  const { t } = useTranslation();

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
                <SelectValue placeholder={t("auto.shared_1")} />
              </SelectTrigger>
              <SelectContent>
                {topics.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id.toString()}>
                    {topic.title}
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
              {(feedback.comment || feedback.feedbackText) && (
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
                    {feedback.comment || feedback.feedbackText}
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
          ) : evaluationStatus === "waiting" ? (
            <div className="bg-muted/50 border border-border rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-primary text-xl animate-spin">
                  progress_activity
                </span>
              </div>
              <p className="text-xs text-foreground font-medium mb-1">
                Đang chấm điểm phiên hội thoại
              </p>
              <p className="text-xs text-muted-foreground">
                Vui lòng chờ trong giây lát...
              </p>
            </div>
          ) : evaluationStatus === "failed" ? (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-destructive text-xl">
                  error
                </span>
              </div>
              <p className="text-xs text-destructive font-medium mb-1">
                Chấm điểm chưa thành công
              </p>
              <p className="text-xs text-muted-foreground">
                {evaluationMessage || "Vui lòng thử kết thúc phiên lại."}
              </p>
            </div>
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
