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

export function useStompChat(
  lessonId: number | null,
  token: string | null,
  initialMessages?: ChatMessage[]
): UseStompChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages ?? []);
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const subsRef = useRef<StompSubscription[]>([]);
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!lessonId || !token) return;

    const client = getStompClient(token);

    const waitForConnect = () => {
      if (client.connected) {
        subscribe();
        return;
      }
      client.onConnect = () => {
        setIsConnected(true);
        subscribe();
      };
      client.onDisconnect = () => setIsConnected(false);
    };

    const subscribe = () => {
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
    };

    waitForConnect();

    return () => {
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
      if (!client.connected) return;

      client.publish({
        destination: `/app/chat/${lessonId}/send`,
        body: JSON.stringify({ content, type, fileUrl: fileUrl ?? null }),
      });
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
