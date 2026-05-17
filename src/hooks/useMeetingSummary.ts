"use client";

import { useState, useCallback, useEffect } from "react";
import { API_CONFIG } from "@/config/api";
import { useAuth } from "@/store/hooks";

export interface TranscriptSegment {
  speakerRole: "TEACHER" | "STUDENT";
  speakerName?: string;
  content: string;
  startTimeMs?: number;
  endTimeMs?: number;
}

export interface MeetingSummaryResult {
  id: number;
  sessionId: number;
  sessionType: string;
  summary: string;
  keyPoints: string[];
  actionItems: ActionItem[];
  language: string;
  totalDurationSeconds?: number;
  totalWords?: number;
  modelUsed?: string;
  processingTimeMs?: number;
  errorMessage?: string | null;
  isMock?: boolean;
  status: string;
  createdAt: string;
  completedAt?: string;
}

export interface ActionItem {
  task: string;
  assignee: "TEACHER" | "STUDENT" | "BOTH";
  deadline?: string;
  completed?: boolean;
}

export interface AiSummarySettings {
  enabled: boolean;
  language: string;
}

interface UseMeetingSummaryReturn {
  summary: MeetingSummaryResult | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  settings: AiSummarySettings;
  isSummaryEnabled: boolean;
  shouldGenerateSummary: boolean;
  saveTranscript: (segment: TranscriptSegment) => Promise<void>;
  saveBulkTranscripts: (segments: TranscriptSegment[]) => Promise<void>;
  generateSummary: (sessionId: number, sessionType: string, language?: string) => Promise<MeetingSummaryResult | null>;
  getSummary: (sessionId: number, sessionType: string) => Promise<MeetingSummaryResult | null>;
  getBookingSummary: (bookingId: number) => Promise<MeetingSummaryResult | null>;
  toggleActionItem: (summaryId: number, itemIndex: number) => Promise<MeetingSummaryResult | null>;
  toggleAiSummary: (enabled: boolean) => Promise<void>;
  setAiSummaryLanguage: (language: string) => Promise<void>;
  loadSettings: () => Promise<void>;
  clearSummary: () => void;
}

export function useMeetingSummary(): UseMeetingSummaryReturn {
  const { accessToken } = useAuth();
  const [summary, setSummary] = useState<MeetingSummaryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AiSummarySettings>({ enabled: true, language: "vi" });
  const [hasAttemptedGeneration, setHasAttemptedGeneration] = useState(false);

  // Check if AI summary should be generated based on settings
  const isSummaryEnabled = settings.enabled;
  const shouldGenerateSummary =
    isSummaryEnabled && summary === null && !hasAttemptedGeneration && !isGenerating;

  const normalizeSummary = useCallback((data: any): MeetingSummaryResult => ({
    ...data,
    keyPoints: Array.isArray(data?.keyPoints) ? data.keyPoints : [],
    actionItems: Array.isArray(data?.actionItems) ? data.actionItems : [],
    isMock: Boolean(data?.isMock),
    errorMessage: data?.errorMessage ?? null,
  }), []);

  const saveTranscript = useCallback(async (segment: TranscriptSegment) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/transcripts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(segment),
      });

      if (!response.ok) {
        throw new Error("Failed to save transcript");
      }
    } catch (err) {
      console.error("[MeetingSummary] Failed to save transcript:", err);
    }
  }, [accessToken]);

  const saveBulkTranscripts = useCallback(async (segments: TranscriptSegment[]) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/transcripts/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(segments),
      });

      if (!response.ok) {
        throw new Error("Failed to save transcripts");
      }
    } catch (err) {
      console.error("[MeetingSummary] Failed to save bulk transcripts:", err);
    }
  }, [accessToken]);

  const generateSummary = useCallback(async (
    sessionId: number,
    sessionType: string,
    language = "vi"
  ): Promise<MeetingSummaryResult | null> => {
    setHasAttemptedGeneration(true);
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/summaries/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ sessionId, sessionType, language }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to generate summary");
      }

      const data = await response.json();
      const result = normalizeSummary(data);
      setSummary(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("[MeetingSummary] Failed to generate summary:", err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [accessToken, normalizeSummary]);

  const getSummary = useCallback(async (
    sessionId: number,
    sessionType: string
  ): Promise<MeetingSummaryResult | null> => {
    setHasAttemptedGeneration(true);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/summaries/session/${sessionId}?sessionType=${sessionType}`,
        {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        }
      );

      if (response.status === 404) {
        setSummary(null);
        return null;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch summary");
      }

      const data = await response.json();
      const result = normalizeSummary(data);
      setSummary(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("[MeetingSummary] Failed to fetch summary:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, normalizeSummary]);

  const toggleActionItem = useCallback(async (
    summaryId: number,
    itemIndex: number
  ): Promise<MeetingSummaryResult | null> => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/summaries/${summaryId}/action-items/${itemIndex}/toggle`,
        {
          method: "PATCH",
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to update action item");
      }

      const data = await response.json();
      const updated = normalizeSummary(data);
      setSummary(updated);
      setError(null);
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("[MeetingSummary] Failed to toggle action item:", err);
      return null;
    }
  }, [accessToken, normalizeSummary]);

  const getBookingSummary = useCallback(async (
    bookingId: number
  ): Promise<MeetingSummaryResult | null> => {
    setHasAttemptedGeneration(true);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/summaries/booking/${bookingId}`,
        {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        }
      );

      if (response.status === 404) {
        setSummary(null);
        return null;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch summary");
      }

      const data = await response.json();
      const result = normalizeSummary(data);
      setSummary(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("[MeetingSummary] Failed to fetch booking summary:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, normalizeSummary]);

  // Load AI summary settings from backend
  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/users/me/preferences/ai-summary/status`,
        {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        }
      );

      if (response.ok) {
        const data = await response.json();
        const settingsData = data?.data ?? data;
        if (settingsData && typeof settingsData === "object") {
          setSettings({
            enabled: settingsData.enabled ?? true,
            language: settingsData.language ?? "vi",
          });
        }
      }
    } catch (err) {
      console.error("[MeetingSummary] Failed to load settings:", err);
    }
  }, [accessToken]);

  // Toggle AI summary on/off
  const toggleAiSummary = useCallback(async (enabled: boolean) => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/users/me/preferences/ai-summary/toggle?enabled=${enabled}`,
        {
          method: "POST",
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        }
      );

      if (response.ok) {
        setSettings((prev) => ({ ...prev, enabled }));
      }
    } catch (err) {
      console.error("[MeetingSummary] Failed to toggle AI summary:", err);
    }
  }, [accessToken]);

  // Set AI summary language
  const setAiSummaryLanguage = useCallback(async (language: string) => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/users/me/preferences/ai-summary/language?language=${language}`,
        {
          method: "POST",
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        }
      );

      if (response.ok) {
        setSettings((prev) => ({ ...prev, language }));
      }
    } catch (err) {
      console.error("[MeetingSummary] Failed to set language:", err);
    }
  }, [accessToken]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const clearSummary = useCallback(() => {
    setSummary(null);
    setError(null);
    setHasAttemptedGeneration(false);
  }, []);

  return {
    summary,
    isLoading,
    isGenerating,
    error,
    settings,
    isSummaryEnabled: settings.enabled,
    shouldGenerateSummary,
    saveTranscript,
    saveBulkTranscripts,
    generateSummary,
    getSummary,
    getBookingSummary,
    toggleActionItem,
    toggleAiSummary,
    setAiSummaryLanguage,
    loadSettings,
    clearSummary,
  };
}
