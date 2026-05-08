"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import { Loader2 } from "lucide-react";
import { useAIChatSocket } from "@/providers/AIChatSocketProvider";
import {
  useCreateAiConversationMutation,
  useCreateAiMessageMutation,
} from "@/store/services/aiChatHistoryApi";
import {
  parseResponse,
  ASSISTANT_CHIPS,
  ChatInputArea,
  type AssistantMessage,
} from "@/components/user-component/ai/shared";
import { parseAssistantContent } from "@/components/user-component/ai/assistant/contentParser";
import {
  AiMessageBubble,
  AssistantTypingStatus,
  UserMessageBubble,
} from "@/components/user-component/ai/assistant/MessageBubbles";
import type {
  RouterThinkingItem,
} from "@/components/user-component/ai/assistant/types";
import FramedAiAvatar from "./FramedAiAvatar";

const STREAM_STALL_TIMEOUT_MS = 20000;
const STREAM_HEARTBEAT_CHECK_MS = 5000;
const STREAM_MAX_IDLE_MS = 15000;
const ROUTER_THINKING_MAX_ITEMS = 5;

/**
 * ChatDockContent - Compact version of AssistantPanel for ChatDock
 * Removes sidebar and optimizes for small floating window
 */

function intentToLabel(intent?: string) {
  if (intent === "grammar") return "Ngu phap";
  if (intent === "product") return "Khoa hoc";
  if (intent === "guide") return "Huong dan";
  if (intent === "orchestrator" || intent === "routing") return "Dang dieu phoi";
  if (intent === "general_reject") return "Tu choi";
  if (intent === "grammar_qa") return "Ngu phap";
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

export default function ChatDockContent() {
  const { socket, isConnected } = useAIChatSocket();
  const [createAiConversation] = useCreateAiConversationMutation();
  const [createAiMessage] = useCreateAiMessageMutation();

  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [queuedInfo, setQueuedInfo] = useState<{
    intent?: string;
    jobId?: string;
  } | null>(null);
  const [routerThinking, setRouterThinking] = useState<RouterThinkingItem[]>([]);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamBufferRef = useRef<string>("");
  const [draftSessionId] = useState(() => `draft_${Date.now()}`);
  const sessionIdRef = useRef<string>(draftSessionId);
  const activeConversationRef = useRef<number | null>(null);
  const streamWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamHeartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastStreamEventRef = useRef<number>(0);
  const routerThinkingRef = useRef<RouterThinkingItem[]>([]);
  const typingStartedAtRef = useRef<number | null>(null);

  const resolveResponseTimeMs = useCallback(() => {
    const startedAt = typingStartedAtRef.current;
    if (!startedAt) {
      return Math.max(0, Math.round(elapsedMs));
    }
    return Math.max(0, Math.round(Date.now() - startedAt));
  }, [elapsedMs]);

  const finishStreamingWithError = useCallback((message: string) => {
    const finalResponseTimeMs = resolveResponseTimeMs();

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
    streamBufferRef.current = "";

    setMessages((prev) => {
      const lastIdx = prev.length - 1;
      if (lastIdx >= 0 && prev[lastIdx].role === "ai" && prev[lastIdx]._streaming) {
        const updated = [...prev];
        updated[lastIdx] = {
          ...updated[lastIdx],
          textVn: message,
          responseTimeMs:
            finalResponseTimeMs > 0
              ? finalResponseTimeMs
              : updated[lastIdx].responseTimeMs,
          _streaming: false,
        };
        return updated;
      }

      return [
        ...prev,
        {
          id: Date.now() + Math.floor(Math.random() * 1000),
          role: "ai",
          textVn: message,
          responseTimeMs: finalResponseTimeMs > 0 ? finalResponseTimeMs : undefined,
          _streaming: false,
        },
      ];
    });
  }, [resolveResponseTimeMs]);

  // Auto-scroll to bottom
  useLayoutEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Timer when typing
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
    routerThinkingRef.current = routerThinking;
  }, [routerThinking]);

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
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleQueued = (data: {
      sessionId: string;
      intent?: string;
      jobId?: string;
    }) => {
      if (data.sessionId !== sessionIdRef.current) return;
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
      if (data.sessionId !== sessionIdRef.current) return;
      lastStreamEventRef.current = Date.now();

      const text = String(data.text || "").trim();
      if (text) {
        const prevThinking = routerThinkingRef.current;
        const lastText = prevThinking[prevThinking.length - 1]?.text;
        if (lastText !== text) {
          const nextThinking = [
            ...prevThinking,
            { phase: data.phase, text },
          ].slice(-ROUTER_THINKING_MAX_ITEMS);

          routerThinkingRef.current = nextThinking;
          setRouterThinking(nextThinking);

          const thinkingContent = formatThinkingItems(nextThinking);
          setMessages((prev) => {
            const lastIdx = prev.length - 1;
            if (lastIdx >= 0 && prev[lastIdx].role === "ai" && prev[lastIdx]._streaming) {
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
      if (data.sessionId !== sessionIdRef.current) return;
      lastStreamEventRef.current = Date.now();

      if (data.delta) {
        setIsTyping(true);
        armWatchdog();
        streamBufferRef.current += data.delta;
        const { think, content } = parseResponse(streamBufferRef.current);
        const fallbackThink = formatThinkingItems(routerThinkingRef.current);

        setMessages((prev) => {
          const lastIdx = prev.length - 1;
          if (lastIdx >= 0 && prev[lastIdx].role === "ai" && prev[lastIdx]._streaming) {
            const updated = [...prev];
            updated[lastIdx] = {
              ...updated[lastIdx],
              textVn: content,
              think: think || updated[lastIdx].think || fallbackThink || undefined,
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
        const finalFallbackThink = formatThinkingItems(routerThinkingRef.current);
        
        setIsTyping(false);
        setQueuedInfo(null);
        setRouterThinking([]);
        routerThinkingRef.current = [];
        typingStartedAtRef.current = null;

        setMessages((prev) => {
          const lastIdx = prev.length - 1;
          if (lastIdx >= 0 && prev[lastIdx].role === "ai" && prev[lastIdx]._streaming) {
            const updated = [...prev];
            updated[lastIdx] = {
              ...updated[lastIdx],
              textVn: content,
              think: think || updated[lastIdx].think || finalFallbackThink || undefined,
              responseTimeMs: finalResponseTimeMs > 0 ? finalResponseTimeMs : updated[lastIdx].responseTimeMs,
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
                responseTimeMs: finalResponseTimeMs > 0 ? finalResponseTimeMs : undefined,
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
            .catch(() => {});
        }

        streamBufferRef.current = "";
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
  }, [socket, armWatchdog, resolveResponseTimeMs, createAiMessage]);

  const ensureConversationId = useCallback(async (firstMessage: string) => {
    if (activeConversationRef.current) return activeConversationRef.current;

    const created = await createAiConversation({
      title: firstMessage.slice(0, 80),
      conversationType: "general",
    }).unwrap();

    if (!created?.id) return null;

    activeConversationRef.current = created.id;
    sessionIdRef.current = `conv_${created.id}`;
    return created.id;
  }, [createAiConversation]);

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
    }).unwrap().catch(() => {});

    streamBufferRef.current = "";
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", textJp: trimmed },
      { id: Date.now() + 1, role: "ai", textVn: "", _streaming: true },
    ]);

    setInput("");
    setIsTyping(true);
    setQueuedInfo(null);
    setRouterThinking([]);
    routerThinkingRef.current = [];
    typingStartedAtRef.current = Date.now();

    socket.emit(
      "chat:send",
      {
        sessionId: sessionIdRef.current,
        message: trimmed,
        mode: "basic",
        deepHelp: false,
      },
      (ack: {
        ok: boolean;
        error?: string;
        intent?: string;
        jobId?: string;
      }) => {
        if (ack?.ok || ack?.intent) {
          return;
        }

        const errorText = ack?.error || "";
        finishStreamingWithError(
          errorText.toLowerCase().includes("quota")
            ? "⚠️ Bạn đã hết lượt chat AI hôm nay. Vui lòng quay lại sau hoặc nâng cấp gói."
            : "⚠️ Không thể kết nối trợ giảng. Vui lòng thử lại sau.",
        );
      },
    );

    armWatchdog();
  }, [
    input,
    socket,
    isConnected,
    ensureConversationId,
    createAiMessage,
    armWatchdog,
    finishStreamingWithError,
  ]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background/40 dark:bg-slate-950/95">
      {!isConnected && (
        <div className="mx-4 mt-3 rounded-lg border border-orange-400/40 bg-orange-500/10 px-3 py-2 text-sm text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-400">
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-xs">Đang kết nối...</span>
          </div>
        </div>
      )}

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 && !isTyping ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
            <div className="h-20 w-20">
              <FramedAiAvatar className="h-full w-full" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground mb-1">
                Trợ giảng AI FUJI
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Hỏi bất kỳ điều gì về tiếng Nhật
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {ASSISTANT_CHIPS.slice(0, 4).map((chip) => (
                <button
                  key={chip.text}
                  onClick={() => setInput(chip.text)}
                  className="px-2 py-1 rounded-full bg-muted border border-border text-xs font-medium text-foreground hover:bg-card hover:border-primary/40 hover:text-primary transition-all"
                >
                  {chip.emoji} {chip.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
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

      <ChatInputArea
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        chips={[]}
        placeholder="Hỏi về tiếng Nhật..."
        inputDisabled={!isConnected}
        sendDisabled={!isConnected || isTyping}
      />
    </div>
  );
}
