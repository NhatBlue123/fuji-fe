"use client";

/**
 * useTranscriptSync
 *
 * Tự động lưu chat messages TEXT vào meeting_transcripts mỗi khi có tin nhắn mới.
 * Điều này đảm bảo AI Summary có dữ liệu để tạo summary sau buổi học.
 *
 * Strategy: dùng chat messages làm transcript source (không cần AssemblyAI speech-to-text).
 * Chỉ sync tin nhắn TEXT (bỏ FILE, VOCABULARY, SYSTEM).
 */

import { useEffect, useRef, useCallback } from "react";
import { API_CONFIG } from "@/config/api";
import type { ChatMessage } from "@/hooks/useStompChat";

interface UseTranscriptSyncOptions {
  /** lessonId (TeachingSession.id) — dùng làm sessionId trong transcript */
  lessonId: number | null;
  /** role của người dùng hiện tại */
  role: "TEACHER" | "STUDENT";
  /** userId hiện tại */
  userId: number;
  /** fullName của người dùng */
  userName: string;
  /** Bearer token */
  accessToken: string | null;
  /** Có bật tính năng này không (theo AI Summary settings) */
  enabled?: boolean;
}

/**
 * Lưu một transcript segment lên server, fire-and-forget (không throw).
 */
async function postTranscript(
  accessToken: string,
  payload: {
    sessionId: number;
    sessionType: string;
    speakerId: number;
    speakerRole: string;
    speakerName: string;
    content: string;
    startTimeMs?: number;
  }
): Promise<void> {
  try {
    await fetch(`${API_CONFIG.BASE_URL}/transcripts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Lỗi mạng không nên làm ảnh hưởng trải nghiệm buổi học
    console.warn("[TranscriptSync] Failed to save transcript:", err);
  }
}

export function useTranscriptSync(
  messages: ChatMessage[],
  {
    lessonId,
    role,
    userId,
    userName,
    accessToken,
    enabled = true,
  }: UseTranscriptSyncOptions
) {
  /**
   * Set chứa id của những tin nhắn đã được sync lên server.
   * Dùng ref thay state để không trigger re-render.
   */
  const syncedIdsRef = useRef<Set<number>>(new Set());

  /**
   * Thời điểm buổi học bắt đầu (mount của hook) — để tính startTimeMs tương đối.
   */
  const sessionStartMs = useRef<number>(Date.now());

  const syncMessage = useCallback(
    async (msg: ChatMessage) => {
      if (!lessonId || !accessToken || !enabled) return;

      // Chỉ sync TEXT messages có nội dung thật
      if (msg.type !== "TEXT") return;
      if (!msg.content || !msg.content.trim()) return;

      // Bỏ optimistic messages (id âm) — chờ server confirm
      if (msg.id < 0) return;

      // Đã sync rồi thì bỏ qua
      if (syncedIdsRef.current.has(msg.id)) return;

      // Đánh dấu là đang sync (trước khi await) để tránh duplicate call
      syncedIdsRef.current.add(msg.id);

      const msgTimeMs = new Date(msg.createdAt).getTime();
      const startTimeMs = Math.max(0, msgTimeMs - sessionStartMs.current);

      await postTranscript(accessToken, {
        sessionId: lessonId,
        sessionType: "BOOKING",
        speakerId: msg.senderId,
        speakerRole: msg.senderRole,
        speakerName: msg.senderName || userName,
        content: msg.content.trim(),
        startTimeMs,
      });
    },
    [lessonId, accessToken, enabled, userName]
  );

  useEffect(() => {
    if (!enabled || !lessonId || !accessToken) return;

    // Duyệt qua tất cả messages hiện tại — sync những cái chưa được sync
    for (const msg of messages) {
      void syncMessage(msg);
    }
  }, [messages, syncMessage, enabled, lessonId, accessToken]);

  /**
   * Bulk sync toàn bộ messages khi kết thúc buổi học (gọi trước endLesson).
   * Đảm bảo không bỏ sót tin nào dù hook chưa kịp sync trong realtime.
   */
  const flushAll = useCallback(
    async (allMessages: ChatMessage[]) => {
      if (!lessonId || !accessToken || !enabled) return;

      const pending = allMessages.filter(
        (m) =>
          m.type === "TEXT" &&
          m.content?.trim() &&
          m.id > 0 &&
          !syncedIdsRef.current.has(m.id)
      );

      if (pending.length === 0) return;

      // Bulk save
      try {
        const body = pending.map((msg) => {
          const msgTimeMs = new Date(msg.createdAt).getTime();
          return {
            sessionId: lessonId,
            sessionType: "BOOKING",
            speakerId: msg.senderId,
            speakerRole: msg.senderRole,
            speakerName: msg.senderName || userName,
            content: msg.content.trim(),
            startTimeMs: Math.max(0, msgTimeMs - sessionStartMs.current),
          };
        });

        await fetch(`${API_CONFIG.BASE_URL}/transcripts/bulk`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(body),
        });

        pending.forEach((m) => syncedIdsRef.current.add(m.id));
        console.info(`[TranscriptSync] Flushed ${pending.length} transcripts for session ${lessonId}`);
      } catch (err) {
        console.warn("[TranscriptSync] Bulk flush failed:", err);
      }
    },
    [lessonId, accessToken, enabled, userName]
  );

  return { flushAll };
}
