"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  useVoiceChatMutation,
  useEndVoiceSessionMutation,
  useStartVoiceSessionMutation,
} from "@/store/services/voice/voiceApi";
import type {
  VoiceState,
  VoiceTranscriptItem,
  VoiceChatResponse,
  VoiceSessionFeedback,
  VoiceEvaluationState,
} from "@/types/voice";
import type { Socket } from "socket.io-client";

interface SpeechRecognitionAlternativeLike {
  transcript: string;
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

function normalizeSpeechText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

interface UseVoiceChatOptions {
  /** Socket.IO instance kết nối tới AI-FUJI */
  socket: Socket | null;
  onTranscriptUpdate?: (transcript: VoiceTranscriptItem) => void;
  onStatusChange?: (status: VoiceState["status"]) => void;
  onError?: (error: string) => void;
  /** Gọi liên tục khi đang phát audio (progress 0→1) */
  onAudioProgress?: (progress: number) => void;
  /** Gọi khi AI detect đến lượt cuối cùng và nhả ((close)) */
  onAutoClose?: () => void;
}

/** Timeout chờ socket event (ms) */
const JOB_TIMEOUT_MS = 60_000;

export function useVoiceChat(options: UseVoiceChatOptions) {
  const [state, setState] = useState<VoiceState>({
    status: "idle",
    sessionCode: null,
    error: null,
    transcriptHistory: [],
  });

  const [voiceChatMutation] = useVoiceChatMutation();
  const [endSessionMutation] = useEndVoiceSessionMutation();
  const [startVoiceSessionMutation] = useStartVoiceSessionMutation();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");

  const sessionCodeRef = useRef<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recognitionRestartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRunIdRef = useRef(0);
  const finalizedResultKeysRef = useRef<Set<string>>(new Set());
  const finalTranscriptRef = useRef("");
  const interimTranscriptRef = useRef("");
  const isCapturingSpeechRef = useRef(false);
  const shouldRestartRecognitionRef = useRef(false);

  // Config lưu tạm để gửi kèm mỗi lượt chat
  const chatConfigRef = useRef<{
    level: string;
    context: string;
    goals: string;
    preferredVoice: string;
    topicId?: number;
    scenarioId?: number;
    openingLine?: string;
  } | null>(null);

  const updateStatus = useCallback(
    (status: VoiceState["status"]) => {
      setState((prev) => ({ ...prev, status }));
      options.onStatusChange?.(status);
    },
    [options],
  );

  const stopLiveSpeechRecognition = useCallback((clearTranscript = false) => {
    shouldRestartRecognitionRef.current = false;
    isCapturingSpeechRef.current = false;
    if (recognitionRestartTimerRef.current) {
      clearTimeout(recognitionRestartTimerRef.current);
      recognitionRestartTimerRef.current = null;
    }

    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try { recognition.stop(); } catch { /* ignore */ }
      try { recognition.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }

    if (clearTranscript) {
      finalizedResultKeysRef.current.clear();
      finalTranscriptRef.current = "";
      interimTranscriptRef.current = "";
      setLiveTranscript("");
    }
  }, []);

  const startLiveSpeechRecognition = useCallback(function startLiveSpeechRecognition(): boolean {
    const SpeechRecognition = getBrowserSpeechRecognition();
    if (!SpeechRecognition) return false;
    if (recognitionRef.current) return true;

    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    shouldRestartRecognitionRef.current = true;
    recognitionRunIdRef.current += 1;
    const runId = recognitionRunIdRef.current;

    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = normalizeSpeechText(result[0]?.transcript ?? "");
        if (!transcript) continue;

        if (result.isFinal) {
          const resultKey = `${runId}:${i}`;
          if (finalizedResultKeysRef.current.has(resultKey)) continue;
          finalizedResultKeysRef.current.add(resultKey);
          const currentFinal = normalizeSpeechText(finalTranscriptRef.current);
          finalTranscriptRef.current = normalizeSpeechText(`${currentFinal} ${transcript}`);
        } else {
          interimTranscript = normalizeSpeechText(`${interimTranscript} ${transcript}`);
        }
      }

      interimTranscriptRef.current = interimTranscript;
      setLiveTranscript(normalizeSpeechText(`${finalTranscriptRef.current} ${interimTranscript}`));
    };

    recognition.onerror = (event) => {
      const code = event.error ?? "unknown";
      if (code === "no-speech" || code === "aborted") return;
      if (process.env.NODE_ENV === "development") {
        console.warn("[VoiceChat] Browser SpeechRecognition error:", event);
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (!shouldRestartRecognitionRef.current) return;
      if (!isCapturingSpeechRef.current) return;

      recognitionRestartTimerRef.current = setTimeout(() => {
        recognitionRestartTimerRef.current = null;
        if (shouldRestartRecognitionRef.current && isCapturingSpeechRef.current) {
          startLiveSpeechRecognition();
        }
      }, 250);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      return true;
    } catch (err) {
      recognitionRef.current = null;
      if (process.env.NODE_ENV === "development") {
        console.warn("[VoiceChat] Failed to start browser SpeechRecognition:", err);
      }
      return false;
    }
  }, []);

