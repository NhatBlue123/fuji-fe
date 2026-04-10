"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAIChatSocket } from "@/providers/AIChatSocketProvider";
import {
  useCreateAiConversationMutation,
  useCreateAiMessageMutation,
  useDeleteAiConversationMutation,
  useGetAiConversationsQuery,
  useGetAiMessagesQuery,
  type AiConversation,
} from "@/store/services/aiChatHistoryApi";
import {
  parseResponse,
  ASSISTANT_CHIPS,
  ChatInputArea,
  ThinkBlock,
  type AssistantMessage,
} from "./shared";

/* ------------------------------------------------------------------ */
/* AssistantPanel — chatbot AI học tiếng Nhật (Socket.IO streaming)     */
/* ------------------------------------------------------------------ */

function getConversationTitle(conversation: AiConversation) {
  const title = conversation.title?.trim();
  if (title) return title;
  return `Cuoc tro chuyen #${conversation.id}`;
}

function formatConversationTime(dateLike?: string | null) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function intentToLabel(intent?: string) {
  if (intent === "grammar_qa") return "Ngu phap";
  if (intent === "product_info") return "Khoa hoc";
  if (intent === "general_chat") return "Hoi dap";
  if (intent === "out_of_scope") return "Ngoai pham vi";
  return intent || "Dang xu ly";
}

