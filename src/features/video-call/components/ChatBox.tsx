"use client";

import { useState, useRef, useEffect } from "react";
import { Send, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import * as wanakana from "wanakana";
import { useTranslation } from "react-i18next";
import type { ChatMessageItem } from "../types";

interface ChatBoxProps {
  messages: ChatMessageItem[];
  onSendMessage: (message: string) => void;
  isBanned: boolean;
  banUntil: Date | null;
  violationCount: number;
  showWarning: boolean;
  className?: string;
}

type JishoSuggestion = {
  word: string;
  reading?: string;
  meaning?: string;
  scriptType?: "HIRAGANA" | "KANJI" | "OTHER";
};

const LATIN_CHAR_REGEX = /[A-Za-z]/;
const JAPANESE_CHAR_REGEX = /[\u3040-\u30ff\u3400-\u9fff]/;
const KANA_CHAR_REGEX = /[\u3040-\u30ff]/;

async function fetchJishoSuggestions(
  keyword: string,
  signal?: AbortSignal,
): Promise<JishoSuggestion[]> {
  const res = await fetch(
    `/api/jisho/search?keyword=${encodeURIComponent(keyword)}`,
    { signal },
  );
  const data = await res.json().catch(() => ({}));
  return Array.isArray(data?.suggestions) ? data.suggestions : [];
}

function getRomajiSuggestionContext(value: string) {
  const trimmed = value.trim();
  if (!trimmed || !LATIN_CHAR_REGEX.test(trimmed)) return null;
  if (JAPANESE_CHAR_REGEX.test(trimmed)) return null;

  const hiragana = wanakana.toHiragana(trimmed).trim();
  if (hiragana === trimmed || !KANA_CHAR_REGEX.test(hiragana)) return null;
  const lookup = hiragana.split(/\s+/).find((part) => KANA_CHAR_REGEX.test(part));
  if (!lookup) return null;

  return { raw: trimmed, hiragana, lookup };
}

function hasMeaningfulJapaneseSuggestion(suggestions: JishoSuggestion[]) {
  return suggestions.some((item) => {
    const word = (item.word ?? "").trim();
    const reading = (item.reading ?? "").trim();
    return Boolean(word || reading);
  });
}

export function ChatBox({
  messages,
  onSendMessage,
  isBanned,
  banUntil,
  violationCount,
  showWarning,
  className,
}: ChatBoxProps) {
  const { t, i18n } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [hiraganaPreview, setHiraganaPreview] = useState("");
  const [suggestions, setSuggestions] = useState<JishoSuggestion[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [isResolvingSend, setIsResolvingSend] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!showSuggestion || !hiraganaPreview) {
      setSuggestions([]);
      setIsFetchingSuggestions(false);
      if (suggestTimerRef.current) {
        clearTimeout(suggestTimerRef.current);
        suggestTimerRef.current = null;
      }
      suggestAbortRef.current?.abort();
      return;
    }

    if (suggestTimerRef.current) {
      clearTimeout(suggestTimerRef.current);
    }
    suggestAbortRef.current?.abort();

    const controller = new AbortController();
    suggestAbortRef.current = controller;
    setIsFetchingSuggestions(true);

    suggestTimerRef.current = setTimeout(() => {
      const context = getRomajiSuggestionContext(inputValue);
      const lookupKeyword = context?.lookup ?? hiraganaPreview;

      fetchJishoSuggestions(lookupKeyword, controller.signal)
        .then((items) => {
          setSuggestions(items);
          if (!hasMeaningfulJapaneseSuggestion(items)) {
            setShowSuggestion(false);
          }
        })
        .catch((error) => {
          if (error?.name === "AbortError") return;
          console.warn("[ChatBox] Failed to fetch suggestions.", error);
          setSuggestions([]);
        })
        .finally(() => {
          setIsFetchingSuggestions(false);
        });
    }, 350);

    return () => {
      if (suggestTimerRef.current) {
        clearTimeout(suggestTimerRef.current);
        suggestTimerRef.current = null;
      }
      controller.abort();
    };
  }, [showSuggestion, hiraganaPreview, inputValue]);

  const handleInputChange = (value: string) => {
    setInputValue(value);

    const context = getRomajiSuggestionContext(value);
    if (context) {
      setHiraganaPreview(context.hiragana);
      setShowSuggestion(true);
      setSuggestions([]);
      setSelectedSuggestionIndex(-1);
      return;
    }

    setShowSuggestion(false);
    setHiraganaPreview("");
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
  };

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isBanned || isResolvingSend) return;

    try {
      setIsResolvingSend(true);
      const messageToSend = await resolveMessageForSend(trimmed);

      onSendMessage(messageToSend);
      setInputValue("");
      setShowSuggestion(false);
      setHiraganaPreview("");
      setSuggestions([]);
      setSelectedSuggestionIndex(-1);
    } finally {
      setIsResolvingSend(false);
    }
  };
  const applySuggestion = (value: string) => {
    setInputValue(value);
    setShowSuggestion(false);
    setHiraganaPreview("");
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    inputRef.current?.focus();
  };

  const dismissSuggestions = () => {
    setShowSuggestion(false);
    setHiraganaPreview("");
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
  };

  const hasDictionarySuggestions = hasMeaningfulJapaneseSuggestion(suggestions);
  const kanjiSuggestions = suggestions.filter(
    (item) => item.scriptType === "KANJI",
  );

  // Build flat list of all selectable items:
  // index 0 = hiragana preview, index 1+ = each kanji suggestion
  const selectableItems = (() => {
    const items: { type: "hiragana" | "kanji"; label: string; value: string }[] = [];
    if (hiraganaPreview && hasDictionarySuggestions) {
      items.push({ type: "hiragana", label: hiraganaPreview, value: hiraganaPreview });
    }
    for (const s of kanjiSuggestions.slice(0, 6)) {
      items.push({ type: "kanji", label: s.word, value: s.word });
    }
    return items;
  })();

  const resolveMessageForSend = async (trimmed: string) => {
    if (
      selectedSuggestionIndex >= 0 &&
      selectedSuggestionIndex < selectableItems.length
    ) {
      return selectableItems[selectedSuggestionIndex].value;
    }

    const context = getRomajiSuggestionContext(trimmed);
    if (!context) return trimmed;

    if (hasMeaningfulJapaneseSuggestion(suggestions)) {
      return context.hiragana;
    }

    try {
      const freshSuggestions = await fetchJishoSuggestions(context.lookup);
      return hasMeaningfulJapaneseSuggestion(freshSuggestions)
        ? context.hiragana
        : trimmed;
    } catch (error) {
      console.warn("[ChatBox] Failed to resolve romaji before sending.", error);
      return trimmed;
    }
  };

  const navigateSuggestion = (direction: "next" | "prev") => {
    if (selectableItems.length === 0) return;
    setSelectedSuggestionIndex((prev) => {
      if (prev < 0) {
        return direction === "next" ? 0 : selectableItems.length - 1;
      }
      if (direction === "next") {
        return (prev + 1) % selectableItems.length;
      } else {
        return (prev - 1 + selectableItems.length) % selectableItems.length;
      }
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const locale = i18n.language.startsWith("ja")
      ? "ja-JP"
      : i18n.language.startsWith("en")
        ? "en-US"
        : "vi-VN";
    return date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getBanTimeRemaining = () => {
    if (!banUntil) return "";
    const now = new Date();
    const diff = banUntil.getTime() - now.getTime();
    if (diff <= 0) return "";
    const minutes = Math.ceil(diff / 60000);
    return t("videoCall.random.chat.minutes", { count: minutes });
  };

  if (isCollapsed) {
    return (
      <div
        className={cn("fixed right-0 top-1/2 -translate-y-1/2 z-50", className)}
      >
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="rounded-l-lg rounded-r-none shadow-lg"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("relative flex h-full flex-col overflow-hidden border-l border-white/50 bg-white/48 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06]", className)}>
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.68),rgba(255,255,255,0.12)_42%,rgba(125,211,252,0.10))] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(56,189,248,0.06)_48%,rgba(255,255,255,0.03))]" />
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/45 bg-white/35 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
        <h3 className="font-semibold text-sm">{t("videoCall.random.chat.title")}</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(true)}
          className="h-8 w-8 rounded-lg hover:bg-white/60 dark:hover:bg-white/10"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Warning Banner */}
      {showWarning && (
        <div className="relative z-10 flex items-start gap-2 border-b border-yellow-200/70 bg-yellow-50/68 p-3 backdrop-blur-xl dark:border-yellow-800/70 dark:bg-yellow-900/18">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-yellow-800 dark:text-yellow-200">
            <p className="font-medium">
              {t("videoCall.random.chat.warning")}
            </p>
            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
              {t("videoCall.random.chat.violationCount", { count: violationCount })}
            </p>
          </div>
        </div>
      )}

      {/* Ban Notice */}
      {isBanned && (
        <div className="relative z-10 border-b border-red-200/70 bg-red-50/68 p-3 backdrop-blur-xl dark:border-red-800/70 dark:bg-red-900/18">
          <p className="text-xs text-red-800 dark:text-red-200 font-medium">
            {t("videoCall.random.chat.banMessage", { remaining: getBanTimeRemaining() })}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto p-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              <p>{t("videoCall.random.chat.empty")}</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col gap-1",
                  msg.isLocal ? "items-end" : "items-start",
                )}
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">{msg.senderName}</span>
                  <span>{formatTime(msg.timestamp)}</span>
                </div>
                <div
                  className={cn(
                    "max-w-[80%] break-words rounded-xl px-3 py-2 text-sm",
                    msg.isLocal
                      ? "border border-white/55 bg-sky-500/88 text-white shadow-lg shadow-sky-500/10 backdrop-blur-xl"
                      : "border border-white/45 bg-white/54 text-slate-800 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.07] dark:text-slate-100",
                    msg.isViolation && "opacity-60",
                  )}
                >
                  {msg.message}
                </div>
                {msg.status === "sending" && (
                  <span className="text-xs text-muted-foreground">
                    {t("videoCall.random.chat.sending")}
                  </span>
                )}
                {msg.status === "failed" && (
                  <span className="text-xs text-red-500">
                    {t("videoCall.random.chat.sendFailed")}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* IME Suggestion */}
      {showSuggestion && hiraganaPreview && (
        <div className="relative z-10 border-t border-white/45 bg-white/38 px-3 py-2 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
          <button
            onClick={() => applySuggestion(hiraganaPreview)}
            className={cn(
              "text-sm text-primary hover:underline flex items-center gap-2 px-1 py-0.5 rounded",
              selectedSuggestionIndex === 0 &&
                "bg-primary/10 ring-2 ring-primary/30",
            )}
          >
            <span>{t("videoCall.random.chat.hiraganaLabel")}</span>
            <span className="font-medium">{hiraganaPreview}</span>
            <span className="text-xs text-muted-foreground">
              {t("videoCall.random.chat.applySuggestionHint")}
            </span>
          </button>
          <div className="mt-2">
            <p className="text-xs text-muted-foreground">
              {t("videoCall.random.chat.kanjiSuggestions")}
            </p>
            {isFetchingSuggestions && (
              <p className="text-xs text-muted-foreground mt-1">
                {t("videoCall.random.chat.searching")}
              </p>
            )}
            {!isFetchingSuggestions && kanjiSuggestions.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {t("videoCall.random.chat.noSuggestions")}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {kanjiSuggestions.slice(0, 6).map((item, idx) => (
                <button
                  key={`${item.word}-${item.reading ?? ""}`}
                  onClick={() => applySuggestion(item.word)}
                  title={item.meaning || item.reading || item.word}
                  className={cn(
                    "rounded-full border border-white/55 bg-white/58 px-3 py-1 text-xs shadow-sm backdrop-blur-xl hover:bg-white/75 dark:border-white/10 dark:bg-white/[0.07]",
                    selectedSuggestionIndex === 1 + idx &&
                      "bg-primary/10 ring-2 ring-primary/30 border-primary/50",
                  )}
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {item.word}
                  </span>
                  {item.reading && item.reading !== item.word && (
                    <span className="ml-1 text-[10px] text-slate-500 dark:text-slate-400">
                      ({item.reading})
                    </span>
                  )}
                </button>
              ))}
            </div>
            {/* Keyboard hint */}
            <p className="text-[10px] text-muted-foreground mt-2">
              {t("videoCall.random.chat.keyboardHint")}
            </p>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="relative z-10 border-t border-white/45 bg-white/38 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              // Arrow key navigation for suggestions
              if (showSuggestion && selectableItems.length > 0) {
                if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                  e.preventDefault();
                  navigateSuggestion("next");
                  return;
                }
                if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  navigateSuggestion("prev");
                  return;
                }
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                  return;
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  dismissSuggestions();
                  return;
                }
              }

              // Default enter-to-send (when no suggestion is visible)
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              isBanned
                ? t("videoCall.random.chat.bannedPlaceholder")
                : t("videoCall.random.chat.messagePlaceholder")
            }
            disabled={isBanned}
            className="flex-1 rounded-xl border-white/55 bg-white/68 shadow-sm backdrop-blur-xl focus-visible:ring-sky-400/35 dark:border-white/10 dark:bg-white/[0.07]"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isBanned || isResolvingSend}
            size="icon"
            className="rounded-xl border border-white/55 bg-sky-500/88 text-white shadow-lg shadow-sky-500/20 backdrop-blur-xl hover:bg-sky-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