  /**
   * Chờ kết quả job qua Socket.IO events.
   * Trả về VoiceChatResponse khi `voice:job:completed` được emit.
   */
  const waitForJobResult = useCallback(
    (
      jobId: string,
      onPartialTranscript?: (transcript: string) => void,
    ): Promise<VoiceChatResponse> => {
      const socket = options.socket;

      // Fallback nếu không có socket — ko thể nhận kết quả
      if (!socket || !socket.connected) {
        return Promise.reject(new Error("Socket chưa kết nối đến AI service"));
      }

      return new Promise<VoiceChatResponse>((resolve, reject) => {
        const timer = setTimeout(() => {
          cleanup();
          reject(new Error("Timeout: không nhận được phản hồi từ AI"));
        }, JOB_TIMEOUT_MS);

        const onTranscript = (data: {
          jobId: string;
          transcript: string;
          session: string;
        }) => {
          if (data.jobId === jobId && onPartialTranscript) {
            onPartialTranscript(data.transcript);
          }
        };

        const cleanup = () => {
          clearTimeout(timer);
          socket.off("voice:job:completed", onCompleted);
          socket.off("voice:job:failed", onFailed);
          socket.off("voice:job:transcript", onTranscript);
        };

        const onCompleted = (data: {
          jobId: string;
          result: VoiceChatResponse;
        }) => {
          if (data.jobId !== jobId) return;
          cleanup();
          resolve(data.result);
        };

        const onFailed = (data: { jobId: string; error?: string }) => {
          if (data.jobId !== jobId) return;
          cleanup();
          reject(new Error(data.error || "Job xử lý thất bại"));
        };

        socket.on("voice:job:completed", onCompleted);
        socket.on("voice:job:failed", onFailed);
        socket.on("voice:job:transcript", onTranscript);
      });
    },
    [options.socket],
  );

