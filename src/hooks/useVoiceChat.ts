"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  useVoiceChatMutation,
  useEndVoiceSessionMutation,
  useStartVoiceSessionMutation,
} from "@/store/services/voice/voiceApi";
import type { VoiceState, VoiceTranscriptItem, VoiceChatResponse } from "@/types/voice";
import type { Socket } from "socket.io-client";

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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionCodeRef = useRef<string | null>(null);

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

  /**
   * Chờ kết quả job qua Socket.IO events.
   * Trả về VoiceChatResponse khi `voice:job:completed` được emit.
   */
  const waitForJobResult = useCallback(
    (jobId: string): Promise<VoiceChatResponse> => {
      const socket = options.socket;

      // Fallback nếu không có socket — ko thể nhận kết quả
      if (!socket || !socket.connected) {
        return Promise.reject(
          new Error("Socket chưa kết nối đến AI service"),
        );
      }

      return new Promise<VoiceChatResponse>((resolve, reject) => {
        const timer = setTimeout(() => {
          cleanup();
          reject(new Error("Timeout: không nhận được phản hồi từ AI"));
        }, JOB_TIMEOUT_MS);

        const cleanup = () => {
          clearTimeout(timer);
          socket.off("voice:job:completed", onCompleted);
          socket.off("voice:job:failed", onFailed);
        };

        const onCompleted = (data: { jobId: string; result: VoiceChatResponse }) => {
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

                const onOpening = async (data: { jobId: string; result: any }) => {
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
   * Bắt đầu thu âm (push-to-talk: nhấn giữ)
   */
  const startRecording = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start();
      updateStatus("recording");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể truy cập mic";
      setState((prev) => ({ ...prev, status: "error", error: message }));
      options.onError?.(message);
    }
  }, [updateStatus, options]);

  /**
   * Dừng thu âm → convert base64 → gửi AI service → chờ socket event → phát audio
   */
  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;

    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        // Tắt mic
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];

        if (blob.size === 0) {
          updateStatus("idle");
          resolve();
          return;
        }

        // Convert blob → base64
        const base64 = await blobToBase64(blob);

        // Gửi lên AI service
        updateStatus("processing");
        const config = chatConfigRef.current;
        if (!config) {
          setState((prev) => ({
            ...prev,
            status: "error",
            error: "Chưa khởi tạo session",
          }));
          resolve();
          return;
        }

        try {
          // Bước 1: Gửi request → nhận jobId (202 async)
          const { jobId } = await voiceChatMutation({
            level: config.level,
            context: config.context,
            goals: config.goals,
            inputVoice: base64,
            audioFormat: "webm",
            preferredVoice: config.preferredVoice,
            session: sessionCodeRef.current || undefined,
            topicId: config.topicId,
            scenarioId: config.scenarioId,
          }).unwrap();

          // Bước 2: Chờ kết quả qua socket
          const result = await waitForJobResult(jobId);

          // Lưu session code cho lượt tiếp
          if (result.session) {
            sessionCodeRef.current = result.session;
            setState((prev) => ({ ...prev, sessionCode: result.session }));
          }

          // Thêm transcript vào history
          const now = new Date().toISOString();
          const newItems: VoiceTranscriptItem[] = [];
          if (result.transcript) {
            const userItem: VoiceTranscriptItem = {
              role: "user",
              transcript: result.transcript,
              createdAt: now,
            };
            newItems.push(userItem);
            options.onTranscriptUpdate?.(userItem);
          }
          
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
              createdAt: now,
            };
            newItems.push(aiItem);
            options.onTranscriptUpdate?.(aiItem);
          }

          setState((prev) => ({
            ...prev,
            transcriptHistory: [...prev.transcriptHistory, ...newItems],
          }));

          // Phát audio response
          if (result.audioBase64) {
            updateStatus("playing");
            await playBase64Audio(
              result.audioBase64,
              result.audioFormat || "mp3",
              options.onAudioProgress,
            );
          }

          updateStatus("idle");

          // Báo hiệu FE hiển thị popup kết thúc nếu thấy ((close))
          if (isAutoClose) {
            // @ts-ignore - Ta sẽ thêm onAutoClose vào Options sau
            options.onAutoClose?.();
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Lỗi khi gửi voice";
          setState((prev) => ({ ...prev, status: "error", error: message }));
          options.onError?.(message);
        }

        resolve();
      };

      recorder.stop();
    });
  }, [voiceChatMutation, waitForJobResult, updateStatus, options]);

  /**
   * Kết thúc session hoàn toàn
   */
  const stopSession = useCallback(async () => {
    // Dừng recording nếu đang record
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    const sessionCode = sessionCodeRef.current;
    if (sessionCode) {
      try {
        await endSessionMutation(sessionCode).unwrap();
      } catch (err) {
        console.error("Lỗi khi kết thúc session:", err);
      }
    }

    sessionCodeRef.current = null;
    chatConfigRef.current = null;
    setState({
      status: "idle",
      sessionCode: null,
      error: null,
      transcriptHistory: [],
    });
  }, [endSessionMutation]);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
    };
  }, []);

  return {
    state,
    startSession,
    startRecording,
    stopRecording,
    stopSession,
    isSessionActive: chatConfigRef.current !== null,
  };
}

/** Convert Blob → base64 string (without data URI prefix) */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Bỏ prefix "data:audio/webm;base64,"
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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
