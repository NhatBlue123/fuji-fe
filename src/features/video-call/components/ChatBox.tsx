"use client";

import { useState, useRef, useEffect } from "react";
import { Send, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import * as wanakana from "wanakana";
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

export function ChatBox({
  messages,
  onSendMessage,
  isBanned,
  banUntil,
  violationCount,
  showWarning,
  className,
}: ChatBoxProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [hiraganaPreview, setHiraganaPreview] = useState("");
  const [suggestions, setSuggestions] = useState<JishoSuggestion[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
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
      fetch(
        `/api/jisho/search?keyword=${encodeURIComponent(hiraganaPreview)}`,
        {
          signal: controller.signal,
        },
      )
        .then((res) => res.json())
        .then((data) => {
          const items = Array.isArray(data?.suggestions)
            ? data.suggestions
            : [];
          setSuggestions(items);
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
  }, [showSuggestion, hiraganaPreview]);

  const handleInputChange = (value: string) => {
    setInputValue(value);

    // Auto-convert romaji to hiragana preview
    // Only show suggestion if input contains latin characters and no Japanese
    const hasLatin = /[a-zA-Z]/.test(value);
    const hasJapanese = /[ぁ-んァ-ン一-龯]/.test(value);

    if (hasLatin && !hasJapanese && value.trim().length > 0) {
      const hiragana = wanakana.toHiragana(value);
      // Only show if conversion actually changed something
      if (hiragana !== value) {
        setHiraganaPreview(hiragana);
        setShowSuggestion(true);
        // reset selection when suggestions change
        setSelectedSuggestionIndex(-1);
      } else {
        setShowSuggestion(false);
        setHiraganaPreview("");
        setSuggestions([]);
        setSelectedSuggestionIndex(-1);
      }
    } else {
      setShowSuggestion(false);
      setHiraganaPreview("");
      setSuggestions([]);
      setSelectedSuggestionIndex(-1);
    }
  };

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isBanned) return;

    onSendMessage(trimmed);
    setInputValue("");
    setShowSuggestion(false);
    setHiraganaPreview("");
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
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

  const kanjiSuggestions = suggestions.filter(
    (item) => item.scriptType === "KANJI",
  );

  // Build flat list of all selectable items:
  // index 0 = hiragana preview, index 1+ = each kanji suggestion
  const selectableItems = (() => {
    const items: { type: "hiragana" | "kanji"; label: string; value: string }[] = [];
    if (hiraganaPreview) {
      items.push({ type: "hiragana", label: hiraganaPreview, value: hiraganaPreview });
    }
    for (const s of kanjiSuggestions.slice(0, 6)) {
      items.push({ type: "kanji", label: s.word, value: s.word });
    }
    return items;
  })();

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

  const selectCurrentSuggestion = () => {
    if (selectedSuggestionIndex < 0 || selectedSuggestionIndex >= selectableItems.length) return;
    applySuggestion(selectableItems[selectedSuggestionIndex].value);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("vi-VN", {
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
    return `${minutes} phút`;
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
    <div
      className={cn(
        "flex flex-col bg-white/90 dark:bg-slate-950/80 backdrop-blur border-l border-slate-200/70 dark:border-slate-800/70 shadow-xl h-full",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200/70 dark:border-slate-800/70 bg-slate-50/70 dark:bg-slate-900/40">
        <h3 className="font-semibold text-sm">チャット</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(true)}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Warning Banner */}
      {showWarning && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-yellow-800 dark:text-yellow-200">
            <p className="font-medium">
              Bạn nên sử dụng tiếng Nhật để việc học trở nên hiệu quả với nền
              tảng hơn.
            </p>
            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
              Vi phạm: {violationCount}/5
            </p>
          </div>
        </div>
      )}

      {/* Ban Notice */}
      {isBanned && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-3">
          <p className="text-xs text-red-800 dark:text-red-200 font-medium">
            Bạn đã bị cấm chat trong {getBanTimeRemaining()}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              <p>Chưa có tin nhắn nào</p>
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
                    "rounded-lg px-3 py-2 max-w-[80%] break-words text-sm",
                    msg.isLocal
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted",
                    msg.isViolation && "opacity-60",
                  )}
                >
                  {msg.message}
                </div>
                {msg.status === "sending" && (
                  <span className="text-xs text-muted-foreground">
                    送信中...
                  </span>
                )}
                {msg.status === "failed" && (
                  <span className="text-xs text-red-500">送信失敗</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* IME Suggestion */}
      {showSuggestion && hiraganaPreview && (
        <div className="px-3 py-2 border-t border-slate-200/70 dark:border-slate-800/70 bg-slate-50/80 dark:bg-slate-900/40">
          <button
            onClick={() => applySuggestion(hiraganaPreview)}
            className={cn(
              "text-sm text-primary hover:underline flex items-center gap-2 px-1 py-0.5 rounded",
              selectedSuggestionIndex === 0 &&
                "bg-primary/10 ring-2 ring-primary/30",
            )}
          >
            <span>ひらがな:</span>
            <span className="font-medium">{hiraganaPreview}</span>
            <span className="text-xs text-muted-foreground">
              (クリックして変換)
            </span>
          </button>
          <div className="mt-2">
            <p className="text-xs text-muted-foreground">Kanji gợi ý</p>
            {isFetchingSuggestions && (
              <p className="text-xs text-muted-foreground mt-1">Đang tìm...</p>
            )}
            {!isFetchingSuggestions && kanjiSuggestions.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Chưa có gợi ý
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {kanjiSuggestions.slice(0, 6).map((item, idx) => (
                <button
                  key={`${item.word}-${item.reading ?? ""}`}
                  onClick={() => applySuggestion(item.word)}
                  title={item.meaning || item.reading || item.word}
                  className={cn(
                    "rounded-full border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/70 px-3 py-1 text-xs shadow-sm hover:bg-white",
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
              ↑↓←→ để chọn · Enter để áp dụng · Esc để đóng
            </p>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t">
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
                  if (selectedSuggestionIndex >= 0) {
                    selectCurrentSuggestion();
                  } else {
                    handleSend();
                  }
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
              isBanned ? "Bạn đang bị cấm chat" : "メッセージを入力..."
            }
            disabled={isBanned}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isBanned}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}