"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAIChatSocket } from "@/providers/AIChatSocketProvider";
import {
  useCreateAiConversationMutation,
  useCreateAiMessageMutation,
  useDeleteAiConversationMutation,
  useGetAiConversationsQuery,
  useLazyGetAiMessagesQuery,
  type AiConversation,
  type AiMessage,
} from "@/store/services/aiChatHistoryApi";
import {
  parseResponse,
  ASSISTANT_CHIPS,
  ChatInputArea,
  type AssistantMessage,
} from "./shared";
import { parseAssistantContent } from "./assistant/contentParser";
import {
  AiMessageBubble,
  AssistantTypingStatus,
  UserMessageBubble,
} from "./assistant/MessageBubbles";
import ConversationSidebar from "./assistant/ConversationSidebar";
import type {
  AssistantConversationSnapshot,
  RouterThinkingItem,
} from "./assistant/types";

const MESSAGES_PAGE_SIZE = 20;
const STREAM_STALL_TIMEOUT_MS = 70000;
const ROUTER_THINKING_MAX_ITEMS = 5;

type AssistantPanelProps = {
  initialConversationId?: number | null;
  forceNewDraft?: boolean;
};

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
  if (intent === "grammar") return "Ngu phap";
  if (intent === "product") return "Khoa hoc";
  if (intent === "guide") return "Huong dan";
  if (intent === "general_reject") return "Tu choi";
  if (intent === "grammar_qa") return "Ngu phap";
  if (intent === "product_info") return "Khoa hoc";
  if (intent === "general_chat") return "Hoi dap";
  if (intent === "out_of_scope") return "Ngoai pham vi";
  return intent || "Dang xu ly";
}

function mapMessagesToAssistantMessages(list: AiMessage[]): AssistantMessage[] {
  return list.map((m) => {
    if (m.role === "assistant") {
      return { id: m.id, role: "ai", textVn: m.content };
    }
    return { id: m.id, role: "user", textJp: m.content };
  });
}

function isForbiddenConversationError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const status = (error as { status?: unknown }).status;
  return status === 403 || status === 404;
}

