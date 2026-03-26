"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { useAuth } from "@/store/hooks";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import {
  callSensei,
  parseResponse,
  ASSISTANT_CHIPS,
  LEVELS,
  TOPICS,
  ChatInputArea,
  RightSidebar,
  ThinkBlock,
  type AssistantMessage,
} from "./shared";

/* ------------------------------------------------------------------ */
/* AssistantPanel — chatbot AI học tiếng Nhật (text, n8n)               */
/* ------------------------------------------------------------------ */

export default function AssistantPanel() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState("N4");
  const [selectedTopic, setSelectedTopic] = useState("shopping");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Đếm thời gian chờ khi đang gọi API
  useEffect(() => {
    if (!isTyping) {
      setElapsedMs(0);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => setElapsedMs(Date.now() - start), 100);
    return () => clearInterval(id);
  }, [isTyping]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const sessionId = user?._id ?? user?.id?.toString() ?? "anonymous";
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", textJp: trimmed },
    ]);
    setInput("");
    setIsTyping(true);
    try {
      const raw = await callSensei(trimmed, sessionId);
      const { think, content } = parseResponse(raw);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "ai", textVn: content, think },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          textVn: "⚠️ Không thể kết nối Sensei. Vui lòng thử lại sau.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [input, user]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && !isTyping ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
              <div className="size-16 rounded-full bg-gradient-to-br from-primary to-indigo-600 p-0.5 shadow-lg shadow-primary/20">
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl">
                    smart_toy
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  Trợ giảng AI FUJI
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Hỏi bất kỳ điều gì về tiếng Nhật — ngữ pháp, từ vựng, JLPT...
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                {ASSISTANT_CHIPS.map((chip) => (
                  <button
                    key={chip.text}
                    onClick={() => setInput(chip.text)}
                    className="px-3 py-1.5 rounded-full bg-muted border border-border text-xs font-medium text-foreground hover:bg-card hover:border-primary/40 hover:text-primary transition-all"
                  >
                    {chip.emoji} {chip.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {new Date().toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </div>

              {messages.map((msg) =>
                msg.role === "ai" ? (
                  <div
                    key={msg.id}
                    className="flex items-start gap-4 max-w-3xl"
                  >
                    <div className="size-10 rounded-full bg-gradient-to-br from-primary to-indigo-600 p-0.5 shrink-0 shadow-lg shadow-primary/20">
                      <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-base">
                          smart_toy
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="text-xs text-muted-foreground font-medium ml-1">
                        Trợ giảng AI
                      </div>
                      <div className="bg-card border border-border p-4 rounded-2xl rounded-tl-none shadow-sm text-foreground leading-relaxed">
                        {msg.think && <ThinkBlock content={msg.think} />}
                        {msg.textJp && (
                          <p className="font-bold text-lg mb-1">{msg.textJp}</p>
                        )}
                        {msg.textVn && (
                          <div
                            className="prose prose-sm dark:prose-invert max-w-none text-sm
                        [&_h1]:text-base [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:mt-3
                        [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mb-1.5 [&_h2]:mt-3
                        [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-1 [&_h3]:mt-2
                        [&_p]:mb-2 [&_p]:leading-relaxed
                        [&_ul]:mb-2 [&_ul]:pl-4 [&_ul]:list-disc
                        [&_ol]:mb-2 [&_ol]:pl-4 [&_ol]:list-decimal
                        [&_li]:mb-0.5
                        [&_strong]:font-semibold [&_strong]:text-foreground
                        [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
                        [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-2
                        [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
                        [&_hr]:border-border [&_hr]:my-2"
                          >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.textVn}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Button
                          variant="ghost"
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          title="Sao chép"
                        >
                          <span className="material-symbols-outlined text-lg">
                            content_copy
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    key={msg.id}
                    className="flex items-start gap-4 max-w-3xl ml-auto flex-row-reverse"
                  >
                    <div className="size-10 rounded-full bg-muted shrink-0 border border-border flex items-center justify-center">
                      <span className="material-symbols-outlined text-muted-foreground">
                        person
                      </span>
                    </div>
                    <div className="bg-primary text-primary-foreground p-4 rounded-2xl rounded-tr-none shadow-md shadow-primary/10 leading-relaxed">
                      <p className="text-base">{msg.textJp}</p>
                    </div>
                  </div>
                ),
              )}

              {isTyping && (
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
                  <span className="text-xs text-muted-foreground">
                    Trợ giảng đang soạn...
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                    {(elapsedMs / 1000).toFixed(1)}s
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <ChatInputArea
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          chips={ASSISTANT_CHIPS}
          placeholder="Hỏi bất kỳ điều gì về tiếng Nhật..."
        />
      </div>

      <RightSidebar
        settingsTitle="Thiết lập Trợ giảng"
        feedbackTitle="Phân tích câu hỏi"
        topics={TOPICS.map((t) => ({ id: t.value, title: t.label }))}
        selectedTopicId={selectedTopic as any}
        onTopicChange={setSelectedTopic}
        scenarios={LEVELS.map((l) => ({ id: l, title: l, level: l, situation: "" }))}
        selectedScenarioId={selectedLevel as any}
        onScenarioChange={setSelectedLevel}
        disabled={isTyping}
      />
    </div>
  );
}
