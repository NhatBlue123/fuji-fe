"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_CONFIG } from "@/config/api";
import {
  createTranscriptLanguageContext,
  evaluateTranscriptCandidate,
  recordAcceptedTranscriptLanguage,
  type TranscriptLanguageContext,
  type TranscriptLanguagePolicy,
  type TranscriptNoiseOptions,
} from "@/lib/transcriptFilters";

const ASSEMBLYAI_WS_URL = "wss://streaming.assemblyai.com/v3/ws";
const SAMPLE_RATE = 16_000;
const SPEECH_MODEL = "whisper-rt";
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY_MS = 2000;
const VAD_START_THRESHOLD = 0.018;
const VAD_CONTINUE_THRESHOLD = 0.01;
const VAD_HANGOVER_CHUNKS = 12;
const MIN_FINAL_TRANSCRIPT_CHARS = 4;

export type VoiceTranscriptStatus =
  | "idle"
  | "connecting"
  | "active"
  | "reconnecting"
  | "stopped"
  | "error";

interface UseVoiceTranscriptOptions {
  lessonId: number | null;
  role: "TEACHER" | "STUDENT";
  userId: number;
  userName: string;
  accessToken: string | null;
  isMicOn: boolean;
  enabled?: boolean;
  classroomTopic?: string | null;
  transcriptLanguagePolicy?: TranscriptLanguagePolicy;
}

