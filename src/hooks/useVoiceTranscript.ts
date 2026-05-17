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
const ASSEMBLYAI_WS_URL = "wss://streaming.assemblyai.com/v3/ws";
const ASSEMBLYAI_SAMPLE_RATE = 16_000;
const ASSEMBLYAI_SPEECH_MODEL = process.env.NEXT_PUBLIC_ASSEMBLYAI_STREAMING_MODEL || "whisper-rt";
const ASSEMBLYAI_MAX_RECONNECT_ATTEMPTS = 2;
const ASSEMBLYAI_RECONNECT_DELAY_MS = 2000;
const VAD_START_THRESHOLD = 0.018;
const VAD_CONTINUE_THRESHOLD = 0.01;
const VAD_HANGOVER_CHUNKS = 12;
const AUTO_NO_RESULT_SWITCH_MS = 3500;

export type VoiceTranscriptStatus =
  | "idle"
  | "connecting"
  | "active"
  | "reconnecting"
  | "stopped"
  | "error";

export type VoiceTranscriptLanguage = "auto" | "vi" | "ja" | "en";
type ManualVoiceTranscriptLanguage = Exclude<VoiceTranscriptLanguage, "auto">;

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

interface AssemblyAiMessage {
  type?: string;
  id?: string;
  transcript?: string;
  utterance?: string;
  end_of_turn?: boolean;
  language_code?: string | null;
  language_confidence?: number | null;
  error?: string;
  message?: string;
  audio_duration_seconds?: number;
  session_duration_seconds?: number;
}

const BROWSER_LANGUAGE: Record<
  ManualVoiceTranscriptLanguage,
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

function nextAutoRecognitionLanguage(language: ManualVoiceTranscriptLanguage): ManualVoiceTranscriptLanguage {
  return language === "ja" ? "vi" : "ja";
}

function getBrowserSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function buildAssemblyAiUrl(token: string): string {
  const params = new URLSearchParams({
    token,
    sample_rate: String(ASSEMBLYAI_SAMPLE_RATE),
    encoding: "pcm_s16le",
    speech_model: ASSEMBLYAI_SPEECH_MODEL,
    format_turns: "true",
  });

  return `${ASSEMBLYAI_WS_URL}?${params.toString()}`;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err ?? "");
}

function calculateRms(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / samples.length);
}