export default function AssistantPanel() {
  const { socket, isConnected } = useAIChatSocket();
  const {
    data: conversations = [],
    isFetching: isLoadingConversations,
    refetch: refetchConversations,
  } = useGetAiConversationsQuery({ includeArchived: false, limit: 100 });
  const [activeConversationId, setActiveConversationId] = useState<
    number | null
  >(null);
  const {
    data: loadedMessages = [],
    isFetching: isLoadingMessages,
    refetch: refetchMessages,
  } = useGetAiMessagesQuery(
    activeConversationId
      ? { conversationId: activeConversationId, limit: 200 }
      : skipToken,
  );
  const [createAiConversation] = useCreateAiConversationMutation();
  const [createAiMessage] = useCreateAiMessageMutation();
  const [deleteAiConversation] = useDeleteAiConversationMutation();

  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [queuedInfo, setQueuedInfo] = useState<{
    intent?: string;
    jobId?: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamBufferRef = useRef<string>("");
  const sessionIdRef = useRef<string>("");
  const activeConversationRef = useRef<number | null>(null);

  // Auto-select latest conversation when available
  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  // Keep refs in sync with selected conversation
  useEffect(() => {
    activeConversationRef.current = activeConversationId;
    if (activeConversationId) {
      sessionIdRef.current = `conv_${activeConversationId}`;
      return;
    }
    sessionIdRef.current = `draft_${Date.now()}`;
  }, [activeConversationId]);

  // Sync chat area from server messages when not streaming
  useEffect(() => {
    if (activeConversationId == null) {
      if (!isTyping) setMessages([]);
      return;
    }
    if (isTyping) return;

    const mapped: AssistantMessage[] = loadedMessages.map((m) => {
      if (m.role === "assistant") {
        return { id: m.id, role: "ai", textVn: m.content };
      }
      return { id: m.id, role: "user", textJp: m.content };
    });
    setMessages(mapped);
  }, [loadedMessages, activeConversationId, isTyping]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Timer khi typing
  useEffect(() => {
    if (!isTyping) {
      setElapsedMs(0);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => setElapsedMs(Date.now() - start), 100);
    return () => clearInterval(id);
  }, [isTyping]);

  // Listen socket chat:stream events
  useEffect(() => {
    if (!socket) return;

    const handleQueued = (data: {
      sessionId: string;
      intent?: string;
      jobId?: string;
    }) => {
      if (data.sessionId !== sessionIdRef.current) return;
      setQueuedInfo({ intent: data.intent, jobId: data.jobId });
    };

    const handleStream = (data: {
      sessionId: string;
      delta: string;
      done: boolean;
    }) => {
      if (data.sessionId !== sessionIdRef.current) return;

      if (data.delta) {
        streamBufferRef.current += data.delta;

        // Update AI message in-place
        setMessages((prev) => {
          const lastIdx = prev.length - 1;
          if (
            lastIdx >= 0 &&
            prev[lastIdx].role === "ai" &&
            prev[lastIdx]._streaming
          ) {
            const updated = [...prev];
            const { think, content } = parseResponse(streamBufferRef.current);
            updated[lastIdx] = {
              ...updated[lastIdx],
              textVn: content,
              think: think || undefined,
            };
            return updated;
          }
          return prev;
        });
      }

      if (data.done) {
        const finalRawText = streamBufferRef.current;
        setIsTyping(false);
        setQueuedInfo(null);

        // Finalize message
        setMessages((prev) => {
          const lastIdx = prev.length - 1;
          if (lastIdx >= 0 && prev[lastIdx]._streaming) {
            const updated = [...prev];
            const { think, content } = parseResponse(finalRawText);
            updated[lastIdx] = {
              ...updated[lastIdx],
              textVn: content,
              think: think || undefined,
              _streaming: false,
            };
            return updated;
          }
          return prev;
        });

        const { content } = parseResponse(finalRawText);
        const conversationId = activeConversationRef.current;
        if (conversationId && content.trim()) {
          createAiMessage({
            conversationId,
            role: "assistant",
            content,
            modelVersion: "gpt-5.4-mini",
          })
            .unwrap()
            .then(() => {
              refetchMessages();
              refetchConversations();
            })
            .catch(() => {});
        }

        streamBufferRef.current = "";
      }
    };

    socket.on("chat:queued", handleQueued);
    socket.on("chat:stream", handleStream);

    return () => {
      socket.off("chat:queued", handleQueued);
      socket.off("chat:stream", handleStream);
    };
  }, [socket, createAiMessage, refetchConversations, refetchMessages]);

  const ensureConversationId = useCallback(
    async (firstMessage: string) => {
      if (activeConversationRef.current) return activeConversationRef.current;

      const created = await createAiConversation({
        title: firstMessage.slice(0, 80),
        conversationType: "general",
      }).unwrap();

      if (!created?.id) return null;

      setActiveConversationId(created.id);
      activeConversationRef.current = created.id;
      sessionIdRef.current = `conv_${created.id}`;
      refetchConversations();
      return created.id;
    },
    [createAiConversation, refetchConversations],
  );

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || !socket || !isConnected) return;

    const conversationId = await ensureConversationId(trimmed);
    if (!conversationId) return;

    activeConversationRef.current = conversationId;
    sessionIdRef.current = `conv_${conversationId}`;

    await createAiMessage({
      conversationId,
      role: "user",
      content: trimmed,
    })
      .unwrap()
      .catch(() => {});

    // Add local user + placeholder assistant messages for streaming UX
    streamBufferRef.current = "";
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", textJp: trimmed },
      { id: Date.now() + 1, role: "ai", textVn: "", _streaming: true },
    ]);

    setInput("");
    setIsTyping(true);
    setQueuedInfo(null);

    // Emit to socket
    socket.emit(
      "chat:send",
      { sessionId: sessionIdRef.current, message: trimmed },
      (ack: { ok: boolean; error?: string; intent?: string }) => {
        if (!ack?.ok && !ack?.intent) {
          setIsTyping(false);
          setQueuedInfo(null);
          setMessages((prev) => {
            const lastIdx = prev.length - 1;
            if (lastIdx >= 0 && prev[lastIdx]._streaming) {
              const updated = [...prev];
              updated[lastIdx] = {
                ...updated[lastIdx],
                textVn: "⚠️ Không thể kết nối. Vui lòng thử lại sau.",
                _streaming: false,
              };
              return updated;
            }
            return prev;
          });
        }
      },
    );
  }, [input, socket, isConnected, ensureConversationId, createAiMessage]);

  const handleStartNewConversation = useCallback(() => {
    setActiveConversationId(null);
    activeConversationRef.current = null;
    setMessages([]);
    setIsTyping(false);
    setQueuedInfo(null);
    streamBufferRef.current = "";
    sessionIdRef.current = `draft_${Date.now()}`;
  }, []);

  const handleSelectConversation = useCallback((conversationId: number) => {
    setActiveConversationId(conversationId);
    setIsTyping(false);
    setQueuedInfo(null);
    streamBufferRef.current = "";
  }, []);

  const handleDeleteConversation = useCallback(
    async (conversationId: number) => {
      const confirmed = window.confirm("Xoa cuoc tro chuyen nay?");
      if (!confirmed) return;

      await deleteAiConversation(conversationId)
        .unwrap()
        .catch(() => {});
      if (activeConversationRef.current === conversationId) {
        setActiveConversationId(null);
        setMessages([]);
      }
      refetchConversations();
    },
    [deleteAiConversation, refetchConversations],
  );

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        {!isConnected && (
          <div className="mx-6 mt-4 rounded-lg border border-orange-400/40 bg-orange-500/10 px-3 py-2 text-sm text-orange-700">
            Mat ket noi socket chatbot. Dang thu ket noi lai...
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && !isTyping && !isLoadingMessages ? (
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
                        {msg._streaming && !msg.textVn && (
                          <div className="flex gap-1">
                            {[0, 150, 300].map((delay) => (
                              <span
                                key={delay}
                                className="size-1.5 bg-muted-foreground rounded-full animate-bounce"
                                style={{ animationDelay: `${delay}ms` }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      {!msg._streaming && msg.textVn && (
                        <div className="flex gap-2 mt-1">
                          <Button
                            variant="ghost"
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                            title="Sao chép"
                            onClick={() =>
                              navigator.clipboard.writeText(msg.textVn || "")
                            }
                          >
                            <span className="material-symbols-outlined text-lg">
                              content_copy
                            </span>
                          </Button>
                        </div>
                      )}
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

              {isLoadingMessages && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Dang tai lich su hoi thoai...
                </div>
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
                  {queuedInfo && (
                    <span className="text-[10px] rounded bg-muted px-2 py-0.5 text-muted-foreground/80">
                      {intentToLabel(queuedInfo.intent)} ·{" "}
                      {queuedInfo.jobId || "..."}
                    </span>
                  )}
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

      <aside className="w-80 border-l border-border bg-card/50 hidden lg:flex shrink-0 flex-col">
        <div className="p-4 border-b border-border space-y-3">
          <h3 className="text-sm font-bold text-foreground tracking-wide flex items-center gap-2">
            <MessageSquare className="size-4" /> Lịch sử hội thoại
          </h3>
          <Button
            type="button"
            className="w-full"
            variant="outline"
            onClick={handleStartNewConversation}
          >
            <Plus className="mr-2 size-4" />
            Cuộc trò chuyện mới
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoadingConversations && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-2 py-3">
              <Loader2 className="size-3.5 animate-spin" />
              Dang tai danh sach hoi thoai...
            </div>
          )}

          {!isLoadingConversations && conversations.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              Chưa có cuộc trò chuyện nào.
            </p>
          )}

          {conversations.map((conversation) => {
            const active = conversation.id === activeConversationId;
            return (
              <div
                key={conversation.id}
                className={`group rounded-lg border p-3 transition-colors ${
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <p className="text-sm font-medium text-foreground line-clamp-2">
                    {getConversationTitle(conversation)}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatConversationTime(
                      conversation.lastMessageAt || conversation.updatedAt,
                    )}
                  </p>
                </button>

                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteConversation(conversation.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
