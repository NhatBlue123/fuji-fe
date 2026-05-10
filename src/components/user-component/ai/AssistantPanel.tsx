"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
  useMemo,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAIChatSocket } from "@/providers/AIChatSocketProvider";
import { useGetMyAiQuotaQuery } from "@/store/services/aiQuotaApi";
import {
  useCreateAiConversationMutation,
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
import AiAvatar from "@/components/chatdock/AiAvatar";
import type { RouterThinkingItem } from "./assistant/types";

const MESSAGES_PAGE_SIZE = 20;
const STREAM_STALL_TIMEOUT_MS = 20000; // ✅ Giảm từ 70s xuống 20s
const STREAM_HEARTBEAT_CHECK_MS = 5000; // ✅ Check mỗi 5s
const STREAM_MAX_IDLE_MS = 15000; // ✅ Timeout nếu 15s không có event
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
  if (intent === "orchestrator" || intent === "routing") return "Dang dieu phoi";
  if (intent === "general_reject") return "Tu choi";
  if (intent === "grammar_qa") return "Ngu phap";
  if (intent === "reasoning" || intent === "deep_help") return "Suy luận";
  if (intent === "product_info") return "Khoa hoc";
  if (intent === "general_chat") return "Hoi dap";
  if (intent === "out_of_scope") return "Ngoai pham vi";
  return intent || "Dang xu ly";
}

function formatThinkingItems(items: RouterThinkingItem[]) {
  return items
    .map((item) => String(item.text || "").trim())
    .filter(Boolean)
    .map((text, idx) => `${idx + 1}. ${text}`)
    .join("\n");
}

function createClientMessageId() {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `chat_${Date.now().toString(36)}_${randomPart}`;
}

