"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_CONFIG } from "@/config/api";
import {
  createTranscriptLanguageContext,
  evaluateTranscriptCandidate,
  recordAcceptedTranscriptLanguage,
  type TranscriptLanguageCode,
  type TranscriptLanguageContext,
  type TranscriptLanguagePolicy,
  type TranscriptNoiseOptions,
} from "@/lib/transcriptFilters";

const MIN_FINAL_TRANSCRIPT_CHARS = 4;
const RESTART_DELAY_MS = 450;
const NETWORK_RETRY_DELAY_MS = 1500;

export type VoiceTranscriptStatus =
  | "idle"
  | "connecting"
  | "active"
  | "reconnecting"
  | "stopped"
  | "error";

export type VoiceTranscriptLanguage = "vi" | "ja" | "en";

interface UseVoiceTranscriptOptions {
  lessonId: number | null;
  role: "TEACHER" | "STUDENT";
  userId: number;
  userName: string;
  accessToken: string | null;
  isMicOn: boolean;
  enabled?: boolean;
  classroomTopic?: string | null;
  language?: VoiceTranscriptLanguage;
  transcriptLanguagePolicy?: TranscriptLanguagePolicy;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence?: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike {
  error?: string;
  message?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const BROWSER_LANGUAGE: Record<
  VoiceTranscriptLanguage,
  {
    browserLang: string;
    filterLang: TranscriptLanguageCode;
    finalConfidence: number;
    interimConfidence: number;
    classroomMode: NonNullable<TranscriptLanguagePolicy["classroomMode"]>;
  }
> = {
  vi: {
    browserLang: "vi-VN",
    filterLang: "vi",
    finalConfidence: 0.86,
    interimConfidence: 0.74,
    classroomMode: "vietnamese",
  },
  ja: {
    browserLang: "ja-JP",
    filterLang: "ja",
    finalConfidence: 0.86,
    interimConfidence: 0.74,
    classroomMode: "japanese",
  },
  en: {
    browserLang: "en-US",
    filterLang: "en",
    finalConfidence: 0.86,
    interimConfidence: 0.74,
    classroomMode: "english",
  },
};

function getBrowserSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function normalizeSpeechText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeForDuplicate(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function useVoiceTranscript({
  lessonId,
  role,
  userId,
  userName,
  accessToken,
  isMicOn,
  enabled = true,
  classroomTopic = null,
  language = "vi",
  transcriptLanguagePolicy,
}: UseVoiceTranscriptOptions) {
  const [status, setStatus] = useState<VoiceTranscriptStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [partialTranscript, setPartialTranscript] = useState("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldRunRef = useRef(false);
  const stoppingRef = useRef(false);
  const sessionStartMsRef = useRef(0);
  const turnStartMsRef = useRef(0);
  const activeBrowserLangRef = useRef<string | null>(null);
  const lastInterimRef = useRef("");
  const lastSavedTranscriptRef = useRef("");
  const lastSavedAtRef = useRef(0);

  const activeLanguage = BROWSER_LANGUAGE[language] ?? BROWSER_LANGUAGE.vi;
  const languagePolicy = useMemo<TranscriptLanguagePolicy>(
    () => ({
      primaryLanguage: activeLanguage.filterLang,
      classroomMode: activeLanguage.classroomMode,
      priorityLanguages:
        activeLanguage.filterLang === "ja"
          ? ["ja", "vi", "en"]
          : activeLanguage.filterLang === "en"
            ? ["en", "vi", "ja"]
            : ["vi", "ja", "en"],
      classroomTopic,
      ...transcriptLanguagePolicy,
    }),
    [activeLanguage.classroomMode, activeLanguage.filterLang, classroomTopic, transcriptLanguagePolicy],
  );
  const languageContextRef = useRef<TranscriptLanguageContext>(
    createTranscriptLanguageContext(languagePolicy),
  );

  useEffect(() => {
    languageContextRef.current = createTranscriptLanguageContext(languagePolicy);
  }, [languagePolicy, lessonId]);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const saveTranscriptSegment = useCallback(
    async (content: string, startTimeMs: number, confidence?: number | null) => {
      if (!lessonId || !accessToken || !content.trim()) return;

      try {
        await fetch(`${API_CONFIG.BASE_URL}/transcripts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            sessionId: lessonId,
            sessionType: "BOOKING",
            speakerId: userId,
            speakerRole: role,
            speakerName: userName,
            content: content.trim(),
            source: "VOICE",
            startTimeMs,
            confidence: confidence ?? undefined,
          }),
        });
      } catch (err) {
        console.warn("[VoiceTranscript] Failed to save segment:", err);
      }
    },
    [lessonId, accessToken, userId, role, userName],
  );

  const handleFinalTranscript = useCallback(
    (rawTranscript: string, options: TranscriptNoiseOptions = {}) => {
      const trimmedTranscript = normalizeSpeechText(rawTranscript);
      if (trimmedTranscript.length < MIN_FINAL_TRANSCRIPT_CHARS) {
        setPartialTranscript("");
        lastInterimRef.current = "";
        return;
      }

      const decision = evaluateTranscriptCandidate(
        trimmedTranscript,
        {
          ...options,
          isFinal: true,
          languagePolicy,
        },
        languageContextRef.current,
      );
      if (!decision.accepted) {
        if (process.env.NODE_ENV === "development") {
          console.debug("[VoiceTranscript] Ignored transcript:", decision.reason, trimmedTranscript);
        }
        return;
      }

      const cleanTranscript = decision.text;
      const normalizedFinal = normalizeForDuplicate(cleanTranscript);
      const now = Date.now();
      if (
        normalizedFinal === lastSavedTranscriptRef.current &&
        now - lastSavedAtRef.current < 10_000
      ) {
        return;
      }

      const startTimeMs = Math.max(0, (turnStartMsRef.current || now) - sessionStartMsRef.current);
      setPartialTranscript("");
      lastInterimRef.current = "";
      void saveTranscriptSegment(cleanTranscript, startTimeMs, decision.confidence);
      recordAcceptedTranscriptLanguage(languageContextRef.current, decision);
      lastSavedTranscriptRef.current = normalizedFinal;
      lastSavedAtRef.current = now;
      turnStartMsRef.current = now;
    },
    [languagePolicy, saveTranscriptSegment],
  );

  const flushInterimTranscript = useCallback(() => {
    const pending = normalizeSpeechText(lastInterimRef.current);
    if (!pending) return;
    handleFinalTranscript(pending, {
      languageCode: activeLanguage.filterLang,
      languageConfidence: activeLanguage.interimConfidence,
      source: "browser",
      languagePolicy,
    });
  }, [activeLanguage.filterLang, activeLanguage.interimConfidence, handleFinalTranscript, languagePolicy]);

  const stopRecognition = useCallback((flushPending = true) => {
    clearRestartTimer();
    if (flushPending) {
      flushInterimTranscript();
    }

    const recognition = recognitionRef.current;
    if (!recognition) return;

    recognition.onstart = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    try { recognition.stop(); } catch { /* ignore */ }
    try { recognition.abort(); } catch { /* ignore */ }
    recognitionRef.current = null;
    activeBrowserLangRef.current = null;
  }, [clearRestartTimer, flushInterimTranscript]);

  const scheduleRestart = useCallback((delayMs = RESTART_DELAY_MS) => {
    clearRestartTimer();
    restartTimerRef.current = setTimeout(() => {
      restartTimerRef.current = null;
      if (!shouldRunRef.current || stoppingRef.current) return;
      startRecognition();
    }, delayMs);
    // startRecognition is a function declaration below and is available when the timer runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearRestartTimer]);

  function startRecognition(): boolean {
    if (!enabled || !lessonId || !accessToken || !isMicOn) return false;
    if (recognitionRef.current) return true;

    const SpeechRecognition = getBrowserSpeechRecognition();
    if (!SpeechRecognition) {
      setStatus("error");
      setError("Trình duyệt chưa hỗ trợ SpeechRecognition realtime. Vui lòng dùng Chrome hoặc Edge.");
      return false;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = activeLanguage.browserLang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      recognitionRef.current = recognition;
      activeBrowserLangRef.current = activeLanguage.browserLang;
      sessionStartMsRef.current = sessionStartMsRef.current || Date.now();
      turnStartMsRef.current = Date.now();
      setStatus("active");
      setError(null);
    };

    recognition.onresult = (event) => {
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = normalizeSpeechText(result[0]?.transcript ?? "");
        if (!transcript) continue;

        if (result.isFinal) {
          handleFinalTranscript(transcript, {
            languageCode: activeLanguage.filterLang,
            languageConfidence: result[0]?.confidence ?? activeLanguage.finalConfidence,
            source: "browser",
            languagePolicy,
          });
        } else {
          interim = normalizeSpeechText(`${interim} ${transcript}`);
        }
      }

      if (!interim) return;

      const decision = evaluateTranscriptCandidate(
        interim,
        {
          languageCode: activeLanguage.filterLang,
          languageConfidence: activeLanguage.interimConfidence,
          source: "browser",
          isFinal: false,
          languagePolicy,
        },
        languageContextRef.current,
      );

      if (decision.accepted) {
        lastInterimRef.current = decision.text;
        setPartialTranscript(decision.text);
      }
    };

    recognition.onerror = (event) => {
      const code = event.error ?? "unknown";
      if (code === "no-speech" || code === "aborted") return;

      console.warn("[VoiceTranscript] Browser SpeechRecognition error:", event);
      setPartialTranscript("");

      if (code === "not-allowed" || code === "service-not-allowed") {
        shouldRunRef.current = false;
        setStatus("error");
        setError("Không thể dùng SpeechRecognition. Hãy kiểm tra quyền microphone và trình duyệt Chrome/Edge.");
        return;
      }

      setStatus("reconnecting");
      setError(code === "network" ? "SpeechRecognition lỗi mạng, đang thử kết nối lại." : `SpeechRecognition error: ${code}`);
      scheduleRestart(code === "network" ? NETWORK_RETRY_DELAY_MS : RESTART_DELAY_MS);
      try { recognition.abort(); } catch { /* ignore */ }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      activeBrowserLangRef.current = null;
      if (!shouldRunRef.current || stoppingRef.current) {
        if (!stoppingRef.current) setStatus("stopped");
        return;
      }

      setStatus("reconnecting");
      scheduleRestart(RESTART_DELAY_MS);
    };

    try {
      setStatus("connecting");
      recognition.start();
      recognitionRef.current = recognition;
      return true;
    } catch (err) {
      recognitionRef.current = null;
      activeBrowserLangRef.current = null;
      console.warn("[VoiceTranscript] Failed to start browser SpeechRecognition:", err);
      setStatus("reconnecting");
      setError("Không thể khởi động SpeechRecognition, đang thử lại.");
      scheduleRestart(NETWORK_RETRY_DELAY_MS);
      return false;
    }
  }

  const stopAll = useCallback((flushPending = true) => {
    stoppingRef.current = true;
    shouldRunRef.current = false;
    stopRecognition(flushPending);
    lastInterimRef.current = "";
    setPartialTranscript("");
    setStatus("stopped");
  }, [stopRecognition]);

  useEffect(() => {
    if (!enabled || !lessonId || !accessToken || !isMicOn) {
      stopAll(true);
      return;
    }

    stoppingRef.current = false;
    shouldRunRef.current = true;
    sessionStartMsRef.current = sessionStartMsRef.current || Date.now();

    if (
      recognitionRef.current &&
      activeBrowserLangRef.current &&
      activeBrowserLangRef.current !== activeLanguage.browserLang
    ) {
      setStatus("reconnecting");
      stopRecognition(true);
      scheduleRestart(150);
      return;
    }

    void startRecognition();

    return () => {
      stopAll(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enabled,
    lessonId,
    accessToken,
    isMicOn,
    activeLanguage.browserLang,
    activeLanguage.filterLang,
    stopAll,
  ]);

  return {
    status,
    error,
    partialTranscript,
    language,
  };
}
