"use client";

import { useState, useRef, useEffect, useCallback, memo, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import {
  useGetVoiceSessionsQuery,
  useGetVoiceSessionDetailQuery,
  useGetPublishedTopicsQuery,
} from "@/store/services/voice/voiceApi";
import { useAIChatSocket } from "@/providers/AIChatSocketProvider";
import type { VoiceTranscriptItem, VoiceSessionHistory, VoiceTopic } from "@/types/voice";
import {
  FuriganaDisplay,
  RightSidebar,
  type SenseiMessage,
} from "./shared";

/* ------------------------------------------------------------------ */
/* ChromaKeyVideo — removes white background from a video source        */
/* ------------------------------------------------------------------ */

const SENSEI_VIDEO_SRC = "/video/Chibi_Ninja_Sensei_Video_Generation.mp4";

/**
 * Chroma-key canvas that removes white background from a <video> source.
 * Crops the middle 80% vertically (cuts 10% top + 10% bottom).
 * Only plays while `playing` prop is true.
 */
const ChromaKeyVideo = memo(function ChromaKeyVideo({
  src,
  playing,
  className,
}: {
  src: string;
  playing: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  /* Play / pause the hidden <video> */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      video.play().catch(() => { });
    } else {
      video.pause();
    }
  }, [playing]);

  /* requestAnimationFrame loop — draw chroma-keyed frames to canvas */
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const WHITE_THRESHOLD = 220; // R,G,B all above this → transparent

    const draw = () => {
      if (video.paused || video.ended) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (vw === 0 || vh === 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      /* Crop middle 80%: skip top 10%, take 80%, skip bottom 10% */
      const cropY = Math.floor(vh * 0.1);
      const cropH = Math.floor(vh * 0.8);

      /* Size canvas to match cropped aspect ratio */
      if (canvas.width !== vw || canvas.height !== cropH) {
        canvas.width = vw;
        canvas.height = cropH;
      }

      ctx.drawImage(video, 0, cropY, vw, cropH, 0, 0, vw, cropH);
      const frame = ctx.getImageData(0, 0, vw, cropH);
      const d = frame.data;

      for (let i = 0; i < d.length; i += 4) {
        if (
          d[i] > WHITE_THRESHOLD &&
          d[i + 1] > WHITE_THRESHOLD &&
          d[i + 2] > WHITE_THRESHOLD
        ) {
          d[i + 3] = 0; // alpha → 0
        }
      }

      ctx.putImageData(frame, 0, 0);
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <>
      {/* Hidden video source — no controls, no interaction */}
      <video
        ref={videoRef}
        src={src}
        muted
        loop
        playsInline
        preload="auto"
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
        tabIndex={-1}
      />
      {/* Visible chroma-keyed canvas */}
      <canvas
        ref={canvasRef}
        className={className}
        style={{ pointerEvents: "none" }}
      />
    </>
  );
});

/* ------------------------------------------------------------------ */
/* SenseiPanel — voice conversation with AI avatar                      */
/* ------------------------------------------------------------------ */