  /**
   * Bắt đầu session mới — chỉ set config, chưa record
   */
  const startSession = useCallback(
    async (config: {
      level: string;
      context: string;
      goals?: string;
      preferredVoice?: string;
      topicId?: number;
      scenarioId?: number;
      openingLine?: string;
    }) => {
      const voice = config.preferredVoice || "alloy";
      chatConfigRef.current = {
        level: config.level,
        context: config.context,
        goals: config.goals || "",
        preferredVoice: voice,
        topicId: config.topicId,
        scenarioId: config.scenarioId,
        openingLine: config.openingLine,
      };
      setIsSessionActive(true);
      sessionCodeRef.current = null;
      setState({
        status: "idle",
        sessionCode: null,
        error: null,
        transcriptHistory: [],
      });

      // Nếu có openingLine → AI nói trước
      if (config.openingLine) {
        updateStatus("processing");
        const socket = options.socket;

        try {
          // Tạo Promise lắng nghe socket TRƯỚC khi gọi HTTP
          const waitPromise = socket?.connected
            ? new Promise<void>((resolve) => {
                const timer = setTimeout(() => {
                  socket.off("voice:job:completed", onOpening);
                  updateStatus("idle");
                  resolve();
                }, 20_000);

                const onOpening = async (data: {
                  jobId: string;
                  result: {
                    aiResponse?: {
                      text?: string;
                      furigana?: VoiceTranscriptItem["furigana"];
                    };
                    audioBase64?: string;
                    audioFormat?: string;
                  };
                }) => {
                  if (!String(data.jobId).startsWith("opening-")) return;
                  clearTimeout(timer);
                  socket.off("voice:job:completed", onOpening);

                  const result = data.result;
                  const now = new Date().toISOString();

                  if (result.aiResponse?.text) {
                    const furigana = result.aiResponse?.furigana;
                    const aiItem: VoiceTranscriptItem = {
                      role: "assistant",
                      transcript: result.aiResponse.text,
                      translationVi: furigana?.translation || undefined,
                      furigana: furigana || undefined,
                      audioBase64: result.audioBase64 || undefined,
                      audioFormat: result.audioFormat || "mp3",
                      createdAt: now,
                    };
                    options.onTranscriptUpdate?.(aiItem);
                    setState((prev) => ({
                      ...prev,
                      transcriptHistory: [...prev.transcriptHistory, aiItem],
                    }));
                  }

                  if (result.audioBase64) {
                    updateStatus("playing");
                    await playBase64Audio(
                      result.audioBase64,
                      result.audioFormat || "mp3",
                      options.onAudioProgress,
                    );
                  }

                  updateStatus("idle");
                  resolve();
                };

                socket.on("voice:job:completed", onOpening);
              })
            : Promise.resolve();

          // Gọi HTTP sau khi listener đã ready
          await startVoiceSessionMutation({
            openingLine: config.openingLine,
            preferredVoice: voice,
            session: null,
          }).unwrap();

          await waitPromise;
        } catch (err) {
          console.error("startVoiceSession err:", err);
          updateStatus("idle");
        }
      }
    },
    [startVoiceSessionMutation, updateStatus, options],
  );

  // Removed listenForOpening - logic moved inline into startSession to fix race condition

  /**
   * Bắt đầu nhận diện giọng nói bằng browser STT.
   */
  const startRecording = useCallback(async () => {
    if (isCapturingSpeechRef.current) return;

    const SpeechRecognition = getBrowserSpeechRecognition();
    if (!SpeechRecognition) {
      const message = "Trình duyệt chưa hỗ trợ STT realtime. Vui lòng dùng Chrome hoặc Edge.";
      setState((prev) => ({ ...prev, status: "error", error: message }));
      options.onError?.(message);
      return;
    }

    setState((prev) => ({ ...prev, error: null }));
    finalizedResultKeysRef.current.clear();
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    setLiveTranscript("");
    isCapturingSpeechRef.current = true;

    if (startLiveSpeechRecognition()) {
      updateStatus("recording");
    } else {
      isCapturingSpeechRef.current = false;
      const message = "Không thể bắt đầu STT realtime. Kiểm tra quyền microphone.";
      setState((prev) => ({ ...prev, status: "error", error: message }));
      options.onError?.(message);
    }
  }, [startLiveSpeechRecognition, updateStatus, options]);

  const cancelRecording = useCallback(async () => {
    stopLiveSpeechRecognition(true);
    updateStatus("idle");
  }, [stopLiveSpeechRecognition, updateStatus]);

