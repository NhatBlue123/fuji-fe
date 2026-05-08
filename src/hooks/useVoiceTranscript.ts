"use client";

/**
 * useVoiceTranscript
 *
 * Stream microphone audio đến AssemblyAI v3 Streaming API để nhận realtime transcript.
 * Mỗi "Turn" hoàn chỉnh (end_of_turn=true) được lưu vào /api/transcripts.
 *
 * Production-ready:
 * - Temporary token từ backend (không expose API key trên FE)
 * - Audio resampling về 16kHz mono PCM16 bằng AudioContext
 * - Graceful cleanup: send Terminate → close WS → stop mic tracks
 * - Auto-reconnect tối đa 3 lần khi WS đóng bất ngờ
 * - Chỉ active khi mic đang bật (isMicOn)
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { API_CONFIG } from "@/config/api";

const ASSEMBLYAI_WS_URL = "wss://streaming.assemblyai.com/v3/ws";
const SAMPLE_RATE = 16_000;
const CHUNK_DURATION_MS = 50; // 50ms = 800 samples @16kHz
const SAMPLES_PER_CHUNK = (SAMPLE_RATE * CHUNK_DURATION_MS) / 1000; // 800
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY_MS = 2000;

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
  /** Mic đang bật hay không — hook sẽ start/stop theo giá trị này */
  isMicOn: boolean;
  /** Bật/tắt toàn bộ tính năng */
  enabled?: boolean;
}