export default function SenseiPanel() {
  const [showHistory, setShowHistory] = useState(true);

  // Topics & Scenarios state
  const { data: rawTopics, isFetching: topicsLoading } = useGetPublishedTopicsQuery();
  const topics: VoiceTopic[] = Array.isArray(rawTopics) ? (rawTopics as VoiceTopic[]) : [];
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);

  // Auto-select first topic and its first scenario when data loads
  useEffect(() => {
    if (topics.length > 0 && !selectedTopicId) {
      setSelectedTopicId(topics[0].id);
      if (Array.isArray(topics[0].scenarios) && topics[0].scenarios.length > 0) {
        setSelectedScenarioId(topics[0].scenarios[0].id);
      }
    }
  }, [topics, selectedTopicId]);

  // Derived selected entities
  const selectedTopic = topics.find((t) => t.id === selectedTopicId);
  const selectedScenario = selectedTopic?.scenarios?.find((s) => s.id === selectedScenarioId);

  // Handle topic change
  const handleTopicChange = (topicIdStr: string) => {
    const topicId = Number(topicIdStr);
    setSelectedTopicId(topicId);
    const topic = topics.find((t) => t.id === topicId);
    if (topic && topic.scenarios && topic.scenarios.length > 0) {
      setSelectedScenarioId(topic.scenarios[0].id);
    } else {
      setSelectedScenarioId(null);
    }
  };

  // Popup state
  const [showEvaluationPopup, setShowEvaluationPopup] = useState(false);

  // Session history
  const [showSessionList, setShowSessionList] = useState(false);
  const [selectedSessionCode, setSelectedSessionCode] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const { data: sessions, refetch: refetchSessions } = useGetVoiceSessionsQuery(
    undefined,
    { skip: !showSessionList },
  );
  const { data: sessionDetail, isFetching: isLoadingDetail } =
    useGetVoiceSessionDetailQuery(selectedSessionCode!, {
      skip: !selectedSessionCode,
    });

  const { socket } = useAIChatSocket();

  const handleAutoClose = useCallback(() => {
    setShowEvaluationPopup(true);
  }, []);

  const voice = useVoiceChat({
    socket,
    onError: (err: string) => console.error("Voice error:", err),
    onAudioProgress: setAudioProgress,
    onAutoClose: handleAutoClose,
  });

  const {
    state,
    startSession,
    startRecording,
    stopRecording,
    stopSession,
    isSessionActive,
  } = voice;

  const isPlaying = state.status === "playing";
  const isRecording = state.status === "recording";
  const isProcessing = state.status === "processing";

  const handleStartSession = useCallback(() => {
    if (!selectedTopic || !selectedScenario) return;
    setSelectedSessionCode(null);
    startSession({
      level: selectedScenario.level,
      context: `Chủ đề: ${selectedTopic.title}. Tình huống: ${selectedScenario.situation}. Vai trò AI: ${selectedScenario.aiRole}. Tính cách: ${selectedScenario.aiPersonality || "thân thiện"}. Mẫu hội thoại:\n${selectedScenario.sampleConversation || ""}`,
      goals: "Luyện phát âm tự nhiên, phản xạ nhanh và sử dụng đúng từ vựng/ngữ pháp",
      preferredVoice: "alloy",
      topicId: selectedTopic.id,
      scenarioId: selectedScenario.id,
      openingLine: selectedScenario.openingLine || undefined,
    });
  }, [startSession, selectedScenario, selectedTopic, isSessionActive]);

  const handleStopSession = useCallback(async () => {
    await stopSession();
    if (showSessionList) refetchSessions();
  }, [stopSession, showSessionList, refetchSessions]);

  const handleMicDown = useCallback(() => {
    if (!isSessionActive || isProcessing || isPlaying) return;
    startRecording();
  }, [isSessionActive, isProcessing, isPlaying, startRecording]);

  const handleMicUp = useCallback(() => {
    if (!isRecording) return;
    stopRecording();
  }, [isRecording, stopRecording]);

  // Transcript messages
  const displayMessages: SenseiMessage[] = useMemo(() => {
    return state.transcriptHistory.map((t: VoiceTranscriptItem, i: number) => ({
      id: i,
      role: t.role === "user" ? ("user" as const) : ("ai" as const),
      textJp: t.transcript,
      textVn: t.translationVi,
      furigana: t.furigana,
      audioBase64: t.audioBase64,
      audioFormat: t.audioFormat,
    }));
  }, [state.transcriptHistory]);

  // Replay audio state
  const [replayIdx, setReplayIdx] = useState<number | null>(null);
  const [replayProgress, setReplayProgress] = useState(0);
  const replayAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleReplay = useCallback(
    (msg: SenseiMessage) => {
      if (!msg.audioBase64 || isPlaying) return;
      if (replayAudioRef.current) {
        replayAudioRef.current.pause();
        replayAudioRef.current = null;
      }
      const audio = new Audio(
        `data:audio/${msg.audioFormat || "mp3"};base64,${msg.audioBase64}`,
      );
      replayAudioRef.current = audio;
      setReplayIdx(msg.id);
      setReplayProgress(0);
      audio.ontimeupdate = () => {
        if (audio.duration > 0) {
          setReplayProgress(audio.currentTime / audio.duration);
        }
      };
      audio.onended = () => {
        setReplayProgress(1);
        setTimeout(() => {
          setReplayIdx(null);
          setReplayProgress(0);
          replayAudioRef.current = null;
        }, 600);
      };
      audio.onerror = () => {
        setReplayIdx(null);
        replayAudioRef.current = null;
      };
      audio.play().catch(() => {
        setReplayIdx(null);
        replayAudioRef.current = null;
      });
    },
    [isPlaying],
  );

  // Cleanup replay audio on unmount
  useEffect(() => {
    return () => {
      replayAudioRef.current?.pause();
    };
  }, []);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main voice area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center relative p-4 bg-gradient-to-b from-background to-muted/30 overflow-y-auto">
          {/* Background glow effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[100px]" />
          </div>

          {/* Floating AI chibi avatar */}
          <div className="relative z-10 flex flex-col items-center mb-2 w-full max-w-lg">
            <div className="relative w-36 h-36 md:w-44 md:h-44 lg:w-52 lg:h-52 animate-[float_6s_ease-in-out_infinite] group">
              {/* Glow behind avatar */}
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/20 to-primary/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
              {/* Chroma-keyed video avatar */}
              <div className="w-full h-full flex items-center justify-center relative">
                <ChromaKeyVideo
                  src={SENSEI_VIDEO_SRC}
                  playing={isPlaying}
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              </div>
              {/* Sensei status badge */}
              <div className="absolute -top-4 -right-8 bg-card/90 dark:bg-card/90 backdrop-blur text-foreground px-4 py-2 rounded-2xl rounded-bl-none shadow-lg rotate-6 animate-pulse z-20 border border-border">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`size-2 rounded-full ${isSessionActive
                      ? isRecording
                        ? "bg-red-500"
                        : isProcessing
                          ? "bg-yellow-500"
                          : isPlaying
                            ? "bg-green-500"
                            : "bg-green-500"
                      : "bg-gray-400"
                      }`}
                  />
                  <p className="text-xs font-bold">
                    {!isSessionActive && state.status === "idle" && "Bắt đầu phiên để nói"}
                    {isSessionActive && state.status === "idle" && "Giữ mic để nói"}
                    {state.status === "recording" && "Đang nghe bạn nói..."}
                    {state.status === "processing" && "Đang xử lý..."}
                    {state.status === "playing" && "Sensei đang nói..."}
                    {state.status === "error" && "Lỗi"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Session start/stop + mic buttons */}
          <div className="relative z-20 mb-6 flex flex-col items-center gap-3">
            {!isSessionActive ? (
              <Button
                onClick={handleStartSession}
                className="px-6 py-3 rounded-full bg-gradient-to-br from-secondary to-purple-600 text-white font-bold text-sm shadow-lg shadow-secondary/30 hover:shadow-xl hover:scale-105 transition-all"
              >
                <span className="material-symbols-outlined mr-2">
                  play_arrow
                </span>
                Bắt đầu phiên hội thoại
              </Button>
            ) : (
              <>
                {/* Push-to-talk mic button */}
                <div className="relative">
                  {isRecording && (
                    <>
                      <div className="absolute inset-0 bg-red-500/30 rounded-full blur-2xl animate-pulse" />
                      <div className="absolute -inset-4 border border-red-500/20 rounded-full animate-ping opacity-20" />
                    </>
                  )}
                  {isPlaying && (
                    <>
                      <div className="absolute inset-0 bg-secondary/30 rounded-full blur-2xl animate-pulse" />
                    </>
                  )}
                  <Button
                    onPointerDown={handleMicDown}
                    onPointerUp={handleMicUp}
                    onPointerLeave={handleMicUp}
                    disabled={isProcessing || isPlaying}
                    className={`relative size-16 md:size-20 rounded-full flex items-center justify-center border-4 border-background transition-all duration-300 group ${isRecording
                      ? "bg-gradient-to-br from-red-500 to-rose-600 shadow-[0_0_40px_rgba(239,68,68,0.4)] scale-110"
                      : isProcessing
                        ? "bg-gradient-to-br from-yellow-500 to-orange-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] cursor-wait"
                        : isPlaying
                          ? "bg-gradient-to-br from-secondary to-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.3)] cursor-wait"
                          : "bg-gradient-to-br from-pink-500/80 to-rose-600/80 shadow-[0_0_20px_rgba(244,114,182,0.2)] hover:shadow-[0_0_40px_rgba(244,114,182,0.4)] hover:scale-105"
                      }`}
                  >
                    <span className="material-symbols-outlined text-3xl md:text-4xl text-white drop-shadow-md">
                      {isRecording
                        ? "mic"
                        : isProcessing
                          ? "hourglass_top"
                          : isPlaying
                            ? "volume_up"
                            : "mic"}
                    </span>
                  </Button>
                  <p className="absolute -bottom-8 w-48 -left-14 text-center text-[10px] font-bold text-secondary uppercase tracking-widest opacity-80">
                    {isRecording
                      ? "Thả để gửi"
                      : isProcessing
                        ? "Đang xử lý..."
                        : isPlaying
                          ? "Sensei đang nói..."
                          : "Giữ mic để nói"}
                  </p>
                </div>

                {/* Stop session button */}
                <Button
                  onClick={handleStopSession}
                  disabled={isRecording || isProcessing}
                  className="mt-4 px-4 py-2 rounded-full bg-muted border border-border text-sm font-medium text-foreground hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all"
                >
                  <span className="material-symbols-outlined text-lg mr-1">
                    stop
                  </span>
                  Kết thúc phiên
                </Button>
              </>
            )}
          </div>

          {/* Error message */}
          {state.error && (
            <div className="z-10 mb-4 px-4 py-2 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
              {state.error}
            </div>
          )}

          {/* Conversation history panel */}
          <div className="w-full max-w-2xl z-10 shrink-0">
            <div className="bg-card/70 backdrop-blur-xl border border-border rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[30vh]">
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    forum
                  </span>
                  <h3 className="text-sm font-bold text-foreground">
                    Lịch sử hội thoại
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Hiện lịch sử
                  </span>
                  <Switch
                    checked={showHistory}
                    onCheckedChange={() => setShowHistory((p) => !p)}
                    className="data-[state=checked]:bg-secondary"
                  />
                </div>
              </div>

              {/* Panel body — conversation messages */}
              {showHistory && (
                <div className="p-4 flex-1 overflow-y-auto space-y-3">
                  {/* Voice indicator — recording / processing */}
                  {(isRecording || isProcessing) && (
                    <div className="flex gap-4 opacity-70">
                      <div className="shrink-0 size-8 rounded-full bg-muted mt-1 border border-border flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm text-muted-foreground">
                          person
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-primary">
                        <span className="flex gap-1 h-3 items-center">
                          <span className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                          <span
                            className="w-1 h-2 bg-primary rounded-full animate-bounce"
                            style={{ animationDelay: "75ms" }}
                          />
                          <span
                            className="w-1 h-1 bg-primary rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                        </span>
                        <p className="text-sm font-medium">
                          {isRecording ? "Đang thu âm..." : "Đang xử lý..."}
                        </p>
                      </div>
                    </div>
                  )}

                  {displayMessages.length === 0 && !isSessionActive && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Bắt đầu phiên hội thoại để nói chuyện với Sensei
                    </p>
                  )}
                  {[...displayMessages].reverse().map((msg) => {
                    const isLastAi =
                      msg.role === "ai" &&
                      msg.id === displayMessages.length - 1;
                    const isReplaying = replayIdx === msg.id;
                    const karaokeIndex =
                      isLastAi && isPlaying && msg.furigana?.segments
                        ? Math.floor(audioProgress * msg.furigana.segments.length) - 1
                        : isReplaying && msg.furigana?.segments
                          ? Math.floor(replayProgress * msg.furigana.segments.length) - 1
                          : isLastAi && !isPlaying && msg.furigana?.segments
                            ? msg.furigana.segments.length
                            : -1;

                    return msg.role === "ai" ? (
                      <div key={msg.id} className="flex gap-4">
                        <div className="shrink-0 size-8 rounded-full bg-gradient-to-br from-secondary to-purple-600 p-0.5 mt-1">
                          <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                            <span className="material-symbols-outlined text-sm text-secondary">
                              smart_toy
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                          {msg.furigana?.segments ? (
                            <FuriganaDisplay
                              furigana={msg.furigana}
                              highlightIndex={karaokeIndex}
                            />
                          ) : (
                            <>
                              {msg.textJp && (
                                <p className="text-foreground text-base font-medium leading-relaxed">
                                  {msg.textJp}
                                </p>
                              )}
                              {msg.textVn && (
                                <p className="text-xs text-muted-foreground italic">
                                  🇻🇳 {msg.textVn}
                                </p>
                              )}
                            </>
                          )}
                          {/* Replay button */}
                          {msg.audioBase64 && (
                            <button
                              onClick={() => handleReplay(msg)}
                              disabled={isPlaying || isReplaying}
                              className={`mt-1 inline-flex items-center gap-1 text-xs transition-colors ${isReplaying
                                ? "text-secondary"
                                : "text-muted-foreground hover:text-secondary"
                                } disabled:opacity-50`}
                            >
                              <span className="material-symbols-outlined text-sm">
                                {isReplaying ? "volume_up" : "replay"}
                              </span>
                              {isReplaying ? "Đang phát..." : "Nghe lại"}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div key={msg.id} className="flex gap-4 opacity-70">
                        <div className="shrink-0 size-8 rounded-full bg-muted mt-1 border border-border flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm text-muted-foreground">
                            person
                          </span>
                        </div>
                        <div className="space-y-1">
                          {msg.textJp && (
                            <p className="text-foreground text-base font-medium leading-relaxed">
                              {msg.textJp}
                            </p>
                          )}
                          {msg.textVn && (
                            <p className="text-xs text-muted-foreground italic">
                              &ldquo;{msg.textVn}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Nút xem lịch sử session */}
          <div className="z-10 mt-3 mb-2">
            <Button
              onClick={() => {
                setShowSessionList((p) => !p);
                if (!showSessionList) setSelectedSessionCode(null);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm font-medium text-foreground hover:bg-muted transition-all"
            >
              <span className="material-symbols-outlined text-lg">
                {showSessionList ? "close" : "history"}
              </span>
              {showSessionList ? "Đóng lịch sử" : "Xem lịch sử hội thoại gần đây"}
            </Button>
          </div>

          {/* Session history list */}
          {showSessionList && !selectedSessionCode && (
            <div className="w-full max-w-2xl z-10 mb-2">
              <div className="bg-card/70 backdrop-blur-xl border border-border rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/20">
                  <span className="material-symbols-outlined text-primary text-lg">
                    history
                  </span>
                  <h3 className="text-sm font-bold text-foreground">
                    Các phiên hội thoại trước
                  </h3>
                </div>
                <div className="p-3 max-h-48 overflow-y-auto space-y-2">
                  {!sessions || sessions.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Chưa có phiên hội thoại nào
                    </p>
                  ) : (
                    sessions.map((s: VoiceSessionHistory) => (
                      <button
                        key={s.sessionCode}
                        onClick={() => setSelectedSessionCode(s.sessionCode)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted border border-border/50 hover:border-primary/30 transition-all text-left group"
                      >
                        <div
                          className={`size-9 rounded-full flex items-center justify-center shrink-0 ${s.status === "completed"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-yellow-500/10 text-yellow-500"
                            }`}
                        >
                          <span className="material-symbols-outlined text-lg">
                            {s.status === "completed" ? "check_circle" : "pending"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                              {s.context || "Hội thoại"}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold shrink-0">
                              {s.level}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {new Date(s.createdAt).toLocaleString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-muted-foreground group-hover:text-primary text-lg transition-colors">
                          chevron_right
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Session detail view */}
          {selectedSessionCode && (
            <div className="w-full max-w-2xl z-10 mb-2">
              <div className="bg-card/70 backdrop-blur-xl border border-border rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedSessionCode(null)}
                      className="size-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">
                        arrow_back
                      </span>
                    </button>
                    <h3 className="text-sm font-bold text-foreground">
                      {sessionDetail?.context || "Chi tiết phiên"}
                    </h3>
                    {sessionDetail && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                        {sessionDetail.level}
                      </span>
                    )}
                  </div>
                  {sessionDetail && (
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(sessionDetail.createdAt).toLocaleString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                <div className="p-5 max-h-56 overflow-y-auto space-y-4">
                  {isLoadingDetail ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex gap-1">
                        {[0, 150, 300].map((delay) => (
                          <span
                            key={delay}
                            className="size-2 bg-primary rounded-full animate-bounce"
                            style={{ animationDelay: `${delay}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : !sessionDetail?.transcripts ||
                    sessionDetail.transcripts.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Phiên này chưa có nội dung hội thoại
                    </p>
                  ) : (
                    sessionDetail.transcripts.map(
                      (t: VoiceTranscriptItem, i: number) => (
                        <div
                          key={i}
                          className={`flex gap-3 ${t.role === "user" ? "opacity-80" : ""}`}
                        >
                          <div
                            className={`shrink-0 size-8 rounded-full mt-0.5 flex items-center justify-center ${t.role === "assistant"
                              ? "bg-gradient-to-br from-secondary to-purple-600 p-0.5"
                              : "bg-muted border border-border"
                              }`}
                          >
                            {t.role === "assistant" ? (
                              <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                                <span className="material-symbols-outlined text-sm text-secondary">
                                  smart_toy
                                </span>
                              </div>
                            ) : (
                              <span className="material-symbols-outlined text-sm text-muted-foreground">
                                person
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-muted-foreground mb-0.5">
                              {t.role === "assistant" ? "Sensei" : "Bạn"}
                            </p>
                            <p className="text-sm text-foreground leading-relaxed">
                              {t.transcript}
                            </p>
                            {t.role === "assistant" && t.audioUrl && (
                              <button
                                onClick={() => {
                                  const audio = new Audio(t.audioUrl);
                                  audio.play().catch(() => { });
                                }}
                                className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-secondary transition-colors"
                              >
                                <span className="material-symbols-outlined text-sm">
                                  replay
                                </span>
                                Nghe lại
                              </button>
                            )}
                          </div>
                        </div>
                      ),
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <RightSidebar
        settingsTitle="Thiết lập cho Sensei"
        feedbackTitle="Nhận xét của Sensei"
        topics={topics}
        selectedTopicId={selectedTopicId}
        onTopicChange={handleTopicChange}
        scenarios={selectedTopic?.scenarios || []}
        selectedScenarioId={selectedScenarioId}
        onScenarioChange={(v) => setSelectedScenarioId(Number(v))}
        disabled={isSessionActive}
      />

      {/* Evaluation Popup */}
      {showEvaluationPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <span className="material-symbols-outlined text-3xl">sports_score</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Đã hoàn thành!</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Bạn đã hoàn thành đủ số lượt hội thoại của kịch bản này. Bạn có muốn xem điểm không?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="w-full font-bold"
                  onClick={() => setShowEvaluationPopup(false)}
                >
                  Nói tiếp
                </Button>
                <Button
                  className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90"
                  onClick={() => {
                    setShowEvaluationPopup(false);
                    handleStopSession();
                  }}
                >
                  Xem kết quả
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