  /**
   * Dừng STT → gửi transcript lên AI service → chờ socket event → phát audio
   */
  const stopRecording = useCallback(async () => {
    if (!isCapturingSpeechRef.current) return;
    const transcriptFromState = normalizeSpeechText(liveTranscript);
    const transcriptFromRefs = normalizeSpeechText(
      `${finalTranscriptRef.current} ${interimTranscriptRef.current}`,
    );
    const transcriptToSend =
      transcriptFromRefs.length >= transcriptFromState.length
        ? transcriptFromRefs
        : transcriptFromState;
    stopLiveSpeechRecognition(false);

    if (!transcriptToSend) {
      const message = "Chưa nhận được nội dung giọng nói để gửi.";
      setState((prev) => ({ ...prev, status: "error", error: message }));
      setLiveTranscript("");
      options.onError?.(message);
      return;
    }

    updateStatus("processing");
    const config = chatConfigRef.current;
    if (!config) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: "Chưa khởi tạo session",
      }));
      setLiveTranscript("");
      return;
    }

    const now = new Date().toISOString();
    const userItem: VoiceTranscriptItem = {
      role: "user",
      transcript: transcriptToSend,
      createdAt: now,
    };
    options.onTranscriptUpdate?.(userItem);
    setState((prev) => ({
      ...prev,
      transcriptHistory: [...prev.transcriptHistory, userItem],
    }));

    try {
      const { jobId } = await voiceChatMutation({
        level: config.level,
        context: config.context,
        goals: config.goals,
        userTranscript: transcriptToSend,
        preferredVoice: config.preferredVoice,
        session: sessionCodeRef.current || undefined,
        topicId: config.topicId,
        scenarioId: config.scenarioId,
      }).unwrap();

      const result = await waitForJobResult(jobId);

      if (result.session) {
        sessionCodeRef.current = result.session;
        setState((prev) => ({ ...prev, sessionCode: result.session }));
      }

      const responseAt = new Date().toISOString();
      const newItems: VoiceTranscriptItem[] = [];
      let aiText = result.aiResponse?.text || "";
      let isAutoClose = false;
      if (aiText.includes("((close))")) {
        isAutoClose = true;
        aiText = aiText.replace("((close))", "").trim();
      }

      if (aiText) {
        const furigana = result.aiResponse?.furigana;
        const aiItem: VoiceTranscriptItem = {
          role: "assistant",
          transcript: aiText,
          translationVi: furigana?.translation || undefined,
          furigana: furigana || undefined,
          audioBase64: result.audioBase64 || undefined,
          audioFormat: result.audioFormat || "mp3",
          createdAt: responseAt,
        };
        newItems.push(aiItem);
        options.onTranscriptUpdate?.(aiItem);
      }

      setState((prev) => ({
        ...prev,
        transcriptHistory: [...prev.transcriptHistory, ...newItems],
      }));

      if (result.audioBase64) {
        updateStatus("playing");
        await playBase64Audio(
          result.audioBase64,
          result.audioFormat || "mp3",
          options.onAudioProgress,
        );
      }

      updateStatus("idle");
      setLiveTranscript("");
      finalTranscriptRef.current = "";
      interimTranscriptRef.current = "";

      if (isAutoClose) {
        options.onAutoClose?.();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Lỗi khi gửi voice";
      setState((prev) => ({ ...prev, status: "error", error: message }));
      setLiveTranscript("");
      options.onError?.(message);
    }
  }, [
    liveTranscript,
    voiceChatMutation,
    waitForJobResult,
    updateStatus,
    stopLiveSpeechRecognition,
    options,
  ]);

  /**
   * Kết thúc session hoàn toàn
   */
  const stopSession = useCallback(async (): Promise<{
    sessionCode: string;
    feedback: VoiceSessionFeedback | null;
    evaluation: VoiceEvaluationState | null;
  } | null> => {
    // Dừng STT nếu đang nghe
    if (isCapturingSpeechRef.current) {
      await cancelRecording();
    }

    const sessionCode = sessionCodeRef.current;
    if (sessionCode) {
      try {
        const result = await endSessionMutation(sessionCode).unwrap();

        sessionCodeRef.current = null;
        chatConfigRef.current = null;
        setIsSessionActive(false);
        setState({
          status: "idle",
          sessionCode: null,
          error: null,
          transcriptHistory: [],
        });

        return {
          sessionCode,
          feedback: result?.feedback ?? null,
          evaluation: result?.evaluation ?? null,
        };
      } catch (err) {
        console.error("Lỗi khi kết thúc session:", err);
      }
    }

    sessionCodeRef.current = null;
    chatConfigRef.current = null;
    setIsSessionActive(false);
    setState({
      status: "idle",
      sessionCode: null,
      error: null,
      transcriptHistory: [],
    });
    return null;
  }, [cancelRecording, endSessionMutation]);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      stopLiveSpeechRecognition(true);
    };
  }, [stopLiveSpeechRecognition]);

  return {
    state,
    liveTranscript,
    startSession,
    startRecording,
    stopRecording,
    cancelRecording,
    stopSession,
    isSessionActive,
  };
}

/** Phát audio từ base64 string */
function playBase64Audio(
  base64: string,
  format: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(`data:audio/${format};base64,${base64}`);
    if (onProgress) {
      audio.ontimeupdate = () => {
        if (audio.duration > 0) {
          onProgress(audio.currentTime / audio.duration);
        }
      };
    }
    audio.onended = () => {
      onProgress?.(1);
      resolve();
    };
    audio.onerror = () => resolve();
    audio.play().catch(() => resolve());
  });
}
