"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  useVoiceChatMutation,
  useEndVoiceSessionMutation,
} from "@/store/services/voice/voiceApi";
import type { VoiceState, VoiceTranscriptItem } from "@/types/voice";

interface UseVoiceChatOptions {
  onTranscriptUpdate?: (transcript: VoiceTranscriptItem) => void;
  onStatusChange?: (status: VoiceState["status"]) => void;
  onError?: (error: string) => void;
  /** Gọi liên tục khi đang phát audio (progress 0→1) */
  onAudioProgress?: (progress: number) => void;
}

export function useVoiceChat(options: UseVoiceChatOptions = {}) {
  const [state, setState] = useState<VoiceState>({
    status: "idle",
    sessionCode: null,
    error: null,
    transcriptHistory: [],
  });

  const [voiceChatMutation] = useVoiceChatMutation();
  const [endSessionMutation] = useEndVoiceSessionMutation();

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
  } | null>(null);

  const updateStatus = useCallback(
    (status: VoiceState["status"]) => {
      setState((prev) => ({ ...prev, status }));
      options.onStatusChange?.(status);
    },
    [options],
  );

  /**
   * Bắt đầu session mới — chỉ set config, chưa record
   */
  const startSession = useCallback(
    (config: {
      level: string;
      context: string;
      goals?: string;
      preferredVoice?: string;
    }) => {
      chatConfigRef.current = {
        level: config.level,
        context: config.context,
        goals: config.goals || "",
        preferredVoice: config.preferredVoice || "alloy",
      };
      sessionCodeRef.current = null;
      setState({
        status: "idle",
        sessionCode: null,
        error: null,
        transcriptHistory: [],
      });
    },
    [],
  );

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
   * Dừng thu âm → convert base64 → gửi BE → phát audio response
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

        // Gửi lên BE
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
          const result = await voiceChatMutation({
            level: config.level,
            context: config.context,
            goals: config.goals,
            inputVoice: base64,
            audioFormat: "webm",
            preferredVoice: config.preferredVoice,
            session: sessionCodeRef.current || undefined,
          }).unwrap();

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
          if (result.aiResponse?.text) {
            const furigana = result.aiResponse.furigana;
            const aiItem: VoiceTranscriptItem = {
              role: "assistant",
              transcript: result.aiResponse.text,
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
  }, [voiceChatMutation, updateStatus, options]);

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
