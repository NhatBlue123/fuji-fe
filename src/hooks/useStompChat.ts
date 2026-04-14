"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getStompClient } from "@/lib/stomp";
import type { IMessage, StompSubscription } from "@stomp/stompjs";

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
  initialMessages?: ChatMessage[]
): UseStompChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const subsRef = useRef<StompSubscription[]>([]);
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingPublishesRef = useRef<Array<{ destination: string; body: string }>>([]);
  const prevLessonIdRef = useRef<number | null>(null);

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
    const hist = initialMessages.filter((m) => m.lessonId === lessonId);
    setMessages((prev) => {
      const live = prev.filter((m) => m.lessonId === lessonId);
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
          const msg: ChatMessage = JSON.parse(frame.body);
          setMessages((prev) => [...prev, msg]);
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
          const updated: ChatMessage = JSON.parse(frame.body);
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

      if (pendingPublishesRef.current.length > 0) {
        const queue = [...pendingPublishesRef.current];
        pendingPublishesRef.current = [];
        queue.forEach((item) => {
          try {
            client.publish(item);
          } catch {
            pendingPublishesRef.current.push(item);
          }
        });
      }
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
      const client = getStompClient(token);
      const payload = {
        destination: `/app/chat/${lessonId}/send`,
        body: JSON.stringify({ content, type, fileUrl: fileUrl ?? null }),
      };
      if (client.connected) {
        client.publish(payload);
      } else {
        pendingPublishesRef.current.push(payload);
      }
    },
    [lessonId, token]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!lessonId || !token) return;
      const client = getStompClient(token);
      if (!client.connected) return;

      client.publish({
        destination: `/app/chat/${lessonId}/typing`,
        body: JSON.stringify({ isTyping }),
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
