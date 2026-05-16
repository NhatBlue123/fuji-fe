"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { IMessage } from "@stomp/stompjs";
import { API_CONFIG } from "@/config/api";
import { subscribeStomp } from "@/lib/stomp";
import { isLikelyTranscriptNoise } from "@/lib/transcriptFilters";

export interface LessonTranscriptItem {
  id?: number | null;
  sessionId: number;
  sessionType: string;
  speakerId?: number | null;
  speakerRole?: "TEACHER" | "STUDENT" | string;
  speakerName?: string | null;
  content: string;
  source?: string | null;
  startTimeMs?: number | null;
  endTimeMs?: number | null;
  confidence?: number | null;
  createdAt?: string | null;
}

function normalizeTranscript(raw: Record<string, unknown>): LessonTranscriptItem | null {
  const content = typeof raw.content === "string" ? raw.content.trim() : "";
  const sessionId = Number(raw.sessionId);
  if (!content || !Number.isFinite(sessionId)) return null;
  const confidence = raw.confidence == null ? null : Number(raw.confidence);
  if (
    isLikelyTranscriptNoise(content, {
      languageConfidence: Number.isFinite(confidence) ? confidence : null,
      source: "stomp",
    })
  ) {
    return null;
  }

  return {
    id: raw.id == null ? null : Number(raw.id),
    sessionId,
    sessionType: typeof raw.sessionType === "string" ? raw.sessionType : "BOOKING",
    speakerId: raw.speakerId == null ? null : Number(raw.speakerId),
    speakerRole: typeof raw.speakerRole === "string" ? raw.speakerRole : undefined,
    speakerName: typeof raw.speakerName === "string" ? raw.speakerName : null,
    content,
    source: typeof raw.source === "string" ? raw.source : null,
    startTimeMs: raw.startTimeMs == null ? null : Number(raw.startTimeMs),
    endTimeMs: raw.endTimeMs == null ? null : Number(raw.endTimeMs),
    confidence,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : null,
  };
}

function transcriptKey(item: LessonTranscriptItem): string {
  if (item.id) return `id:${item.id}`;
  return [
    item.sessionId,
    item.speakerId ?? "",
    item.startTimeMs ?? "",
    item.endTimeMs ?? "",
    item.content,
  ].join("|");
}

function sortTranscripts(items: LessonTranscriptItem[]): LessonTranscriptItem[] {
  return [...items].sort((a, b) => {
    const aDate = a.createdAt ? Date.parse(a.createdAt) : Number.NaN;
    const bDate = b.createdAt ? Date.parse(b.createdAt) : Number.NaN;
    const aTime = Number.isFinite(aDate) ? aDate : a.startTimeMs ?? 0;
    const bTime = Number.isFinite(bDate) ? bDate : b.startTimeMs ?? 0;
    return aTime - bTime;
  });
}

function mergeTranscriptLists(
  current: LessonTranscriptItem[],
  incoming: LessonTranscriptItem[]
): LessonTranscriptItem[] {
  const map = new Map<string, LessonTranscriptItem>();
  current.forEach((item) => map.set(transcriptKey(item), item));
  incoming.forEach((item) => map.set(transcriptKey(item), item));
  return sortTranscripts(Array.from(map.values()));
}

export function useLessonTranscript(lessonId: number | null, token: string | null) {
  const [transcripts, setTranscripts] = useState<LessonTranscriptItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTranscripts = useCallback(async () => {
    if (!lessonId || !token) {
      setTranscripts([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_CONFIG.BASE_URL}/transcripts/session/${lessonId}?sessionType=BOOKING&source=VOICE`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const body = await res.json();
      const normalized = Array.isArray(body)
        ? body
            .map((item) => normalizeTranscript(item as Record<string, unknown>))
            .filter((item): item is LessonTranscriptItem => Boolean(item))
        : [];
      setTranscripts(sortTranscripts(normalized));
    } catch (err) {
      console.warn("[LessonTranscript] Failed to load transcripts:", err);
      setError("Không tải được transcript.");
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, token]);

  useEffect(() => {
    void loadTranscripts();
  }, [loadTranscripts]);

  useEffect(() => {
    if (!lessonId || !token) return;

    return subscribeStomp(token, `/topic/room/${lessonId}/transcript`, (frame: IMessage) => {
      try {
        const parsed = JSON.parse(frame.body) as Record<string, unknown>;
        const transcript = normalizeTranscript(parsed);
        if (!transcript) return;
        setTranscripts((current) => mergeTranscriptLists(current, [transcript]));
      } catch (err) {
        console.warn("[LessonTranscript] Failed to parse transcript event:", err);
      }
    });
  }, [lessonId, token]);

  return useMemo(
    () => ({
      transcripts,
      isLoading,
      error,
      refetch: loadTranscripts,
    }),
    [transcripts, isLoading, error, loadTranscripts]
  );
}