export default function AssistantPanel({
  initialConversationId = null,
  forceNewDraft = false,
}: AssistantPanelProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { socket, isConnected } = useAIChatSocket();
  const {
    data: conversations = [],
    isFetching: isLoadingConversations,
    refetch: refetchConversations,
  } = useGetAiConversationsQuery({ includeArchived: false, limit: 100 });
  const [fetchMessages, { isFetching: isFetchingMessages }] =
    useLazyGetAiMessagesQuery();
  const [activeConversationId, setActiveConversationId] = useState<
    number | null
  >(initialConversationId);
  const [preferDraftMode, setPreferDraftMode] = useState(
    Boolean(forceNewDraft),
  );
  const [createAiConversation] = useCreateAiConversationMutation();
  const [createAiMessage] = useCreateAiMessageMutation();
  const [deleteAiConversation] = useDeleteAiConversationMutation();

  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [nextBeforeId, setNextBeforeId] = useState<number | null>(null);
  const [isLoadingInitialMessages, setIsLoadingInitialMessages] =
    useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [queuedInfo, setQueuedInfo] = useState<{
    intent?: string;
    jobId?: string;
  } | null>(null);
  const [routerThinking, setRouterThinking] = useState<RouterThinkingItem[]>(
    [],
  );
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamBufferRef = useRef<string>("");
  const optimisticConversationRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string>("");
  const activeConversationRef = useRef<number | null>(null);
  const conversationSnapshotsRef = useRef<Map<number, AssistantConversationSnapshot>>(
    new Map(),
  );
  const initialLoadSeqRef = useRef(0);
  const pendingScrollRestoreRef = useRef<{
    prevHeight: number;
    prevTop: number;
  } | null>(null);
  const pendingBottomScrollBehaviorRef = useRef<ScrollBehavior | null>(null);
  const streamWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearStreamWatchdog = useCallback(() => {
    if (!streamWatchdogRef.current) {
      return;
    }
    clearTimeout(streamWatchdogRef.current);
    streamWatchdogRef.current = null;
  }, []);

  const forceFinishStreaming = useCallback(
    (fallbackMessage: string) => {
      clearStreamWatchdog();
      setIsTyping(false);
      setQueuedInfo(null);
      setRouterThinking([]);
      optimisticConversationRef.current = null;
      pendingBottomScrollBehaviorRef.current = "smooth";

      setMessages((prev) => {
        const lastIdx = prev.length - 1;
        if (
          lastIdx >= 0 &&
          prev[lastIdx].role === "ai" &&
          prev[lastIdx]._streaming
        ) {
          const updated = [...prev];
          updated[lastIdx] = {
            ...updated[lastIdx],
            textVn: fallbackMessage,
            _streaming: false,
          };
          return updated;
        }
        return prev;
      });

      streamBufferRef.current = "";
    },
    [clearStreamWatchdog],
  );

  const armStreamWatchdog = useCallback(() => {
    clearStreamWatchdog();
    streamWatchdogRef.current = setTimeout(() => {
      forceFinishStreaming(
        "⚠️ Kết nối phản hồi bị gián đoạn. Vui lòng gửi lại tin nhắn.",
      );
    }, STREAM_STALL_TIMEOUT_MS);
  }, [clearStreamWatchdog, forceFinishStreaming]);

  const goToDraftConversation = useCallback(
    (replaceUrl: boolean) => {
      initialLoadSeqRef.current += 1;
      setPreferDraftMode(true);
      setActiveConversationId(null);
      activeConversationRef.current = null;
      setMessages([]);
      setHasMoreMessages(false);
      setNextBeforeId(null);
      setIsLoadingInitialMessages(false);
      setIsLoadingOlderMessages(false);
      setIsTyping(false);
      setQueuedInfo(null);
      setRouterThinking([]);
      streamBufferRef.current = "";
      clearStreamWatchdog();
      optimisticConversationRef.current = null;
      sessionIdRef.current = `draft_${Date.now()}`;
      pendingBottomScrollBehaviorRef.current = null;
      pendingScrollRestoreRef.current = null;

      if (replaceUrl) {
        router.replace("/ai-chat?new=1");
        return;
      }
      router.push("/ai-chat?new=1");
    },
    [router, clearStreamWatchdog],
  );

  const restoreConversationSnapshot = useCallback((conversationId: number) => {
    const snapshot = conversationSnapshotsRef.current.get(conversationId);
    if (!snapshot) {
      return false;
    }

    pendingScrollRestoreRef.current = null;
    pendingBottomScrollBehaviorRef.current = "auto";
    setMessages(snapshot.messages);
    setHasMoreMessages(snapshot.hasMore);
    setNextBeforeId(snapshot.nextBeforeId);
    return true;
  }, []);

  const loadInitialMessages = useCallback(
    async (
      conversationId: number,
      options?: {
        preferCacheValue?: boolean;
        skipLoadingState?: boolean;
      },
    ) => {
      const seq = initialLoadSeqRef.current + 1;
      initialLoadSeqRef.current = seq;
      if (!options?.skipLoadingState) {
        setIsLoadingInitialMessages(true);
      } else {
        setIsLoadingInitialMessages(false);
      }

      try {
        const page = await fetchMessages(
          {
            conversationId,
            limit: MESSAGES_PAGE_SIZE,
          },
          options?.preferCacheValue ?? false,
        ).unwrap();

        if (
          seq !== initialLoadSeqRef.current ||
          activeConversationRef.current !== conversationId
        ) {
          return;
        }

        if (optimisticConversationRef.current === conversationId) {
          setHasMoreMessages(page.hasMore);
          setNextBeforeId(page.nextBeforeId);
          return;
        }

        pendingScrollRestoreRef.current = null;
        pendingBottomScrollBehaviorRef.current = "auto";
        setMessages(mapMessagesToAssistantMessages(page.messages));
        setHasMoreMessages(page.hasMore);
        setNextBeforeId(page.nextBeforeId);
      } catch (error) {
        if (
          seq !== initialLoadSeqRef.current ||
          activeConversationRef.current !== conversationId
        ) {
          return;
        }

        if (isForbiddenConversationError(error)) {
          goToDraftConversation(true);
          return;
        }

        setMessages([]);
        setHasMoreMessages(false);
        setNextBeforeId(null);
      } finally {
        if (seq === initialLoadSeqRef.current) {
          setIsLoadingInitialMessages(false);
        }
      }
    },
    [fetchMessages, goToDraftConversation],
  );

  useEffect(() => {
    if (activeConversationId == null) {
      return;
    }

    conversationSnapshotsRef.current.set(activeConversationId, {
      messages,
      hasMore: hasMoreMessages,
      nextBeforeId,
    });
  }, [activeConversationId, hasMoreMessages, messages, nextBeforeId]);

  const loadOlderMessages = useCallback(async () => {
    const conversationId = activeConversationRef.current;
    if (
      !conversationId ||
      !hasMoreMessages ||
      !nextBeforeId ||
      isLoadingOlderMessages
    ) {
      return;
    }

    setIsLoadingOlderMessages(true);

    const container = messagesContainerRef.current;
    if (container) {
      pendingScrollRestoreRef.current = {
        prevHeight: container.scrollHeight,
        prevTop: container.scrollTop,
      };
    }

    try {
      const page = await fetchMessages({
        conversationId,
        limit: MESSAGES_PAGE_SIZE,
        beforeId: nextBeforeId,
      }).unwrap();

      if (activeConversationRef.current !== conversationId) {
        return;
      }

      const olderMessages = mapMessagesToAssistantMessages(page.messages);
      if (olderMessages.length > 0) {
        setMessages((prev) => [...olderMessages, ...prev]);
      } else {
        pendingScrollRestoreRef.current = null;
      }

      setHasMoreMessages(page.hasMore);
      setNextBeforeId(page.nextBeforeId);
    } catch {
      pendingScrollRestoreRef.current = null;
    } finally {
      if (activeConversationRef.current === conversationId) {
        setIsLoadingOlderMessages(false);
      }
    }
  }, [fetchMessages, hasMoreMessages, isLoadingOlderMessages, nextBeforeId]);

  const handleMessagesScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || isLoadingInitialMessages || isLoadingOlderMessages) {
      return;
    }
    if (!hasMoreMessages || !nextBeforeId) {
      return;
    }
    if (container.scrollTop > 80) {
      return;
    }
    void loadOlderMessages();
  }, [
    hasMoreMessages,
    isLoadingInitialMessages,
    isLoadingOlderMessages,
    loadOlderMessages,
    nextBeforeId,
  ]);

  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    const restore = pendingScrollRestoreRef.current;

    if (container && restore) {
      const delta = container.scrollHeight - restore.prevHeight;
      container.scrollTop = restore.prevTop + delta;
      pendingScrollRestoreRef.current = null;
      return;
    }

    const behavior = pendingBottomScrollBehaviorRef.current;
    if (!behavior) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior });
    pendingBottomScrollBehaviorRef.current = null;
  }, [messages, isTyping]);

  useEffect(() => {
    setPreferDraftMode(Boolean(forceNewDraft));
    setActiveConversationId(initialConversationId);
  }, [forceNewDraft, initialConversationId]);

  // Auto-select latest conversation and sync url when entering /ai-chat.
  useEffect(() => {
    if (activeConversationId != null) {
      return;
    }
    if (
      preferDraftMode ||
      isLoadingConversations ||
      conversations.length === 0
    ) {
      return;
    }

    const latestConversationId = conversations[0].id;
    const nextPath = `/ai-chat/${latestConversationId}`;
    if (pathname !== nextPath) {
      router.replace(nextPath);
    }
  }, [
    activeConversationId,
    conversations,
    isLoadingConversations,
    pathname,
    preferDraftMode,
    router,
  ]);

  // Keep refs in sync with selected conversation and load message page.
  useEffect(() => {
    activeConversationRef.current = activeConversationId;
    clearStreamWatchdog();

    if (activeConversationId != null) {
      sessionIdRef.current = `conv_${activeConversationId}`;
      setIsTyping(false);
      setQueuedInfo(null);
      setRouterThinking([]);
      streamBufferRef.current = "";

      const hasWarmSnapshot = restoreConversationSnapshot(activeConversationId);
      void loadInitialMessages(activeConversationId, {
        preferCacheValue: true,
        skipLoadingState: hasWarmSnapshot,
      });
      return;
    }

    sessionIdRef.current = `draft_${Date.now()}`;
    optimisticConversationRef.current = null;
    setMessages([]);
    setHasMoreMessages(false);
    setNextBeforeId(null);
    setRouterThinking([]);
  }, [
    activeConversationId,
    loadInitialMessages,
    restoreConversationSnapshot,
    clearStreamWatchdog,
  ]);

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

  useEffect(() => {
    return () => {
      clearStreamWatchdog();
    };
  }, [clearStreamWatchdog]);

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
      armStreamWatchdog();
    };

    const handleRouterThinking = (data: {
      sessionId: string;
      phase?: string;
      text?: string;
      done?: boolean;
      route?: string | null;
    }) => {
      if (data.sessionId !== sessionIdRef.current) return;

      const text = String(data.text || "").trim();
      if (text) {
        setRouterThinking((prev) => {
          if (prev[prev.length - 1]?.text === text) {
            return prev;
          }

          const next = [
            ...prev,
            {
              phase: data.phase,
              text,
            },
          ];

          return next.slice(-ROUTER_THINKING_MAX_ITEMS);
        });
      }

      armStreamWatchdog();
    };

    const handleStream = (data: {
      sessionId: string;
      delta: string;
      done: boolean;
    }) => {
      if (data.sessionId !== sessionIdRef.current) return;

      if (data.delta) {
        setIsTyping(true);
        armStreamWatchdog();
        streamBufferRef.current += data.delta;
        pendingBottomScrollBehaviorRef.current = "smooth";
        const { think, content } = parseResponse(streamBufferRef.current);

        // Update AI message in-place
        setMessages((prev) => {
          const lastIdx = prev.length - 1;
          if (
            lastIdx >= 0 &&
            prev[lastIdx].role === "ai" &&
            prev[lastIdx]._streaming
          ) {
            const updated = [...prev];
            updated[lastIdx] = {
              ...updated[lastIdx],
              textVn: content,
              think: think || undefined,
            };
            return updated;
          }

          return [
            ...prev,
            {
              id: Date.now() + Math.floor(Math.random() * 1000),
              role: "ai",
              textVn: content,
              think: think || undefined,
              _streaming: true,
            },
          ];
        });
      }

      if (data.done) {
        clearStreamWatchdog();
        const finalRawText = streamBufferRef.current;
        const { think, content } = parseResponse(finalRawText);
        setIsTyping(false);
        setQueuedInfo(null);
        setRouterThinking([]);
        optimisticConversationRef.current = null;
        pendingBottomScrollBehaviorRef.current = "smooth";

        // Finalize message
        setMessages((prev) => {
          const lastIdx = prev.length - 1;
          if (
            lastIdx >= 0 &&
            prev[lastIdx].role === "ai" &&
            prev[lastIdx]._streaming
          ) {
            const updated = [...prev];
            updated[lastIdx] = {
              ...updated[lastIdx],
              textVn: content,
              think: think || undefined,
              _streaming: false,
            };
            return updated;
          }

          if (content.trim()) {
            return [
              ...prev,
              {
                id: Date.now() + Math.floor(Math.random() * 1000),
                role: "ai",
                textVn: content,
                think: think || undefined,
                _streaming: false,
              },
            ];
          }

          return prev;
        });

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
              refetchConversations();
            })
            .catch(() => {});
        }

        streamBufferRef.current = "";
      }
    };

    socket.on("chat:router:thinking", handleRouterThinking);
    socket.on("chat:queued", handleQueued);
    socket.on("chat:stream", handleStream);

    return () => {
      clearStreamWatchdog();
      socket.off("chat:router:thinking", handleRouterThinking);
      socket.off("chat:queued", handleQueued);
      socket.off("chat:stream", handleStream);
    };
  }, [
    socket,
    createAiMessage,
    refetchConversations,
    armStreamWatchdog,
    clearStreamWatchdog,
  ]);

  const ensureConversationId = useCallback(
    async (firstMessage: string) => {
      if (activeConversationRef.current) return activeConversationRef.current;

      const created = await createAiConversation({
        title: firstMessage.slice(0, 80),
        conversationType: "general",
      }).unwrap();

      if (!created?.id) return null;

      setPreferDraftMode(false);
      setActiveConversationId(created.id);
      activeConversationRef.current = created.id;
      optimisticConversationRef.current = created.id;
      sessionIdRef.current = `conv_${created.id}`;
      setHasMoreMessages(false);
      setNextBeforeId(null);
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
    optimisticConversationRef.current = conversationId;

    await createAiMessage({
      conversationId,
      role: "user",
      content: trimmed,
    })
      .unwrap()
      .catch(() => {});

    // Add local user + placeholder assistant messages for streaming UX
    streamBufferRef.current = "";
    pendingBottomScrollBehaviorRef.current = "smooth";
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", textJp: trimmed },
      { id: Date.now() + 1, role: "ai", textVn: "", _streaming: true },
    ]);

    setInput("");
    setIsTyping(true);
    setQueuedInfo(null);
    setRouterThinking([]);
    armStreamWatchdog();

    // Emit to socket
    socket.emit(
      "chat:send",
      { sessionId: sessionIdRef.current, message: trimmed },
      (ack: { ok: boolean; error?: string; intent?: string }) => {
        if (!ack?.ok && !ack?.intent) {
          forceFinishStreaming("⚠️ Không thể kết nối. Vui lòng thử lại sau.");
        }
      },
    );
  }, [
    input,
    socket,
    isConnected,
    ensureConversationId,
    createAiMessage,
    armStreamWatchdog,
    forceFinishStreaming,
  ]);

  const handleStartNewConversation = useCallback(() => {
    goToDraftConversation(false);
  }, [goToDraftConversation]);

  const handleSelectConversation = useCallback(
    (conversationId: number) => {
      if (conversationId === activeConversationRef.current) {
        return;
      }
      setPreferDraftMode(false);
      optimisticConversationRef.current = null;
      setIsTyping(false);
      setQueuedInfo(null);
      setRouterThinking([]);
      clearStreamWatchdog();
      streamBufferRef.current = "";
      router.push(`/ai-chat/${conversationId}`);
    },
    [router, clearStreamWatchdog],
  );

  const handleDeleteConversation = useCallback(
    async (conversationId: number) => {
      const confirmed = window.confirm("Xoa cuoc tro chuyen nay?");
      if (!confirmed) return;

      await deleteAiConversation(conversationId)
        .unwrap()
        .catch(() => {});
      if (activeConversationRef.current === conversationId) {
        setPreferDraftMode(false);
        setActiveConversationId(null);
        setMessages([]);
        router.replace("/ai-chat");
      }
      refetchConversations();
    },
    [deleteAiConversation, refetchConversations, router],
  );

  const isLoadingMessages =
    isLoadingInitialMessages || (isFetchingMessages && messages.length === 0);
  const shouldShowInputChips =
    messages.length === 0 && !isTyping && !isLoadingMessages;

  return (
    <div className="flex flex-1 overflow-hidden bg-background/40">
      <div className="flex min-w-0 flex-1 flex-col">
        {!isConnected && (
          <div className="mx-6 mt-4 rounded-lg border border-orange-400/40 bg-orange-500/10 px-3 py-2 text-sm text-orange-700">
            Mat ket noi socket chatbot. Dang thu ket noi lai...
          </div>
        )}

        <div
          ref={messagesContainerRef}
          onScroll={handleMessagesScroll}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {messages.length === 0 && !isTyping ? (
            isLoadingMessages ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Dang tai lich su hoi thoai...
              </div>
            ) : (
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
                    Hỏi bất kỳ điều gì về tiếng Nhật — ngữ pháp, từ vựng,
                    JLPT...
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
            )
          ) : (
            <>
              {(isLoadingOlderMessages || hasMoreMessages) && (
                <div className="flex justify-center">
                  {isLoadingOlderMessages ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                      <Loader2 className="size-3 animate-spin" />
                      Đang tải tin nhắn cũ hơn...
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/80">
                      Cuộn lên để xem tin nhắn cũ hơn
                    </span>
                  )}
                </div>
              )}

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
                  <AiMessageBubble
                    key={msg.id}
                    msg={msg}
                    parseAssistantContent={parseAssistantContent}
                    onCopy={(text) => navigator.clipboard.writeText(text)}
                  />
                ) : (
                  <UserMessageBubble key={msg.id} msg={msg} />
                ),
              )}

              <AssistantTypingStatus
                isTyping={isTyping}
                queuedInfo={queuedInfo}
                elapsedMs={elapsedMs}
                routerThinking={routerThinking}
                intentToLabel={intentToLabel}
              />

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <ChatInputArea
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          chips={shouldShowInputChips ? ASSISTANT_CHIPS : []}
          placeholder="Hỏi bất kỳ điều gì về tiếng Nhật..."
        />
      </div>

      <ConversationSidebar
        conversations={conversations}
        isLoadingConversations={isLoadingConversations}
        activeConversationId={activeConversationId}
        onStartNewConversation={handleStartNewConversation}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        getConversationTitle={getConversationTitle}
        formatConversationTime={formatConversationTime}
      />
    </div>
  );
}