interface AssemblyAiMessage {
  type?: string;
  id?: string;
  transcript?: string;
  end_of_turn?: boolean;
  language_code?: string | null;
  language_confidence?: number | null;
  error?: string;
  message?: string;
  audio_duration_seconds?: number;
  session_duration_seconds?: number;
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
    sample_rate: String(SAMPLE_RATE),
    speech_model: SPEECH_MODEL,
    encoding: "pcm_s16le",
    language_detection: "true",
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
  transcriptLanguagePolicy,
}: UseVoiceTranscriptOptions) {
  const [status, setStatus] = useState<VoiceTranscriptStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [partialTranscript, setPartialTranscript] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const browserRestartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectAssemblyAiRef = useRef<(() => void) | null>(null);
  const browserSpeechDisabledRef = useRef(false);
  const isStoppingRef = useRef(false);
  const shouldReconnectRef = useRef(true);
  const sessionStartMs = useRef(0);
  const turnStartMsRef = useRef(0);
  const speechHangoverChunksRef = useRef(0);
  const lastSavedTranscriptRef = useRef("");
  const lastSavedAtRef = useRef(0);
  const languagePolicy = useMemo<TranscriptLanguagePolicy>(
    () => ({
      primaryLanguage: "vi",
      classroomTopic,
      ...transcriptLanguagePolicy,
    }),
    [classroomTopic, transcriptLanguagePolicy]
  );
  const languageContextRef = useRef<TranscriptLanguageContext>(
    createTranscriptLanguageContext(languagePolicy)
  );

  useEffect(() => {
    languageContextRef.current = createTranscriptLanguageContext(languagePolicy);
  }, [languagePolicy, lessonId]);

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
    [lessonId, accessToken, userId, role, userName]
  );

  const handleFinalTranscript = useCallback(
    (rawTranscript: string, options: TranscriptNoiseOptions = {}) => {
      const trimmedTranscript = rawTranscript.trim();
      if (trimmedTranscript.length < MIN_FINAL_TRANSCRIPT_CHARS) {
        setPartialTranscript("");
        return;
      }

      const decision = evaluateTranscriptCandidate(
        trimmedTranscript,
        {
          ...options,
          isFinal: true,
          languagePolicy,
        },
        languageContextRef.current
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

      const startTimeMs = Math.max(0, (turnStartMsRef.current || now) - sessionStartMs.current);
      setPartialTranscript("");
      void saveTranscriptSegment(cleanTranscript, startTimeMs, decision.confidence);
      recordAcceptedTranscriptLanguage(languageContextRef.current, decision);
      lastSavedTranscriptRef.current = normalizedFinal;
      lastSavedAtRef.current = now;
      turnStartMsRef.current = now;
    },
    [languagePolicy, saveTranscriptSegment]
  );

  const fetchToken = useCallback(async (): Promise<string | null> => {
    if (!lessonId || !accessToken) return null;

    try {
      const res = await fetch(
        `${API_CONFIG.BASE_URL}/summaries/realtime-token?sessionId=${lessonId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      return typeof data?.token === "string" ? data.token : null;
    } catch (err) {
      console.error("[VoiceTranscript] Failed to fetch token:", err);
      return null;
    }
  }, [lessonId, accessToken]);

  const cleanupAudioResources = useCallback(() => {
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch { /* ignore */ }
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

  const stopBrowserSpeech = useCallback(() => {
    if (browserRestartTimerRef.current) {
      clearTimeout(browserRestartTimerRef.current);
      browserRestartTimerRef.current = null;
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
  }, []);

  const stopAll = useCallback(() => {
    isStoppingRef.current = true;
    shouldReconnectRef.current = false;
    browserSpeechDisabledRef.current = false;

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    stopBrowserSpeech();

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify({ type: "Terminate" })); } catch { /* ignore */ }
      setTimeout(() => {
        try { ws.close(1000, "Session ended"); } catch { /* ignore */ }
      }, 200);
    } else if (ws) {
      try { ws.close(1000, "Session ended"); } catch { /* ignore */ }
    }

    wsRef.current = null;
    cleanupAudioResources();
    reconnectAttemptsRef.current = 0;
    speechHangoverChunksRef.current = 0;
    setPartialTranscript("");
    setStatus("stopped");
  }, [cleanupAudioResources, stopBrowserSpeech]);

  const startBrowserSpeech = useCallback(() => {
    const SpeechRecognition = getBrowserSpeechRecognition();
    if (!SpeechRecognition) return false;
    if (browserSpeechDisabledRef.current) return false;
    if (recognitionRef.current) return true;

    const scheduleAssemblyFallback = () => {
      if (browserRestartTimerRef.current) {
        clearTimeout(browserRestartTimerRef.current);
      }

      browserRestartTimerRef.current = setTimeout(() => {
        browserRestartTimerRef.current = null;
        if (isStoppingRef.current || !shouldReconnectRef.current) return;
        connectAssemblyAiRef.current?.();
      }, 300);
    };

    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.info("[VoiceTranscript] Browser SpeechRecognition started with lang=vi-VN");
      recognitionRef.current = recognition;
      sessionStartMs.current = sessionStartMs.current || Date.now();
      turnStartMsRef.current = Date.now();
      setStatus("active");
      setError(null);
    };

    recognition.onresult = (event) => {
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript?.trim() ?? "";
        if (!transcript) continue;

        if (result.isFinal) {
          handleFinalTranscript(transcript, {
            languageCode: "vi",
            languageConfidence: result[0]?.confidence ?? 0.82,
            source: "browser",
          });
        } else {
          interim = `${interim} ${transcript}`.trim();
        }
      }

      if (interim) {
        const decision = evaluateTranscriptCandidate(
          interim,
          {
            languageCode: "vi",
            languageConfidence: 0.72,
            source: "browser",
            isFinal: false,
            languagePolicy,
          },
          languageContextRef.current
        );
        if (decision.accepted) {
          setPartialTranscript(decision.text);
        }
      }
    };

    recognition.onerror = (event) => {
      const code = event.error ?? "unknown";
      if (code === "no-speech" || code === "aborted") return;
      console.warn("[VoiceTranscript] Browser SpeechRecognition error:", event);

      if (code === "network" || code === "service-not-allowed") {
        browserSpeechDisabledRef.current = true;
        setPartialTranscript("");
        setStatus("reconnecting");
        setError("SpeechRecognition lỗi mạng, đang chuyển sang AssemblyAI fallback.");
        scheduleAssemblyFallback();
        try { recognition.abort(); } catch { /* ignore */ }
        return;
      }

      setError(event.message || `Speech recognition error: ${code}`);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (
        browserSpeechDisabledRef.current &&
        !isStoppingRef.current &&
        shouldReconnectRef.current &&
        enabled &&
        isMicOn &&
        lessonId &&
        accessToken
      ) {
        setStatus("reconnecting");
        scheduleAssemblyFallback();
        return;
      }

      if (!isStoppingRef.current && shouldReconnectRef.current && enabled && isMicOn && lessonId && accessToken) {
        setStatus("reconnecting");
        browserRestartTimerRef.current = setTimeout(() => {
          void startBrowserSpeech();
        }, 500);
        return;
      }

      if (!isStoppingRef.current) {
        setStatus("stopped");
      }
    };

    try {
      setStatus("connecting");
      recognition.start();
      recognitionRef.current = recognition;
      return true;
    } catch (err) {
      console.warn("[VoiceTranscript] Failed to start browser SpeechRecognition:", err);
      recognitionRef.current = null;
      return false;
    }
  }, [accessToken, enabled, handleFinalTranscript, isMicOn, languagePolicy, lessonId]);

  const float32ToPCM16 = (float32Array: Float32Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < float32Array.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }

    return buffer;
  };

  const startAudio = useCallback(
    async (ws: WebSocket): Promise<void> => {
      cleanupAudioResources();
      console.info("[VoiceTranscript] Requesting microphone access...");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (ws.readyState !== WebSocket.OPEN || isStoppingRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      console.info("[VoiceTranscript] Microphone access granted");

      const audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
      audioCtxRef.current = audioCtx;

      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const processor = audioCtx.createScriptProcessor(1024, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const inputData = event.inputBuffer.getChannelData(0);
        const rms = calculateRms(inputData);
        const threshold = speechHangoverChunksRef.current > 0
          ? VAD_CONTINUE_THRESHOLD
          : VAD_START_THRESHOLD;

        if (rms >= threshold) {
          speechHangoverChunksRef.current = VAD_HANGOVER_CHUNKS;
        } else if (speechHangoverChunksRef.current > 0) {
          speechHangoverChunksRef.current -= 1;
        } else {
          return;
        }

        try {
          ws.send(float32ToPCM16(inputData));
        } catch (err) {
          console.error("[VoiceTranscript] Failed to send audio:", err);
        }
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
      console.info("[VoiceTranscript] Audio processor started");
    },
    [cleanupAudioResources]
  );

  const connectAssemblyAi = useCallback(async () => {
    if (!enabled || !lessonId || !accessToken || isStoppingRef.current) return;

    setStatus("connecting");
    setError(null);
    shouldReconnectRef.current = true;

    const token = await fetchToken();
    if (!token) {
      shouldReconnectRef.current = false;
      setStatus("error");
      setError("Không thể lấy token AssemblyAI. Kiểm tra cấu hình server.");
      return;
    }

    sessionStartMs.current = Date.now();
    turnStartMsRef.current = Date.now();

    const url = buildAssemblyAiUrl(token);
    console.info("[VoiceTranscript] Connecting to AssemblyAI WS:", url.replace(token, "***"));

    const ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = async () => {
      if (isStoppingRef.current) {
        ws.close();
        return;
      }

      console.info(`[VoiceTranscript] WebSocket connected with speech_model=${SPEECH_MODEL}`);

      try {
        await startAudio(ws);
        if (ws.readyState === WebSocket.OPEN && !isStoppingRef.current) {
          setStatus("active");
        }
      } catch (err) {
        shouldReconnectRef.current = false;
        setStatus("error");
        setError("Không thể truy cập microphone: " + errorMessage(err));
        try { ws.close(1000, "Microphone error"); } catch { /* ignore */ }
      }
    };

    ws.onmessage = (event) => {
      try {
        if (typeof event.data !== "string") return;
        const msg = JSON.parse(event.data) as AssemblyAiMessage;

        if (msg.type === "Begin") {
          console.info("[VoiceTranscript] Session started:", msg.id);
          return;
        }

        if (msg.type === "Turn") {
          const cleanTranscript = (msg.transcript ?? "").trim();
          const transcriptOptions: TranscriptNoiseOptions = {
            languageCode: msg.language_code,
            languageConfidence: msg.language_confidence,
            source: "assemblyai",
            isFinal: Boolean(msg.end_of_turn),
            languagePolicy,
          };

          if (msg.end_of_turn) {
            handleFinalTranscript(cleanTranscript, transcriptOptions);
          } else {
            const decision = evaluateTranscriptCandidate(
              cleanTranscript,
              transcriptOptions,
              languageContextRef.current
            );
            if (decision.accepted) {
              setPartialTranscript(decision.text);
            }
          }
          return;
        }

        if (msg.type === "Termination") {
          console.info(
            `[VoiceTranscript] Session terminated: audio=${msg.audio_duration_seconds ?? 0}s session=${msg.session_duration_seconds ?? 0}s`
          );
          return;
        }

        if (msg.type === "Error" || msg.error) {
          const assemblyError = msg.error || msg.message || "AssemblyAI streaming error";
          console.error("[VoiceTranscript] AssemblyAI error:", assemblyError);
          shouldReconnectRef.current = false;
          setStatus("error");
          setError(assemblyError);
          try { ws.close(1000, "AssemblyAI validation error"); } catch { /* ignore */ }
        }
      } catch (err) {
        console.warn("[VoiceTranscript] Failed to parse message:", err);
      }
    };

    ws.onerror = (event) => {
      console.error("[VoiceTranscript] WebSocket error:", event);
      setError("Lỗi kết nối WebSocket");
    };

    ws.onclose = (event) => {
      console.info(`[VoiceTranscript] WS closed: code=${event.code} reason="${event.reason}"`);
      cleanupAudioResources();
      wsRef.current = null;

      if (
        !isStoppingRef.current &&
        shouldReconnectRef.current &&
        event.code !== 1000 &&
        reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
      ) {
        reconnectAttemptsRef.current += 1;
        const delay = RECONNECT_DELAY_MS * reconnectAttemptsRef.current;
        setStatus("reconnecting");
        reconnectTimerRef.current = setTimeout(() => {
          void connectAssemblyAi();
        }, delay);
        return;
      }

      if (!isStoppingRef.current && shouldReconnectRef.current) {
        setStatus("stopped");
      }
    };
  }, [
    enabled,
    lessonId,
    accessToken,
    fetchToken,
    startAudio,
    handleFinalTranscript,
    cleanupAudioResources,
    languagePolicy,
  ]);

  useEffect(() => {
    connectAssemblyAiRef.current = () => {
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) return;
      void connectAssemblyAi();
    };
  }, [connectAssemblyAi]);

  useEffect(() => {
    if (!enabled || !lessonId || !accessToken) {
      stopAll();
      return;
    }

    if (!isMicOn) {
      stopAll();
      return;
    }

    isStoppingRef.current = false;
    shouldReconnectRef.current = true;
    reconnectAttemptsRef.current = 0;

    sessionStartMs.current = Date.now();
    turnStartMsRef.current = Date.now();

    if (!browserSpeechDisabledRef.current && startBrowserSpeech()) {
      return;
    }

    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
      void connectAssemblyAi();
    }
  }, [isMicOn, enabled, lessonId, accessToken, connectAssemblyAi, startBrowserSpeech, stopAll]);

  useEffect(() => {
    return () => {
      isStoppingRef.current = true;
      stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, error, partialTranscript };
}