function float32ToPCM16(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);

  for (let i = 0; i < float32Array.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  return buffer;
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
  language = "auto",
  transcriptLanguagePolicy,
}: UseVoiceTranscriptOptions) {
  const [status, setStatus] = useState<VoiceTranscriptStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [autoRecognitionLanguage, setAutoRecognitionLanguage] =
    useState<ManualVoiceTranscriptLanguage>("vi");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoNoResultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const assemblyReconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldRunRef = useRef(false);
  const stoppingRef = useRef(false);
  const providerRef = useRef<"browser" | "assemblyai" | null>(null);
  const assemblyReconnectAttemptsRef = useRef(0);
  const sessionStartMsRef = useRef(0);
  const turnStartMsRef = useRef(0);
  const activeBrowserLangRef = useRef<string | null>(null);
  const lastInterimRef = useRef("");
  const lastSavedTranscriptRef = useRef("");
  const lastSavedAtRef = useRef(0);
  const recognitionHadResultRef = useRef(false);

  const resolvedLanguage: ManualVoiceTranscriptLanguage =
    language === "auto" ? autoRecognitionLanguage : language;
  const activeLanguage = BROWSER_LANGUAGE[resolvedLanguage] ?? BROWSER_LANGUAGE.vi;
  const policyLanguage = language === "auto" ? BROWSER_LANGUAGE.vi : activeLanguage;
  const languagePolicy = useMemo<TranscriptLanguagePolicy>(
    () => ({
      primaryLanguage: policyLanguage.filterLang,
      classroomMode: language === "auto" ? "japanese" : activeLanguage.classroomMode,
      priorityLanguages:
        language === "auto"
          ? ["vi", "ja", "en"]
          : activeLanguage.filterLang === "ja"
          ? ["ja", "vi", "en"]
          : activeLanguage.filterLang === "en"
            ? ["en", "vi", "ja"]
            : ["vi", "ja", "en"],
      classroomTopic,
      ...transcriptLanguagePolicy,
    }),
    [
      activeLanguage.classroomMode,
      activeLanguage.filterLang,
      classroomTopic,
      language,
      policyLanguage.filterLang,
      transcriptLanguagePolicy,
    ],
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

  const clearAutoNoResultTimer = useCallback(() => {
    if (autoNoResultTimerRef.current) {
      clearTimeout(autoNoResultTimerRef.current);
      autoNoResultTimerRef.current = null;
    }
  }, []);

  const clearAssemblyReconnectTimer = useCallback(() => {
    if (assemblyReconnectTimerRef.current) {
      clearTimeout(assemblyReconnectTimerRef.current);
      assemblyReconnectTimerRef.current = null;
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

  const fetchAssemblyAiToken = useCallback(async (): Promise<string | null> => {
    if (!lessonId || !accessToken) return null;

    try {
      const res = await fetch(
        `${API_CONFIG.BASE_URL}/summaries/realtime-token?sessionId=${lessonId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      return typeof data?.token === "string" ? data.token : null;
    } catch (err) {
      console.warn("[VoiceTranscript] Failed to fetch AssemblyAI token:", err);
      return null;
    }
  }, [lessonId, accessToken]);

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
    clearAutoNoResultTimer();
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
  }, [clearAutoNoResultTimer, clearRestartTimer, flushInterimTranscript]);

  const cleanupAssemblyAudioResources = useCallback(() => {
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch { /* ignore */ }
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch { /* ignore */ }
      sourceRef.current = null;
    }
    if (audioCtxRef.current) {
      try { void audioCtxRef.current.close(); } catch { /* ignore */ }
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const stopAssemblyAi = useCallback(() => {
    clearAssemblyReconnectTimer();

    const ws = wsRef.current;
    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      if (ws.readyState === WebSocket.OPEN) {
        try { ws.send(JSON.stringify({ type: "Terminate" })); } catch { /* ignore */ }
      }
      try { ws.close(1000, "Transcript stopped"); } catch { /* ignore */ }
    }

    wsRef.current = null;
    assemblyReconnectAttemptsRef.current = 0;
    cleanupAssemblyAudioResources();
  }, [cleanupAssemblyAudioResources, clearAssemblyReconnectTimer]);

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

  async function startAssemblyAiFallback(reason: string): Promise<boolean> {
    if (!enabled || !lessonId || !accessToken || !isMicOn || !shouldRunRef.current) {
      return false;
    }

    stopRecognition(true);
    providerRef.current = "assemblyai";
    setStatus("connecting");
    setError(null);
    return connectAssemblyAi(reason);
  }

  async function startAssemblyAudio(ws: WebSocket): Promise<void> {
    cleanupAssemblyAudioResources();

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Trình duyệt không hỗ trợ lấy audio từ microphone.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: ASSEMBLYAI_SAMPLE_RATE,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    if (ws.readyState !== WebSocket.OPEN || stoppingRef.current || !shouldRunRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    streamRef.current = stream;
    const audioCtx = new AudioContext({ sampleRate: ASSEMBLYAI_SAMPLE_RATE });
    audioCtxRef.current = audioCtx;

    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    const source = audioCtx.createMediaStreamSource(stream);
    const processor = audioCtx.createScriptProcessor(1024, 1, 1);
    sourceRef.current = source;
    processorRef.current = processor;

    let speechHangoverChunks = 0;
    processor.onaudioprocess = (event) => {
      if (ws.readyState !== WebSocket.OPEN || stoppingRef.current || !shouldRunRef.current) return;

      const inputData = event.inputBuffer.getChannelData(0);
      const rms = calculateRms(inputData);
      const threshold = speechHangoverChunks > 0 ? VAD_CONTINUE_THRESHOLD : VAD_START_THRESHOLD;

      if (rms >= threshold) {
        speechHangoverChunks = VAD_HANGOVER_CHUNKS;
      } else if (speechHangoverChunks > 0) {
        speechHangoverChunks -= 1;
      } else {
        return;
      }

      try {
        ws.send(float32ToPCM16(inputData));
      } catch (err) {
        console.warn("[VoiceTranscript] Failed to send AssemblyAI audio:", err);
      }
    };

    source.connect(processor);
    processor.connect(audioCtx.destination);
  }

  function scheduleAssemblyReconnect(reason: string) {
    clearAssemblyReconnectTimer();
    assemblyReconnectAttemptsRef.current += 1;
    const delay = ASSEMBLYAI_RECONNECT_DELAY_MS * assemblyReconnectAttemptsRef.current;

    assemblyReconnectTimerRef.current = setTimeout(() => {
      assemblyReconnectTimerRef.current = null;
      if (!shouldRunRef.current || stoppingRef.current || providerRef.current !== "assemblyai") return;
      void connectAssemblyAi(reason);
    }, delay);
  }

  async function connectAssemblyAi(reason: string): Promise<boolean> {
    if (!enabled || !lessonId || !accessToken || !isMicOn || !shouldRunRef.current) {
      return false;
    }

    const currentWs = wsRef.current;
    if (
      currentWs &&
      (currentWs.readyState === WebSocket.OPEN || currentWs.readyState === WebSocket.CONNECTING)
    ) {
      return true;
    }

    setStatus("connecting");
    const token = await fetchAssemblyAiToken();
    if (!token) {
      setStatus("error");
      setError("Không thể lấy token AssemblyAI dự phòng. Kiểm tra ASSEMBLYAI_API_KEY ở backend.");
      return false;
    }

    if (!shouldRunRef.current || stoppingRef.current) return false;

    const ws = new WebSocket(buildAssemblyAiUrl(token));
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;
    providerRef.current = "assemblyai";

    ws.onopen = async () => {
      if (stoppingRef.current || !shouldRunRef.current) {
        try { ws.close(1000, "Transcript stopped"); } catch { /* ignore */ }
        return;
      }

      try {
        sessionStartMsRef.current = sessionStartMsRef.current || Date.now();
        turnStartMsRef.current = Date.now();
        await startAssemblyAudio(ws);
        if (ws.readyState === WebSocket.OPEN && shouldRunRef.current && !stoppingRef.current) {
          setStatus("active");
          setError(null);
        }
      } catch (err) {
        providerRef.current = null;
        setStatus("error");
        setError("Không thể dùng microphone cho AssemblyAI fallback: " + errorMessage(err));
        try { ws.close(1000, "Microphone error"); } catch { /* ignore */ }
      }
    };

    ws.onmessage = (event) => {
      if (typeof event.data !== "string") return;

      try {
        const msg = JSON.parse(event.data) as AssemblyAiMessage;

        if (msg.type === "Begin" || msg.type === "Termination") {
          return;
        }

        if (msg.type === "Turn") {
          const transcript = normalizeSpeechText(msg.utterance || msg.transcript || "");
          const transcriptOptions: TranscriptNoiseOptions = {
            languageCode: msg.language_code ?? activeLanguage.filterLang,
            languageConfidence: msg.language_confidence ?? 0.62,
            source: "assemblyai",
            languagePolicy,
          };

          if (msg.end_of_turn) {
            handleFinalTranscript(transcript, transcriptOptions);
            return;
          }

          const decision = evaluateTranscriptCandidate(
            transcript,
            {
              ...transcriptOptions,
              isFinal: false,
            },
            languageContextRef.current,
          );
          if (decision.accepted) {
            lastInterimRef.current = decision.text;
            setPartialTranscript(decision.text);
          }
          return;
        }

        if (msg.type === "Error" || msg.error) {
          const message = msg.error || msg.message || "AssemblyAI streaming error";
          console.warn("[VoiceTranscript] AssemblyAI error:", message);
          providerRef.current = null;
          setStatus("error");
          setError(message);
          try { ws.close(1000, "AssemblyAI error"); } catch { /* ignore */ }
        }
      } catch (err) {
        console.warn("[VoiceTranscript] Failed to parse AssemblyAI message:", err);
      }
    };

    ws.onerror = () => {
      setStatus("reconnecting");
      setError("AssemblyAI fallback mất kết nối, đang thử lại.");
    };

    ws.onclose = (event) => {
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
      cleanupAssemblyAudioResources();

      if (!shouldRunRef.current || stoppingRef.current || providerRef.current !== "assemblyai") {
        return;
      }

      if (
        event.code !== 1000 &&
        assemblyReconnectAttemptsRef.current < ASSEMBLYAI_MAX_RECONNECT_ATTEMPTS
      ) {
        setStatus("reconnecting");
        setError("AssemblyAI fallback mất kết nối, đang thử lại.");
        scheduleAssemblyReconnect(reason);
        return;
      }

      setStatus("error");
      setError("AssemblyAI fallback đã ngắt kết nối. Vui lòng tắt/bật transcript hoặc kiểm tra mạng.");
    };

    return true;
  }

  function startRecognition(): boolean {
    if (!enabled || !lessonId || !accessToken || !isMicOn) return false;
    if (recognitionRef.current) return true;

    const SpeechRecognition = getBrowserSpeechRecognition();
    if (!SpeechRecognition) {
      void startAssemblyAiFallback("trình duyệt không hỗ trợ SpeechRecognition");
      return false;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = activeLanguage.browserLang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      recognitionRef.current = recognition;
      providerRef.current = "browser";
      assemblyReconnectAttemptsRef.current = 0;
      activeBrowserLangRef.current = activeLanguage.browserLang;
      recognitionHadResultRef.current = false;
      clearAutoNoResultTimer();
      if (language === "auto") {
        autoNoResultTimerRef.current = setTimeout(() => {
          autoNoResultTimerRef.current = null;
          if (
            !shouldRunRef.current ||
            stoppingRef.current ||
            providerRef.current !== "browser" ||
            recognitionHadResultRef.current
          ) {
            return;
          }

          try { recognition.abort(); } catch { /* ignore */ }
        }, AUTO_NO_RESULT_SWITCH_MS);
      }
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
        recognitionHadResultRef.current = true;
        clearAutoNoResultTimer();

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

      if (code === "not-allowed" || code === "service-not-allowed" || code === "network") {
        void startAssemblyAiFallback(
          code === "network"
            ? "SpeechRecognition lỗi mạng"
            : "SpeechRecognition bị trình duyệt chặn",
        );
        return;
      }

      setStatus("reconnecting");
      setError(code === "network" ? "SpeechRecognition lỗi mạng, đang thử kết nối lại." : `SpeechRecognition error: ${code}`);
      scheduleRestart(code === "network" ? NETWORK_RETRY_DELAY_MS : RESTART_DELAY_MS);
      try { recognition.abort(); } catch { /* ignore */ }
    };

    recognition.onend = () => {
      clearAutoNoResultTimer();
      recognitionRef.current = null;
      activeBrowserLangRef.current = null;
      if (providerRef.current !== "browser") {
        return;
      }
      if (!shouldRunRef.current || stoppingRef.current) {
        if (!stoppingRef.current) setStatus("stopped");
        return;
      }

      if (language === "auto" && !recognitionHadResultRef.current) {
        setAutoRecognitionLanguage((current) => nextAutoRecognitionLanguage(current));
        return;
      }

      setStatus("active");
      scheduleRestart(RESTART_DELAY_MS);
    };

    try {
      setStatus(providerRef.current === "browser" ? "active" : "connecting");
      recognition.start();
      recognitionRef.current = recognition;
      return true;
    } catch (err) {
      recognitionRef.current = null;
      activeBrowserLangRef.current = null;
      console.warn("[VoiceTranscript] Failed to start browser SpeechRecognition:", err);
      setStatus("reconnecting");
      setError("Không thể khởi động SpeechRecognition, đang dùng AssemblyAI dự phòng.");
      void startAssemblyAiFallback("không thể khởi động SpeechRecognition");
      return false;
    }
  }

  const stopAll = useCallback((flushPending = true) => {
    stoppingRef.current = true;
    shouldRunRef.current = false;
    providerRef.current = null;
    stopRecognition(flushPending);
    stopAssemblyAi();
    lastInterimRef.current = "";
    setPartialTranscript("");
    setStatus("stopped");
  }, [stopRecognition, stopAssemblyAi]);

  useEffect(() => {
    if (!enabled || !lessonId || !accessToken || !isMicOn) {
      stopAll(true);
      return;
    }

    stoppingRef.current = false;
    shouldRunRef.current = true;
    sessionStartMsRef.current = sessionStartMsRef.current || Date.now();

    if (
      providerRef.current === "assemblyai" &&
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

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
