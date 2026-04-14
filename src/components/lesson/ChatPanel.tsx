"use client";

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage, TypingStatus } from "@/hooks/useStompChat";

interface ChatPanelProps {
  messages: ChatMessage[];
  typingUsers: TypingStatus[];
  currentUserId: number;
  onSendMessage: (content: string, type?: string) => void;
  onSendTyping: (isTyping: boolean) => void;
  onReaction: (messageId: number, emoji: string) => void;
  onMarkSeen: () => void;
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🎉", "👏", "🤔"];

export function ChatPanel({
  messages,
  typingUsers,
  currentUserId,
  onSendMessage,
  onSendTyping,
  onReaction,
  onMarkSeen,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [hoveredMsgId, setHoveredMsgId] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasTypingRef = useRef(false);
  /** Người dùng đang xem gần đáy khung chat — chỉ tự cuộn khi true */
  const nearBottomRef = useRef(true);
  /** Vừa bấm gửi — luôn cuộn xuống dù trước đó đã kéo lên đọc */
  const stickAfterSendRef = useRef(false);

  const updateNearBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    nearBottomRef.current = dist < 72;
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateNearBottom, { passive: true });
    return () => el.removeEventListener("scroll", updateNearBottom);
  }, [updateNearBottom]);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (!nearBottomRef.current && !stickAfterSendRef.current) return;
    stickAfterSendRef.current = false;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    onMarkSeen();
  }, [messages.length, onMarkSeen]);

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value);

      if (value.trim() && !wasTypingRef.current) {
        wasTypingRef.current = true;
        onSendTyping(true);
      }

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        wasTypingRef.current = false;
        onSendTyping(false);
      }, 2000);
    },
    [onSendTyping]
  );

  const handleSend = useCallback(() => {
    const content = input.trim();
    if (!content) return;
    nearBottomRef.current = true;
    stickAfterSendRef.current = true;
    onSendMessage(content);
    setInput("");
    wasTypingRef.current = false;
    onSendTyping(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  }, [input, onSendMessage, onSendTyping]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const parseReactions = (json: string): Record<string, number[]> => {
    try {
      return JSON.parse(json || "{}");
    } catch {
      return {};
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages list */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0"
      >
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-[#8B8FA8] text-xs text-center leading-relaxed">
              Gửi tin nhắn để bắt đầu
              <br />
              trò chuyện trong buổi học.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId;
          const reactions = parseReactions(msg.reactions);
          const hasReactions = Object.keys(reactions).length > 0;

          return (
            <div
              key={msg.id}
              className={cn("flex flex-col gap-0.5 group", isMine ? "items-end" : "items-start")}
              onMouseEnter={() => setHoveredMsgId(msg.id)}
              onMouseLeave={() => setHoveredMsgId(null)}
            >
              {/* Sender name */}
              <span className="text-[#8B8FA8] text-[10px] px-1">
                {msg.senderName}
                <span className="ml-1 text-[#8B8FA8]/50">
                  {msg.senderRole === "TEACHER" ? "GV" : "HV"}
                </span>
              </span>

              {/* Message bubble */}
              <div className="relative max-w-[85%]">
                <div
                  className={cn(
                    "px-3 py-2 rounded-2xl text-sm break-words shadow-sm",
                    isMine
                      ? "bg-[#6C63FF] text-white rounded-br-sm"
                      : "bg-[#252838] text-[#F0F0F0] rounded-bl-sm",
                    msg.type === "VOCABULARY" && "border border-[#4ECDC4]/30 bg-[#4ECDC4]/10"
                  )}
                >
                  {msg.type === "VOCABULARY" ? (
                    <VocabularyCard content={msg.content} />
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}

                  <div
                    className={cn(
                      "mt-1 text-[10px] text-right",
                      isMine ? "text-white/50" : "text-[#8B8FA8]/60"
                    )}
                  >
                    {formatTime(msg.createdAt)}
                  </div>
                </div>

                {/* Quick reaction picker */}
                {hoveredMsgId === msg.id && (
                  <div
                    className={cn(
                      "absolute -top-8 z-10 flex items-center gap-0.5 bg-[#1a1d27] border border-white/10 rounded-full px-1.5 py-0.5 shadow-lg",
                      isMine ? "right-0" : "left-0"
                    )}
                  >
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => onReaction(msg.id, emoji)}
                        className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-xs transition-transform hover:scale-125"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reaction badges */}
              {hasReactions && (
                <div className="flex flex-wrap gap-1 px-1">
                  {Object.entries(reactions).map(([emoji, users]) => (
                    <button
                      key={emoji}
                      onClick={() => onReaction(msg.id, emoji)}
                      className={cn(
                        "flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded-full border transition-colors",
                        (users as number[]).includes(currentUserId)
                          ? "bg-[#6C63FF]/20 border-[#6C63FF]/40 text-[#6C63FF]"
                          : "bg-white/5 border-white/10 text-[#8B8FA8] hover:bg-white/10"
                      )}
                    >
                      <span>{emoji}</span>
                      <span>{(users as number[]).length}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-1.5 px-1 py-1">
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B8FA8] animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B8FA8] animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B8FA8] animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-[10px] text-[#8B8FA8]">
              {typingUsers.map((t) => t.userName).join(", ")} đang nhập...
            </span>
          </div>
        )}

      </div>

      {/* Input area */}
      <div className="shrink-0 p-3 border-t border-white/[0.08] bg-[#0f1117]/60">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhắn tin..."
            rows={1}
            className="flex-1 min-h-[40px] max-h-[100px] resize-none bg-[#252838] border border-white/10 text-sm text-[#F0F0F0] placeholder:text-[#8B8FA8]/60 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#6C63FF] transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="shrink-0 w-10 h-10 rounded-xl bg-[#6C63FF] hover:bg-[#5a52e0] disabled:opacity-30 disabled:hover:bg-[#6C63FF] text-white flex items-center justify-center transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function VocabularyCard({ content }: { content: string }) {
  const lines = content.split("\n");
  const word = lines[0] || "";
  const reading = lines[1] || "";
  const meaning = lines[2] || "";
  const example = lines[3] || "";

  return (
    <div className="space-y-1">
      <div className="text-base font-bold text-[#4ECDC4]">{word}</div>
      {reading && <div className="text-xs text-[#FF6B6B]">{reading}</div>}
      {meaning && <div className="text-xs text-[#F0F0F0]">{meaning}</div>}
      {example && (
        <div className="text-[11px] text-[#8B8FA8] italic border-l-2 border-[#4ECDC4]/30 pl-2 mt-1">
          {example}
        </div>
      )}
    </div>
  );
}