export function useVoiceTranscript({
  lessonId,
  role,
  userId,
  userName,
  accessToken,
  isMicOn,
  enabled = true,
}: UseVoiceTranscriptOptions) {
  const [status, setStatus] = useState<VoiceTranscriptStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Refs — không trigger re-render
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStoppingRef = useRef(false);
  const sessionStartMs = useRef<number>(Date.now());

  /**
   * Lưu transcript segment lên backend (fire-and-forget).
   */
  const saveTranscriptSegment = useCallback(
    async (content: string, startTimeMs: number) => {
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
            startTimeMs,
          }),
        });
      } catch (err) {
        console.warn("[VoiceTranscript] Failed to save segment:", err);
      }
    },
    [lessonId, accessToken, userId, role, userName]
  );

  /**
   * Lấy temporary token từ backend.
   */
  const fetchToken = useCallback(async (): Promise<string | null> => {
    if (!lessonId || !accessToken) return null;
    try {
      const res = await fetch(
        `${API_CONFIG.BASE_URL}/summaries/realtime-token?sessionId=${lessonId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.token ?? null;
    } catch (err) {
      console.error("[VoiceTranscript] Failed to fetch token:", err);
      return null;
    }
  }, [lessonId, accessToken]);

  /**
   * Dừng và cleanup toàn bộ: WS + AudioContext + MediaStream.
   */
  const stopAll = useCallback(() => {
    isStoppingRef.current = true;

    // Clear reconnect timer
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    // Gửi Terminate message trước khi đóng WebSocket
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: "Terminate" }));
      } catch { /* ignore */ }
      // Đợi 200ms để server xử lý Terminate trước khi đóng
      setTimeout(() => {
        try { ws.close(1000, "Session ended"); } catch { /* ignore */ }
      }, 200);
    }
    wsRef.current = null;

    // Stop AudioWorklet/ScriptProcessor
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch { /* ignore */ }
      processorRef.current = null;
    }
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch { /* ignore */ }
      sourceRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch { /* ignore */ }
      audioCtxRef.current = null;
    }

    // Stop mic tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    reconnectAttemptsRef.current = 0;
    setStatus("stopped");
  }, []);

  /**
   * Chuyển Float32 audio samples sang PCM16 Int16Array.
   * AssemblyAI yêu cầu raw PCM 16-bit little-endian.
   */
  const float32ToPCM16 = (float32Array: Float32Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  };

  /**
   * Khởi động mic + AudioContext + ScriptProcessor để capture audio.
   */
  const startAudio = useCallback(
    async (ws: WebSocket): Promise<void> => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: SAMPLE_RATE,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamRef.current = stream;

        const audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
        audioCtxRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        sourceRef.current = source;

        // ScriptProcessorNode — đủ tốt cho production (AudioWorklet phức tạp hơn)
        // Buffer size 1024 = ~64ms @16kHz, acceptable latency
        const processor = audioCtx.createScriptProcessor(1024, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (event) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const inputData = event.inputBuffer.getChannelData(0);
          const pcm16 = float32ToPCM16(inputData);
          try {
            ws.send(pcm16);
          } catch { /* ignore send errors */ }
        };

        source.connect(processor);
        processor.connect(audioCtx.destination);
      } catch (err: any) {
        console.error("[VoiceTranscript] Failed to start audio:", err);
        throw err;
      }
    },
    []
  );

  /**
   * Kết nối đến AssemblyAI WebSocket.
   */
  const connect = useCallback(async () => {
    if (!enabled || !lessonId || !accessToken || isStoppingRef.current) return;

    setStatus("connecting");
    setError(null);

    const token = await fetchToken();
    if (!token) {
      setStatus("error");
      setError("Không thể lấy token AssemblyAI. Kiểm tra cấu hình server.");
      return;
    }

    sessionStartMs.current = Date.now();

    const url = `${ASSEMBLYAI_WS_URL}?token=${token}&speech_model=universal&sample_rate=${SAMPLE_RATE}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = async () => {
      if (isStoppingRef.current) {
        ws.close();
        return;
      }
      console.info("[VoiceTranscript] Connected to AssemblyAI");
      reconnectAttemptsRef.current = 0;
      try {
        await startAudio(ws);
        setStatus("active");
      } catch (err: any) {
        setStatus("error");
        setError("Không thể truy cập microphone: " + (err.message ?? ""));
        ws.close();
      }
    };

    const turnStartMs = { current: Date.now() };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);

        if (msg.type === "Begin") {
          turnStartMs.current = Date.now();
          console.info("[VoiceTranscript] Session started:", msg.id);
        } else if (msg.type === "Turn") {
          const transcript: string = msg.transcript ?? "";
          const isEndOfTurn: boolean = msg.end_of_turn ?? false;

          if (isEndOfTurn && transcript.trim()) {
            const startTimeMs = Math.max(
              0,
              turnStartMs.current - sessionStartMs.current
            );
            void saveTranscriptSegment(transcript.trim(), startTimeMs);
            turnStartMs.current = Date.now();
          }
        } else if (msg.type === "Termination") {
          console.info(
            "[VoiceTranscript] Session terminated — audio:",
            msg.audio_duration_seconds,
            "s"
          );
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
      console.info(
        `[VoiceTranscript] WS closed: code=${event.code} reason="${event.reason}"`
      );

      // Stop audio resources
      if (processorRef.current) {
        try { processorRef.current.disconnect(); } catch { /* ignore */ }
        processorRef.current = null;
      }
      if (sourceRef.current) {
        try { sourceRef.current.disconnect(); } catch { /* ignore */ }
        sourceRef.current = null;
      }

      // Reconnect nếu đóng bất ngờ (không phải do stopAll hay mic off)
      if (
        !isStoppingRef.current &&
        event.code !== 1000 &&
        reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
      ) {
        reconnectAttemptsRef.current += 1;
        const delay = RECONNECT_DELAY_MS * reconnectAttemptsRef.current;
        console.info(
          `[VoiceTranscript] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`
        );
        setStatus("reconnecting");
        reconnectTimerRef.current = setTimeout(() => {
          void connect();
        }, delay);
      } else if (!isStoppingRef.current) {
        setStatus("stopped");
      }
    };
  }, [enabled, lessonId, accessToken, fetchToken, startAudio, saveTranscriptSegment]);

  /**
   * Start/stop khi isMicOn thay đổi.
   */
  useEffect(() => {
    if (!enabled || !lessonId || !accessToken) return;

    if (isMicOn) {
      isStoppingRef.current = false;
      // Chỉ connect nếu chưa active
      if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
        void connect();
      }
    } else {
      // Mic tắt → dừng session
      stopAll();
    }
  }, [isMicOn, enabled, lessonId, accessToken, connect, stopAll]);

  /**
   * Cleanup khi component unmount.
   */
  useEffect(() => {
    return () => {
      isStoppingRef.current = true;
      stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, error };
}
