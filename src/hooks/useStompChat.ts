"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getStompClient, STOMP_JSON_HEADERS } from "@/lib/stomp";
import type { IMessage, StompSubscription } from "@stomp/stompjs";
import {
  useSendChatMessageMutation,
  type ChatMessageResponse,
} from "@/store/services/lessonApi";
import { toast } from "sonner";

/** Normalize LocalDateTime that may arrive as an array [y,m,d,h,min,s,ns] or ISO string. */
function normalizeCreatedAt(val: unknown): string {
  if (typeof val === "string") return val;
  if (Array.isArray(val)) {
    const [y, mo = 1, d = 1, h = 0, mi = 0, s = 0] = val;
    return new Date(y, mo - 1, d, h, mi, s).toISOString();
  }
  return new Date().toISOString();
}

export interface ChatMessage {
  id: number;
  lessonId: number;
  senderId: number;
  senderName: string;
  senderRole: "TEACHER" | "STUDENT";
  type: "TEXT" | "FILE" | "VOCABULARY" | "SYSTEM";
  content: string;
  fileUrl: string | null;
  reactions: string;
  seenBy: string;
  createdAt: string;
}

export interface TypingStatus {
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface SeenEvent {
  userId: number;
  userName: string;
}

interface UseStompChatReturn {
  messages: ChatMessage[];
  typingUsers: TypingStatus[];
  sendMessage: (content: string, type?: string, fileUrl?: string) => void;
  sendTyping: (isTyping: boolean) => void;
  sendReaction: (messageId: number, emoji: string) => void;
  markSeen: () => void;
  isConnected: boolean;
}

function extractApiErrorMessage(err: unknown): string | null {
  if (!err || typeof err !== "object") return null;
  const payload = (err as { data?: unknown }).data;
  if (!payload || typeof payload !== "object") return null;
  const message = (payload as { message?: unknown }).message;
  return typeof message === "string" && message.trim() ? message : null;
}

function normalizeIncomingChat(raw: Record<string, unknown>): ChatMessage {
  const role = raw.senderRole;
  const senderRole: ChatMessage["senderRole"] =
    role === "TEACHER" ? "TEACHER" : "STUDENT";
  const tr = raw.type;
  const type: ChatMessage["type"] =
    tr === "FILE" || tr === "VOCABULARY" || tr === "SYSTEM" ? tr : "TEXT";
  return {
    id: Number(raw.id),
    lessonId: Number(raw.lessonId),
    senderId: Number(raw.senderId),
    senderName: String(raw.senderName ?? ""),
    senderRole,
    type,
    content: String(raw.content ?? ""),
    fileUrl: raw.fileUrl == null ? null : String(raw.fileUrl),
    reactions: typeof raw.reactions === "string" ? raw.reactions : "{}",
    seenBy: typeof raw.seenBy === "string" ? raw.seenBy : "",
    createdAt: normalizeCreatedAt(raw.createdAt),
  };
}

function fromRestMessage(m: ChatMessageResponse): ChatMessage {
  return {
    id: m.id,
    lessonId: m.lessonId,
    senderId: m.senderId,
    senderName: m.senderName,
    senderRole: m.senderRole,
    type: m.type,
    content: m.content,
    fileUrl: m.fileUrl ?? null,
    reactions: m.reactions,
    seenBy: m.seenBy,
    createdAt: normalizeCreatedAt(m.createdAt as unknown),
  };
}

function mergeChatMessages(
  history: ChatMessage[],
  incoming: ChatMessage[]
): ChatMessage[] {
  const map = new Map<number, ChatMessage>();
  history.forEach((m) => map.set(m.id, m));
  incoming.forEach((m) => map.set(m.id, m));
  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function useStompChat(
  lessonId: number | null,
  token: string | null,
  initialMessages?: ChatMessage[],
  senderMeta?: {
    senderId?: number;
    senderName?: string;
    senderRole?: "TEACHER" | "STUDENT";
  }
): UseStompChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [sendChatMessage] = useSendChatMessageMutation();
  const subsRef = useRef<StompSubscription[]>([]);
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const prevLessonIdRef = useRef<number | null>(null);
  const optimisticIdRef = useRef(0);

  /** Khi đổi buổi học: xóa state. Khi history REST tải xong: merge với tin realtime (theo id). */
  useEffect(() => {
    if (lessonId !== prevLessonIdRef.current) {
      prevLessonIdRef.current = lessonId;
      setMessages([]);
    }
  }, [lessonId]);

  useEffect(() => {
    if (!lessonId) return;
    if (initialMessages === undefined) return;
    const hist = initialMessages.filter(
      (m) => Number(m.lessonId) === Number(lessonId)
    );
    setMessages((prev) => {
      const live = prev.filter(
        (m) => Number(m.lessonId) === Number(lessonId)
      );
      return mergeChatMessages(hist, live);
    });
  }, [lessonId, initialMessages]);

  useEffect(() => {
    if (!lessonId || !token) return;

    const client = getStompClient(token);
    let cancelled = false;
    let subscribed = false;
    let connectRetryTimer: ReturnType<typeof setTimeout> | null = null;

    const subscribe = () => {
      if (subscribed || cancelled) return;
      subscribed = true;
      setIsConnected(true);

      const chatSub = client.subscribe(
        `/topic/room/${lessonId}/chat`,
        (frame: IMessage) => {
          try {
            const raw = JSON.parse(frame.body) as Record<string, unknown>;
            const msg = normalizeIncomingChat(raw);
            setMessages((prev) => {
              const withoutMatchingOptimistic = prev.filter(
                (m) =>
                  !(
                    m.id < 0 &&
                    Number(m.lessonId) === Number(msg.lessonId) &&
                    Number(m.senderId) === Number(msg.senderId) &&
                    m.content === msg.content &&
                    (m.fileUrl ?? null) === (msg.fileUrl ?? null)
                  )
              );
              if (withoutMatchingOptimistic.some((m) => m.id === msg.id)) {
                return withoutMatchingOptimistic;
              }
              return [...withoutMatchingOptimistic, msg];
            });
          } catch (err) {
            console.error("[StompChat] Failed to parse chat message:", err, frame.body);
          }
        }
      );

      const typingSub = client.subscribe(
        `/topic/room/${lessonId}/typing`,
        (frame: IMessage) => {
          const status: TypingStatus = JSON.parse(frame.body);
          handleTypingStatus(status);
        }
      );

      const reactionSub = client.subscribe(
        `/topic/room/${lessonId}/reactions`,
        (frame: IMessage) => {
          const updated = normalizeIncomingChat(
            JSON.parse(frame.body) as Record<string, unknown>
          );
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
        }
      );

      const seenSub = client.subscribe(
        `/topic/room/${lessonId}/seen`,
        (_frame: IMessage) => {
          // Could update seen indicators per-message if needed
        }
      );

      subsRef.current = [chatSub, typingSub, reactionSub, seenSub];
    };

    const waitUntilConnected = () => {
      if (cancelled) return;
      if (client.connected) {
        subscribe();
        return;
      }
      connectRetryTimer = setTimeout(waitUntilConnected, 150);
    };

    waitUntilConnected();

    return () => {
      cancelled = true;
      if (connectRetryTimer) clearTimeout(connectRetryTimer);
      setIsConnected(false);
      subsRef.current.forEach((s) => {
        try { s.unsubscribe(); } catch { /* ignore */ }
      });
      subsRef.current = [];
      typingTimeoutsRef.current.forEach((t) => clearTimeout(t));
      typingTimeoutsRef.current.clear();
    };
  }, [lessonId, token]);

  const handleTypingStatus = useCallback((status: TypingStatus) => {
    if (status.isTyping) {
      setTypingUsers((prev) => {
        const exists = prev.some((t) => t.userId === status.userId);
        return exists ? prev : [...prev, status];
      });

      const existing = typingTimeoutsRef.current.get(status.userId);
      if (existing) clearTimeout(existing);

      const timeout = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((t) => t.userId !== status.userId));
        typingTimeoutsRef.current.delete(status.userId);
      }, 4000);
      typingTimeoutsRef.current.set(status.userId, timeout);
    } else {
      setTypingUsers((prev) => prev.filter((t) => t.userId !== status.userId));
      const existing = typingTimeoutsRef.current.get(status.userId);
      if (existing) {
        clearTimeout(existing);
        typingTimeoutsRef.current.delete(status.userId);
      }
    }
  }, []);

  const sendMessage = useCallback(
    (content: string, type = "TEXT", fileUrl?: string) => {
      if (!lessonId || !token) return;
      const sid = senderMeta?.senderId;
      const role = senderMeta?.senderRole ?? "STUDENT";
      const name = senderMeta?.senderName ?? "User";
      const msgType = type as ChatMessage["type"];

      if (sid && sid > 0) {
        optimisticIdRef.current -= 1;
        const tempId = optimisticIdRef.current;
        setMessages((prev) => [
          ...prev,
          {
            id: tempId,
            lessonId,
            senderId: sid,
            senderName: name,
            senderRole: role,
            type: msgType,
            content,
            fileUrl: fileUrl ?? null,
            reactions: "{}",
            seenBy: "",
            createdAt: new Date().toISOString(),
          },
        ]);
      }

      void sendChatMessage({
        lessonId,
        content,
        type,
        fileUrl: fileUrl ?? null,
        senderName: senderMeta?.senderName,
      })
        .unwrap()
        .then((saved) => {
          const msg = fromRestMessage(saved);
          setMessages((prev) => {
            const withoutMatchingOptimistic = prev.filter(
              (m) =>
                !(
                  m.id < 0 &&
                  Number(m.lessonId) === Number(msg.lessonId) &&
                  Number(m.senderId) === Number(msg.senderId) &&
                  m.content === msg.content &&
                  (m.fileUrl ?? null) === (msg.fileUrl ?? null)
                )
            );
            if (withoutMatchingOptimistic.some((m) => m.id === msg.id)) {
              return withoutMatchingOptimistic;
            }
            return [...withoutMatchingOptimistic, msg];
          });
        })
        .catch((err) => {
          console.error("[StompChat] POST /lessons/.../chat/send failed:", err);
          const apiMessage = extractApiErrorMessage(err);
          toast.error(apiMessage ?? "Không gửi được tin nhắn. Kiểm tra mạng hoặc thử lại.");
          setMessages((prev) =>
            prev.filter(
              (m) =>
                !(
                  m.id < 0 &&
                  Number(m.lessonId) === Number(lessonId) &&
                  sid != null &&
                  sid > 0 &&
                  Number(m.senderId) === Number(sid) &&
                  m.content === content
                )
            )
          );
        });
    },
    [
      lessonId,
      token,
      senderMeta?.senderId,
      senderMeta?.senderName,
      senderMeta?.senderRole,
      sendChatMessage,
    ]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!lessonId || !token) return;
      const client = getStompClient(token);
      if (!client.connected) return;

      client.publish({
        destination: `/app/chat/${lessonId}/typing`,
        body: JSON.stringify({ isTyping }),
        headers: STOMP_JSON_HEADERS,
      });
    },
    [lessonId, token]
  );

  const sendReaction = useCallback(
    (messageId: number, emoji: string) => {
      if (!lessonId || !token) return;
      const client = getStompClient(token);
      if (!client.connected) return;

      client.publish({
        destination: `/app/chat/${lessonId}/react`,
        body: JSON.stringify({ messageId, emoji }),
        headers: STOMP_JSON_HEADERS,
      });
    },
    [lessonId, token]
  );

  const markSeen = useCallback(() => {
    if (!lessonId || !token) return;
    const client = getStompClient(token);
    if (!client.connected) return;

    client.publish({
      destination: `/app/chat/${lessonId}/seen`,
      body: "{}",
      headers: STOMP_JSON_HEADERS,
    });
  }, [lessonId, token]);

  return {
    messages,
    typingUsers,
    sendMessage,
    sendTyping,
    sendReaction,
    markSeen,
    isConnected,
  };
}