function mapMessagesToAssistantMessages(list: AiMessage[]): AssistantMessage[] {
  return list.map((m) => {
    if (m.role === "assistant") {
      const { think, content } = parseResponse(m.content);
      return {
        id: m.id,
        role: "ai",
        textVn: content,
        think: think || undefined,
      };
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
  const { t } = useTranslation();
  const { socket, isConnected } = useAIChatSocket();
  const {
    data: aiQuota = [],
    refetch: refetchAiQuota,
  } = useGetMyAiQuotaQuery();
  const basicChatQuota = useMemo(
    () => aiQuota.find((quota) => quota.featureKey === "AI_CHAT_BASIC"),
    [aiQuota],
  );
  const deepChatQuota = useMemo(
    () => aiQuota.find((quota) => quota.featureKey === "AI_CHAT_DEEP"),
    [aiQuota],
  );
  const basicChatRemaining = basicChatQuota
    ? Number(basicChatQuota.totalRemaining ?? 0)
    : null;
  const deepChatRemaining = deepChatQuota
    ? Number(deepChatQuota.totalRemaining ?? 0)
    : null;
  const isBasicChatQuotaEmpty =
    basicChatRemaining !== null && basicChatRemaining <= 0;
  const isDeepChatQuotaEmpty =
    deepChatRemaining !== null && deepChatRemaining <= 0;
  const isBasicChatQuotaLow =
    basicChatQuota &&
    !isBasicChatQuotaEmpty &&
    Number(basicChatQuota.dailyQuota ?? 0) > 0 &&
    basicChatRemaining !== null &&
    basicChatRemaining / Number(basicChatQuota.dailyQuota ?? 1) <= 0.2;
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
  const [deleteAiConversation] = useDeleteAiConversationMutation();

  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [nextBeforeId, setNextBeforeId] = useState<number | null>(null);
  const [isLoadingInitialMessages, setIsLoadingInitialMessages] =
    useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [input, setInput] = useState("");
  const [deepHelpEnabled, setDeepHelpEnabled] = useState(false);
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
  const initialLoadSeqRef = useRef(0);
  const pendingScrollRestoreRef = useRef<{
    prevHeight: number;
    prevTop: number;
  } | null>(null);
  const pendingBottomScrollBehaviorRef = useRef<ScrollBehavior | null>(null);
  const streamWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamHeartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null); // ✅ Heartbeat interval
  const lastStreamEventRef = useRef<number>(0); // ✅ Track last event time
  const routerThinkingRef = useRef<RouterThinkingItem[]>([]);
  const typingStartedAtRef = useRef<number | null>(null);

  const resolveResponseTimeMs = useCallback(() => {
    const startedAt = typingStartedAtRef.current;
    if (!startedAt) {
      return 0;
    }
    return Math.max(0, Math.round(Date.now() - startedAt));
  }, []);

  const forceFinishStreaming = useCallback(
    (fallbackMessage: string) => {
      const finalResponseTimeMs = resolveResponseTimeMs();
      
      // ✅ Inline clear watchdog
      if (streamWatchdogRef.current) {
        clearTimeout(streamWatchdogRef.current);
        streamWatchdogRef.current = null;
      }
      if (streamHeartbeatRef.current) {
        clearInterval(streamHeartbeatRef.current);
        streamHeartbeatRef.current = null;
      }
      
      setIsTyping(false);
      setQueuedInfo(null);
      setRouterThinking([]);
      routerThinkingRef.current = [];
      typingStartedAtRef.current = null;
      optimisticConversationRef.current = null;
      pendingBottomScrollBehaviorRef.current = null;

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
            responseTimeMs:
              finalResponseTimeMs > 0
                ? finalResponseTimeMs
                : updated[lastIdx].responseTimeMs,
            _streaming: false,
          };
          return updated;
        }
        return prev;
      });

      streamBufferRef.current = "";
    },
    [resolveResponseTimeMs],
  );

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
      routerThinkingRef.current = [];
      streamBufferRef.current = "";
      
      // ✅ Inline clear watchdog
      if (streamWatchdogRef.current) {
        clearTimeout(streamWatchdogRef.current);
        streamWatchdogRef.current = null;
      }
      if (streamHeartbeatRef.current) {
        clearInterval(streamHeartbeatRef.current);
        streamHeartbeatRef.current = null;
      }
      
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
    [router],
  );

  const loadInitialMessages = useCallback(
    async (
      conversationId: number,
      options?: {
        preferCacheValue?: boolean;
      },
    ) => {
      const seq = initialLoadSeqRef.current + 1;
      initialLoadSeqRef.current = seq;
      setIsLoadingInitialMessages(true);

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
    
    // ✅ Inline clear watchdog
    if (streamWatchdogRef.current) {
      clearTimeout(streamWatchdogRef.current);
      streamWatchdogRef.current = null;
    }
    if (streamHeartbeatRef.current) {
      clearInterval(streamHeartbeatRef.current);
      streamHeartbeatRef.current = null;
    }

    if (activeConversationId != null) {
      sessionIdRef.current = `conv_${activeConversationId}`;
      setIsTyping(false);
      setQueuedInfo(null);
      setRouterThinking([]);
      routerThinkingRef.current = [];
      streamBufferRef.current = "";

      void loadInitialMessages(activeConversationId, {
        preferCacheValue: true,
      });
      return;
    }

    sessionIdRef.current = `draft_${Date.now()}`;
    optimisticConversationRef.current = null;
    setMessages([]);
    setHasMoreMessages(false);
    setNextBeforeId(null);
    setRouterThinking([]);
    routerThinkingRef.current = [];
  }, [
    activeConversationId,
    loadInitialMessages,
  ]);

  // Timer khi typing
  useEffect(() => {
    if (!isTyping) {
      setElapsedMs(0);
      typingStartedAtRef.current = null;
      return;
    }

    if (!typingStartedAtRef.current) {
      typingStartedAtRef.current = Date.now();
    }

    const id = setInterval(() => {
      const startAt = typingStartedAtRef.current ?? Date.now();
      setElapsedMs(Date.now() - startAt);
    }, 100);
    return () => clearInterval(id);
  }, [isTyping]);

  useEffect(() => {
    return () => {
      // ✅ Cleanup on unmount
      if (streamWatchdogRef.current) {
        clearTimeout(streamWatchdogRef.current);
        streamWatchdogRef.current = null;
      }
      if (streamHeartbeatRef.current) {
        clearInterval(streamHeartbeatRef.current);
        streamHeartbeatRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    routerThinkingRef.current = routerThinking;
  }, [routerThinking]);

  // ✅ Helper functions - stable, không trigger re-render
  const armWatchdog = useCallback(() => {
    if (streamWatchdogRef.current) {
      clearTimeout(streamWatchdogRef.current);
      streamWatchdogRef.current = null;
    }
    if (streamHeartbeatRef.current) {
      clearInterval(streamHeartbeatRef.current);
      streamHeartbeatRef.current = null;
    }
    
    lastStreamEventRef.current = Date.now();
    
    streamHeartbeatRef.current = setInterval(() => {
      const elapsed = Date.now() - lastStreamEventRef.current;
      if (elapsed > STREAM_MAX_IDLE_MS) {
        console.warn("[Chat] ⚠️ Stream idle timeout:", elapsed, "ms");
        if (streamWatchdogRef.current) clearTimeout(streamWatchdogRef.current);
        if (streamHeartbeatRef.current) clearInterval(streamHeartbeatRef.current);
        streamWatchdogRef.current = null;
        streamHeartbeatRef.current = null;
        
        const finalResponseTimeMs = typingStartedAtRef.current 
          ? Date.now() - typingStartedAtRef.current 
          : 0;
        setIsTyping(false);
        setQueuedInfo(null);
        setRouterThinking([]);
        routerThinkingRef.current = [];
        typingStartedAtRef.current = null;
        optimisticConversationRef.current = null;
        pendingBottomScrollBehaviorRef.current = null;

        setMessages((prev) => {
          const lastIdx = prev.length - 1;
          if (lastIdx >= 0 && prev[lastIdx].role === "ai" && prev[lastIdx]._streaming) {
            const updated = [...prev];
            updated[lastIdx] = {
              ...updated[lastIdx],
              textVn: "⚠️ Kết nối phản hồi bị gián đoạn. Vui lòng gửi lại tin nhắn.",
              responseTimeMs: finalResponseTimeMs > 0 ? finalResponseTimeMs : updated[lastIdx].responseTimeMs,
              _streaming: false,
            };
            return updated;
          }
          return prev;
        });
        streamBufferRef.current = "";
      }
    }, STREAM_HEARTBEAT_CHECK_MS);
    
    streamWatchdogRef.current = setTimeout(() => {
      console.error("[Chat] ❌ Stream stall timeout");
      if (streamHeartbeatRef.current) clearInterval(streamHeartbeatRef.current);
      streamHeartbeatRef.current = null;
      
      const finalResponseTimeMs = typingStartedAtRef.current 
        ? Date.now() - typingStartedAtRef.current 
        : 0;
      setIsTyping(false);
      setQueuedInfo(null);
      setRouterThinking([]);
      routerThinkingRef.current = [];
      typingStartedAtRef.current = null;
      optimisticConversationRef.current = null;
      pendingBottomScrollBehaviorRef.current = null;

      setMessages((prev) => {
        const lastIdx = prev.length - 1;
        if (lastIdx >= 0 && prev[lastIdx].role === "ai" && prev[lastIdx]._streaming) {
          const updated = [...prev];
          updated[lastIdx] = {
            ...updated[lastIdx],
            textVn: "⚠️ Kết nối phản hồi bị gián đoạn. Vui lòng gửi lại tin nhắn.",
            responseTimeMs: finalResponseTimeMs > 0 ? finalResponseTimeMs : updated[lastIdx].responseTimeMs,
            _streaming: false,
          };
          return updated;
        }
        return prev;
      });
      streamBufferRef.current = "";
    }, STREAM_STALL_TIMEOUT_MS);
  }, []); // ✅ Empty deps - stable function

  // Listen socket chat:stream events
  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleQueued = (data: {
      sessionId: string;
      intent?: string;
      jobId?: string;
    }) => {
      if (data.sessionId !== sessionIdRef.current) {
        return;
      }
      setQueuedInfo({ intent: data.intent, jobId: data.jobId });
      armWatchdog();
    };

    const handleRouterThinking = (data: {
      sessionId: string;
      phase?: string;
      text?: string;
      done?: boolean;
      route?: string | null;
    }) => {
      
      if (data.sessionId !== sessionIdRef.current) {
        return;
      }

      // ✅ Update last event time
      lastStreamEventRef.current = Date.now();

      const text = String(data.text || "").trim();
      if (text) {
        const prevThinking = routerThinkingRef.current;
        const lastText = prevThinking[prevThinking.length - 1]?.text;
        if (lastText !== text) {
          const nextThinking = [
            ...prevThinking,
            {
              phase: data.phase,
              text,
            },
          ].slice(-ROUTER_THINKING_MAX_ITEMS);

          routerThinkingRef.current = nextThinking;
          setRouterThinking(nextThinking);

          const thinkingContent = formatThinkingItems(nextThinking);
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
                think: thinkingContent || updated[lastIdx].think,
              };
              return updated;
            }

            return [
              ...prev,
              {
                id: Date.now() + Math.floor(Math.random() * 1000),
                role: "ai",
                textVn: "",
                think: thinkingContent || undefined,
                _streaming: true,
              },
            ];
          });
        }
      }

      armWatchdog();
    };

    const handleStream = (data: {
      sessionId: string;
      delta: string;
      done: boolean;
    }) => {
      if (data.sessionId !== sessionIdRef.current) {
        return;
      }

      // ✅ Update last event time
      lastStreamEventRef.current = Date.now();

      if (data.delta) {
        setIsTyping(true);
        armWatchdog();
        streamBufferRef.current += data.delta;
        const { think, content } = parseResponse(streamBufferRef.current);
        const fallbackThink = formatThinkingItems(routerThinkingRef.current);

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
              think:
                think || updated[lastIdx].think || fallbackThink || undefined,
            };
            return updated;
          }

          return [
            ...prev,
            {
              id: Date.now() + Math.floor(Math.random() * 1000),
              role: "ai",
              textVn: content,
              think: think || fallbackThink || undefined,
              _streaming: true,
            },
          ];
        });
      }

      if (data.done) {
        const finalResponseTimeMs = resolveResponseTimeMs();
        
        // ✅ Inline clear watchdog
        if (streamWatchdogRef.current) {
          clearTimeout(streamWatchdogRef.current);
          streamWatchdogRef.current = null;
        }
        if (streamHeartbeatRef.current) {
          clearInterval(streamHeartbeatRef.current);
          streamHeartbeatRef.current = null;
        }
        
        const finalRawText = streamBufferRef.current;
        const { think, content } = parseResponse(finalRawText);
        const finalFallbackThink = formatThinkingItems(
          routerThinkingRef.current,
        );
        setIsTyping(false);
        setQueuedInfo(null);
        setRouterThinking([]);
        routerThinkingRef.current = [];
        typingStartedAtRef.current = null;
        optimisticConversationRef.current = null;
        pendingBottomScrollBehaviorRef.current = null;

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
              think:
                think ||
                updated[lastIdx].think ||
                finalFallbackThink ||
                undefined,
              responseTimeMs:
                finalResponseTimeMs > 0
                  ? finalResponseTimeMs
                  : updated[lastIdx].responseTimeMs,
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
                think: think || finalFallbackThink || undefined,
                responseTimeMs:
                  finalResponseTimeMs > 0 ? finalResponseTimeMs : undefined,
                _streaming: false,
              },
            ];
          }

          return prev;
        });

        streamBufferRef.current = "";
        if (content.trim()) {
          refetchConversations();
          refetchAiQuota();
        }
      }
    };

    socket.on("chat:router:thinking", handleRouterThinking);
    socket.on("chat:queued", handleQueued);
    socket.on("chat:stream", handleStream);

    return () => {
      if (streamWatchdogRef.current) {
        clearTimeout(streamWatchdogRef.current);
        streamWatchdogRef.current = null;
      }
      if (streamHeartbeatRef.current) {
        clearInterval(streamHeartbeatRef.current);
        streamHeartbeatRef.current = null;
      }
      socket.off("chat:router:thinking", handleRouterThinking);
      socket.off("chat:queued", handleQueued);
      socket.off("chat:stream", handleStream);
    };
  }, [
    socket,
    refetchConversations,
    refetchAiQuota,
    armWatchdog,
    resolveResponseTimeMs,
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
    if (!trimmed) {
      return;
    }
    
    if (!socket) {
      return;
    }
    
    if (!isConnected) {
      alert("Kết nối socket chưa sẵn sàng. Vui lòng đợi một chút...");
      return;
    }

    const useDeepHelp = deepHelpEnabled;

    if (useDeepHelp && isDeepChatQuotaEmpty) {
      alert(t("monetization.messages.advancedHelpEmpty"));
      return;
    }

    if (!useDeepHelp && isBasicChatQuotaEmpty) {
      alert(t("monetization.messages.chatEmpty"));
      return;
    }

    const conversationId = await ensureConversationId(trimmed);
    if (!conversationId) {
      return;
    }

    activeConversationRef.current = conversationId;
    sessionIdRef.current = `conv_${conversationId}`;
    optimisticConversationRef.current = conversationId;

    // Add local user + placeholder assistant messages for streaming UX
    streamBufferRef.current = "";
    pendingBottomScrollBehaviorRef.current = "smooth";
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", textJp: trimmed },
      { id: Date.now() + 1, role: "ai", textVn: "", _streaming: true },
    ]);

    setInput("");
    typingStartedAtRef.current = Date.now();
    lastStreamEventRef.current = Date.now();
    setIsTyping(true);
    setQueuedInfo(null);
    setRouterThinking([]);
    routerThinkingRef.current = [];
    armWatchdog();
    const clientMessageId = createClientMessageId();

    // Emit to socket
    socket.emit(
      "chat:send",
      {
        sessionId: sessionIdRef.current,
        message: trimmed,
        mode: useDeepHelp ? "reasoning" : "basic",
        deepHelp: useDeepHelp,
        clientMessageId,
      },
      (ack: { 
        ok: boolean; 
        error?: string; 
        intent?: string;
        socketId?: string;
        jobId?: string;
      }) => {
        if (!ack?.ok && !ack?.intent) {
          const errorText = ack?.error || "";
          if (errorText.toLowerCase().includes("quota")) {
            forceFinishStreaming(
              useDeepHelp
                ? t("monetization.messages.advancedHelpEmpty")
                : t("monetization.messages.chatEmpty"),
            );
            refetchAiQuota();
            return;
          }
          forceFinishStreaming("⚠️ Không thể kết nối. Vui lòng thử lại sau.");
        }
      },
    );
    if (useDeepHelp) {
      setDeepHelpEnabled(false);
    }
  }, [
    input,
    socket,
    isConnected,
    deepHelpEnabled,
    isBasicChatQuotaEmpty,
    isDeepChatQuotaEmpty,
    ensureConversationId,
    armWatchdog,
    forceFinishStreaming,
    refetchAiQuota,
    t,
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
      routerThinkingRef.current = [];
      
      // ✅ Inline clear watchdog
      if (streamWatchdogRef.current) {
        clearTimeout(streamWatchdogRef.current);
        streamWatchdogRef.current = null;
      }
      if (streamHeartbeatRef.current) {
        clearInterval(streamHeartbeatRef.current);
        streamHeartbeatRef.current = null;
      }
      
      streamBufferRef.current = "";
      router.push(`/ai-chat/${conversationId}`);
    },
    [router],
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
  const isCurrentModeQuotaEmpty = deepHelpEnabled
    ? isDeepChatQuotaEmpty
    : isBasicChatQuotaEmpty;
  const isAllChatQuotaEmpty = isBasicChatQuotaEmpty && isDeepChatQuotaEmpty;
  const chatPlaceholder = deepHelpEnabled
    ? isDeepChatQuotaEmpty
      ? t("monetization.messages.advancedHelpEmpty")
      : t("monetization.messages.advancedHelpPlaceholder")
    : isBasicChatQuotaEmpty
      ? deepChatRemaining !== null && deepChatRemaining > 0
        ? t("monetization.messages.advancedHelpSwitchPlaceholder")
        : t("monetization.messages.chatEmptyPlaceholder")
      : t("monetization.messages.chatPlaceholder");

  return (
    <div className="flex flex-1 overflow-hidden bg-background/40 dark:bg-slate-950/95">
      <div className="flex min-w-0 flex-1 flex-col">
        {!isConnected && (
          <div className="mx-6 mt-4 rounded-lg border border-orange-400/40 bg-orange-500/10 px-3 py-2 text-sm text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-400">
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span>Mất kết nối socket chatbot. Đang thử kết nối lại...</span>
            </div>
          </div>
        )}

        {(isBasicChatQuotaLow || isBasicChatQuotaEmpty) && (
          <div className={`mx-6 mt-4 rounded-lg border px-3 py-2 text-sm ${
            isBasicChatQuotaEmpty
              ? "border-red-400/40 bg-red-500/10 text-red-700 dark:border-red-500/30 dark:text-red-400"
              : "border-amber-400/40 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:text-amber-300"
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                {isBasicChatQuotaEmpty
                  ? t("monetization.messages.chatEmpty")
                  : t("monetization.messages.chatLow", {
                      count: basicChatRemaining,
                    })}
              </span>
              <Link href="/packages" className="font-bold underline">
                {t("monetization.actions.upgradePackage")}
              </Link>
            </div>
          </div>
        )}

        <div
          ref={messagesContainerRef}
          onScroll={handleMessagesScroll}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {messages.length === 0 && !isTyping ? (
            isLoadingMessages ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground dark:text-slate-400">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Dang tai lich su hoi thoai...
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
                <div className="size-20 rounded-full bg-gradient-to-br from-primary to-indigo-600 p-2 shadow-lg shadow-primary/20 dark:from-blue-500 dark:to-blue-700 dark:shadow-blue-500/30">
                  <AiAvatar className="w-full h-full" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1 dark:text-slate-100">
                    Trợ giảng AI FUJI
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs dark:text-slate-400">
                    Hỏi bất kỳ điều gì về tiếng Nhật — ngữ pháp, từ vựng,
                    JLPT...
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                  {ASSISTANT_CHIPS.map((chip) => (
                    <button
                      key={chip.text}
                      onClick={() => setInput(chip.text)}
                      className="px-3 py-1.5 rounded-full bg-muted border border-border text-xs font-medium text-foreground hover:bg-card hover:border-primary/40 hover:text-primary transition-all dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/80 dark:hover:border-blue-500/40 dark:hover:text-blue-400"
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
                    <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground dark:bg-slate-800/80 dark:text-slate-400">
                      <Loader2 className="size-3 animate-spin" />
                      Đang tải tin nhắn cũ hơn...
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/80 dark:text-slate-500">
                      Cuộn lên để xem tin nhắn cũ hơn
                    </span>
                  )}
                </div>
              )}

              <div className="flex justify-center">
                <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full dark:bg-slate-800/60 dark:text-slate-400">
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
                intentToLabel={intentToLabel}
              />

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="shrink-0 bg-white/45 px-6 py-3 backdrop-blur-md dark:bg-slate-950/55">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDeepHelpEnabled((current) => !current)}
                disabled={isDeepChatQuotaEmpty}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-3 font-semibold transition-colors ${
                  deepHelpEnabled
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/45 hover:text-primary"
                } disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground`}
              >
                <span className="material-symbols-outlined text-[17px]">
                  psychology
                </span>
                {t("monetization.actions.useAdvancedHelp")}
              </button>
              <span>
                {deepChatRemaining === null
                  ? t("monetization.messages.advancedHelpLoading")
                  : t("monetization.messages.advancedHelpRemaining", {
                      count: deepChatRemaining,
                    })}
              </span>
            </div>
            {isDeepChatQuotaEmpty && (
              <Link href="/packages" className="font-semibold text-primary underline">
                {t("monetization.actions.upgradePackage")}
              </Link>
            )}
          </div>
        </div>

        <ChatInputArea
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          chips={[]}
          placeholder={chatPlaceholder}
          inputDisabled={isAllChatQuotaEmpty}
          sendDisabled={isCurrentModeQuotaEmpty}
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
