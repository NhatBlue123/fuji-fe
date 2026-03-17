"use client";

import { useState, useRef, useEffect, useCallback, memo, useMemo } from "react";
import { useAuth } from "@/store/hooks";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import {
  useGetVoiceSessionsQuery,
  useGetVoiceSessionDetailQuery,
} from "@/store/services/voice/voiceApi";
import type {
  VoiceTranscriptItem,
  VoiceSessionHistory,
  FuriganaData,
} from "@/types/voice";

/* ------------------------------------------------------------------ */
/* n8n Sensei API                                                       */
/* ------------------------------------------------------------------ */

async function callSensei(
  userInput: string,
  sessionId: string,
): Promise<string> {
  const N8N_URL = process.env.NEXT_PUBLIC_N8N_SENSEI_URL!;
  const response = await fetch(N8N_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatInput: userInput,
      sessionId,
    }),
  });
  const data = await response.text();
  return data;
}

/** Tách <think>...</think> ra khỏi phần nội dung chính */
function parseResponse(raw: string): { think: string; content: string } {
  const m = raw.match(/<think>([\s\S]*?)<\/think>/i);
  const think = m ? m[1].trim() : "";
  const content = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  return { think, content };
}

/** Khối think — có thể mở/đóng */
const ThinkBlock = memo(function ThinkBlock({ content }: { content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="material-symbols-outlined text-sm">
          {open ? "expand_less" : "expand_more"}
        </span>
        💭 Đã suy nghĩ xong
      </button>
      {open && (
        <div className="mt-1 text-xs text-muted-foreground bg-muted/40 border border-border/50 rounded-lg p-3 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
      )}
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

type SenseiMessage = {
  id: number;
  role: "ai" | "user";
  textJp?: string;
  textVn?: string;
  furigana?: FuriganaData;
  audioBase64?: string;
  audioFormat?: string;
  feedback?: "good" | "bad";
};

type AssistantMessage = {
  id: number;
  role: "ai" | "user";
  textJp?: string;
  textVn?: string;
  think?: string;
};

type PracticeMode = "sensei" | "assistant";

/* ------------------------------------------------------------------ */
/* Constants                                                            */
/* ------------------------------------------------------------------ */

const LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;

const TOPICS = [
  { value: "shopping", label: "Mua sắm (Shopping)" },
  { value: "interview", label: "Phỏng vấn xin việc" },
  { value: "restaurant", label: "Đặt món tại nhà hàng" },
  { value: "direction", label: "Hỏi đường" },
] as const;

const ASSISTANT_CHIPS = [
  { emoji: "📚", text: "Giải thích ngữ pháp て-form" },
  { emoji: "🔤", text: "Cho ví dụ với から" },
  { emoji: "❓", text: "Sự khác nhau giữa は và が" },
  { emoji: "✍️", text: "Luyện viết Hiragana" },
];

/* ------------------------------------------------------------------ */
/* Shared sub-components                                                */
/* ------------------------------------------------------------------ */

/**
 * Furigana display with karaoke highlight.
 * `highlightIndex` = index of last highlighted segment (-1 = none, segments.length = all).
 */
const FuriganaDisplay = memo(function FuriganaDisplay({
  furigana,
  highlightIndex,
}: {
  furigana: FuriganaData;
  highlightIndex: number;
}) {
  return (
    <div className="space-y-2">
      {/* Main line: kanji + furigana */}
      <p className="text-foreground text-base font-medium leading-[2.2] flex flex-wrap gap-x-1">
        {furigana.segments.map((seg, i) => {
          const active = i <= highlightIndex;
          return (
            <ruby
              key={i}
              className={`transition-colors duration-300 ${
                active
                  ? "text-secondary"
                  : highlightIndex >= 0
                    ? "text-muted-foreground/50"
                    : "text-foreground"
              }`}
            >
              {seg.kanji}
              {seg.hiragana && seg.hiragana !== seg.kanji && (
                <rt className="text-[0.6em] font-normal text-muted-foreground">
                  {seg.hiragana}
                </rt>
              )}
            </ruby>
          );
        })}
      </p>
      {/* Romaji line */}
      <p className="text-xs text-muted-foreground/60 leading-relaxed flex flex-wrap gap-x-2">
        {furigana.segments.map((seg, i) => (
          <span
            key={i}
            className={`transition-colors duration-300 ${
              i <= highlightIndex ? "text-secondary/70" : ""
            }`}
          >
            {seg.romaji}
          </span>
        ))}
      </p>
      {/* Vietnamese translation */}
      {furigana.translation && (
        <p className="text-xs text-muted-foreground italic">
          🇻🇳 {furigana.translation}
        </p>
      )}
    </div>
  );
});

/** Three bouncing dots with label */
const TypingIndicator = memo(function TypingIndicator({
  label,
}: {
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 ml-14 opacity-60">
      <div className="flex gap-1">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1.5 bg-muted-foreground rounded-full animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
});

/** Shared input area — receives string labels instead of boolean flags */
const ChatInputArea = memo(function ChatInputArea({
  input,
  onInputChange,
  onSend,
  chips,
  placeholder,
  showEmoji = false,
  showMic = false,
}: {
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  chips: { emoji: string; text: string }[];
  placeholder: string;
  showEmoji?: boolean;
  showMic?: boolean;
}) {
  return (
    <div className="p-6 border-t border-border bg-background/80 backdrop-blur-sm shrink-0">
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {chips.map((chip) => (
          <Button
            key={chip.text}
            onClick={() => onInputChange(chip.text)}
            className="whitespace-nowrap px-4 py-2 rounded-full bg-muted border border-border text-xs font-medium text-foreground hover:bg-card hover:border-primary/40 hover:text-primary transition-all"
          >
            {chip.emoji} {chip.text}
          </Button>
        ))}
      </div>
      <div className="relative flex items-center gap-3">
        <div className="flex-1 relative">
          <Input
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            className="w-full bg-card border border-border text-foreground rounded-xl py-3.5 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-muted-foreground shadow-sm transition-all"
            placeholder={placeholder}
            type="text"
          />
          {showEmoji && (
            <Button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <span className="material-symbols-outlined">
                sentiment_satisfied
              </span>
            </Button>
          )}
        </div>
        {showMic && (
          <Button className="p-3.5 rounded-xl bg-muted border border-border text-foreground hover:bg-card transition-all flex items-center justify-center group shadow-sm">
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
              mic
            </span>
          </Button>
        )}
        <Button
          onClick={onSend}
          disabled={!input.trim()}
          className="p-3.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center shadow-lg shadow-primary/20 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined group-hover:translate-x-0.5 transition-transform">
            send
          </span>
        </Button>
      </div>
    </div>
  );
});

/** Shared right sidebar — receives string labels, not boolean mode prop */
const RightSidebar = memo(function RightSidebar({
  settingsTitle,
  feedbackTitle,
  selectedTopic,
  onTopicChange,
  selectedLevel,
  onLevelChange,
}: {
  settingsTitle: string;
  feedbackTitle: string;
  selectedTopic: string;
  onTopicChange: (v: string) => void;
  selectedLevel: string;
  onLevelChange: (v: string) => void;
}) {
  return (
    <aside className="w-80 border-l border-border bg-card/50 overflow-y-auto hidden lg:block shrink-0">
      {/* Settings */}
      <div className="p-6 border-b border-border">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-secondary">
            tune
          </span>
          {settingsTitle}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Chủ đề hội thoại
            </label>
            <Select value={selectedTopic} onValueChange={onTopicChange}>
              <SelectTrigger className="w-full bg-card border border-border text-foreground text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all">
                <SelectValue placeholder="Chọn chủ đề" />
              </SelectTrigger>
              <SelectContent>
                {TOPICS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Trình độ mục tiêu
            </label>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((lvl) => (
                <Button
                  key={lvl}
                  onClick={() => onLevelChange(lvl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    selectedLevel === lvl
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {lvl}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback */}
      <div className="p-6 border-b border-border">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-secondary">
            psychology
          </span>
          {feedbackTitle}
        </h3>
        <div className="space-y-4">
          <div className="bg-green-500/5 border border-green-500/20 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2 text-green-600 dark:text-green-400">
              <span className="material-symbols-outlined text-lg">
                check_circle
              </span>
              <span className="text-xs font-bold uppercase">Điểm mạnh</span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              Phát âm từ vựng về &ldquo;địa điểm&rdquo; rất rõ ràng. Phản xạ trả
              lời câu hỏi &ldquo;Đi đâu&rdquo; nhanh chóng.
            </p>
          </div>
          <div className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2 text-orange-600 dark:text-orange-400">
              <span className="material-symbols-outlined text-lg">warning</span>
              <span className="text-xs font-bold uppercase">Cần cải thiện</span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              Chú ý trợ từ &ldquo;ni&rdquo; (に) khi nói về đích đến. Bạn đôi
              khi dùng nhầm thành &ldquo;de&rdquo; (で).
            </p>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      <div className="p-6 pb-8">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-primary">
            lightbulb
          </span>
          Đề xuất tiếp theo
        </h3>
        <div className="space-y-3">
          <div className="group bg-card hover:bg-muted border border-border rounded-xl p-3 transition-all cursor-pointer">
            <div className="flex gap-3">
              <div className="size-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-lg">
                  edit_note
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground group-hover:text-secondary transition-colors">
                  Luyện Kanji N4
                </h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Bài 12: Chủ đề Mua sắm
                </p>
              </div>
            </div>
            <Button className="mt-3 w-full py-1.5 rounded bg-muted text-xs text-foreground font-medium hover:bg-secondary hover:text-secondary-foreground transition-colors border border-border">
              Luyện ngay
            </Button>
          </div>
          <div className="group bg-card hover:bg-muted border border-border rounded-xl p-3 transition-all cursor-pointer">
            <div className="flex gap-3">
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-lg">
                  assignment
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  Đề JLPT N4 - Đọc hiểu
                </h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Luyện tập đoạn văn ngắn
                </p>
              </div>
            </div>
            <Button className="mt-3 w-full py-1.5 rounded bg-muted text-xs text-foreground font-medium hover:bg-primary hover:text-primary-foreground transition-colors border border-border">
              Làm bài
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
});

/* ------------------------------------------------------------------ */
/* SenseiPanel — explicit variant: voice conversation with AI avatar    */
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
      video.play().catch(() => {});
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

function SenseiPanel() {
  const [showHistory, setShowHistory] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("N4");
  const [selectedTopic, setSelectedTopic] = useState("shopping");

  // Session history
  const [showSessionList, setShowSessionList] = useState(false);
  const [selectedSessionCode, setSelectedSessionCode] = useState<string | null>(
    null,
  );
  const [audioProgress, setAudioProgress] = useState(0);
  const { data: sessions, refetch: refetchSessions } = useGetVoiceSessionsQuery(
    undefined,
    {
      skip: !showSessionList,
    },
  );
  const { data: sessionDetail, isFetching: isLoadingDetail } =
    useGetVoiceSessionDetailQuery(selectedSessionCode!, {
      skip: !selectedSessionCode,
    });

  const voice = useVoiceChat({
    onError: (err: string) => console.error("Voice error:", err),
    onAudioProgress: setAudioProgress,
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

  // Map topic value sang label tiếng Việt cho context
  const topicLabel = useMemo(() => {
    const found = TOPICS.find((t) => t.value === selectedTopic);
    return found ? found.label : selectedTopic;
  }, [selectedTopic]);

  const handleStartSession = useCallback(() => {
    setSelectedSessionCode(null);
    startSession({
      level: selectedLevel,
      context: `Luyện hội thoại: ${topicLabel}`,
      goals: "luyện phản xạ giao tiếp tự nhiên",
      preferredVoice: "alloy",
    });
  }, [startSession, selectedLevel, topicLabel]);

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

  // Transcript messages cho hiển thị
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
      // Dừng replay hiện tại nếu có
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
              {/* Chroma-keyed video avatar — no interaction */}
              <div className="w-full h-full flex items-center justify-center relative">
                <ChromaKeyVideo
                  src={SENSEI_VIDEO_SRC}
                  playing={isPlaying}
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              </div>
              {/* "Sensei status" badge */}
              <div className="absolute -top-4 -right-8 bg-card/90 dark:bg-card/90 backdrop-blur text-foreground px-4 py-2 rounded-2xl rounded-bl-none shadow-lg rotate-6 animate-pulse z-20 border border-border">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`size-2 rounded-full ${
                      isSessionActive
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
                    {!isSessionActive &&
                      state.status === "idle" &&
                      "Bắt đầu phiên để nói"}
                    {isSessionActive &&
                      state.status === "idle" &&
                      "Giữ mic để nói"}
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
                    className={`relative size-16 md:size-20 rounded-full flex items-center justify-center border-4 border-background transition-all duration-300 group ${
                      isRecording
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
                  {/* Voice indicator — recording / processing (mới nhất → trên cùng) */}
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
                    // Karaoke: live play (last AI) hoặc replay (bất kỳ AI nào)
                    const isReplaying = replayIdx === msg.id;
                    const karaokeIndex =
                      isLastAi && isPlaying && msg.furigana
                        ? Math.floor(
                            audioProgress * msg.furigana.segments.length,
                          ) - 1
                        : isReplaying && msg.furigana
                          ? Math.floor(
                              replayProgress * msg.furigana.segments.length,
                            ) - 1
                          : isLastAi && !isPlaying && msg.furigana
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
                          {msg.furigana ? (
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
                              className={`mt-1 inline-flex items-center gap-1 text-xs transition-colors ${
                                isReplaying
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

          {/* Nút xem lịch sử session — đặt dưới lịch sử hội thoại hiện tại */}
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
              {showSessionList
                ? "Đóng lịch sử"
                : "Xem lịch sử hội thoại gần đây"}
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
                          className={`size-9 rounded-full flex items-center justify-center shrink-0 ${
                            s.status === "completed"
                              ? "bg-green-500/10 text-green-500"
                              : "bg-yellow-500/10 text-yellow-500"
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg">
                            {s.status === "completed"
                              ? "check_circle"
                              : "pending"}
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

          {/* Session detail view — xem transcript của session cũ */}
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
                      {new Date(sessionDetail.createdAt).toLocaleString(
                        "vi-VN",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
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
                            className={`shrink-0 size-8 rounded-full mt-0.5 flex items-center justify-center ${
                              t.role === "assistant"
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
                                  audio.play().catch(() => {});
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
        selectedTopic={selectedTopic}
        onTopicChange={setSelectedTopic}
        selectedLevel={selectedLevel}
        onLevelChange={setSelectedLevel}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AssistantPanel — explicit variant: study chatbot (plain text)        */
/* ------------------------------------------------------------------ */

function AssistantPanel() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState("N4");
  const [selectedTopic, setSelectedTopic] = useState("shopping");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Đếm thời gian chờ khi đang gọi API
  useEffect(() => {
    if (!isTyping) {
      setElapsedMs(0);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => setElapsedMs(Date.now() - start), 100);
    return () => clearInterval(id);
  }, [isTyping]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const sessionId = user?._id ?? user?.id?.toString() ?? "anonymous";
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", textJp: trimmed },
    ]);
    setInput("");
    setIsTyping(true);
    try {
      const raw = await callSensei(trimmed, sessionId);
      const { think, content } = parseResponse(raw);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "ai", textVn: content, think },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          textVn: "⚠️ Không thể kết nối Sensei. Vui lòng thử lại sau.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [input, user]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && !isTyping ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
              <div className="size-16 rounded-full bg-gradient-to-br from-primary to-indigo-600 p-0.5 shadow-lg shadow-primary/20">
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl">
                    smart_toy
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  Trợ giảng AI FUJI
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Hỏi bất kỳ điều gì về tiếng Nhật — ngữ pháp, từ vựng, JLPT...
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                {ASSISTANT_CHIPS.map((chip) => (
                  <button
                    key={chip.text}
                    onClick={() => setInput(chip.text)}
                    className="px-3 py-1.5 rounded-full bg-muted border border-border text-xs font-medium text-foreground hover:bg-card hover:border-primary/40 hover:text-primary transition-all"
                  >
                    {chip.emoji} {chip.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {new Date().toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </div>

              {messages.map((msg) =>
                msg.role === "ai" ? (
                  <div
                    key={msg.id}
                    className="flex items-start gap-4 max-w-3xl"
                  >
                    <div className="size-10 rounded-full bg-gradient-to-br from-primary to-indigo-600 p-0.5 shrink-0 shadow-lg shadow-primary/20">
                      <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-base">
                          smart_toy
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="text-xs text-muted-foreground font-medium ml-1">
                        Trợ giảng AI
                      </div>
                      <div className="bg-card border border-border p-4 rounded-2xl rounded-tl-none shadow-sm text-foreground leading-relaxed">
                        {msg.think && <ThinkBlock content={msg.think} />}
                        {msg.textJp && (
                          <p className="font-bold text-lg mb-1">{msg.textJp}</p>
                        )}
                        {msg.textVn && (
                          <div
                            className="prose prose-sm dark:prose-invert max-w-none text-sm
                        [&_h1]:text-base [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:mt-3
                        [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mb-1.5 [&_h2]:mt-3
                        [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-1 [&_h3]:mt-2
                        [&_p]:mb-2 [&_p]:leading-relaxed
                        [&_ul]:mb-2 [&_ul]:pl-4 [&_ul]:list-disc
                        [&_ol]:mb-2 [&_ol]:pl-4 [&_ol]:list-decimal
                        [&_li]:mb-0.5
                        [&_strong]:font-semibold [&_strong]:text-foreground
                        [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
                        [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-2
                        [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
                        [&_hr]:border-border [&_hr]:my-2"
                          >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.textVn}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Button
                          variant="ghost"
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          title="Sao chép"
                        >
                          <span className="material-symbols-outlined text-lg">
                            content_copy
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    key={msg.id}
                    className="flex items-start gap-4 max-w-3xl ml-auto flex-row-reverse"
                  >
                    <div className="size-10 rounded-full bg-muted shrink-0 border border-border flex items-center justify-center">
                      <span className="material-symbols-outlined text-muted-foreground">
                        person
                      </span>
                    </div>
                    <div className="bg-primary text-primary-foreground p-4 rounded-2xl rounded-tr-none shadow-md shadow-primary/10 leading-relaxed">
                      <p className="text-base">{msg.textJp}</p>
                    </div>
                  </div>
                ),
              )}

              {isTyping && (
                <div className="flex items-center gap-2 ml-14 opacity-60">
                  <div className="flex gap-1">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="size-1.5 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Trợ giảng đang soạn...
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                    {(elapsedMs / 1000).toFixed(1)}s
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <ChatInputArea
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          chips={ASSISTANT_CHIPS}
          placeholder="Hỏi bất kỳ điều gì về tiếng Nhật..."
        />
      </div>

      <RightSidebar
        settingsTitle="Thiết lập Trợ giảng"
        feedbackTitle="Phân tích câu hỏi"
        selectedTopic={selectedTopic}
        onTopicChange={setSelectedTopic}
        selectedLevel={selectedLevel}
        onLevelChange={setSelectedLevel}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page shell — header + mode tabs + explicit panel variants            */
/* ------------------------------------------------------------------ */

export default function AIChatPage() {
  const [mode, setMode] = useState<PracticeMode>("assistant");

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border bg-background/90 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-30">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            Luyện tập AI
          </h2>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-1.5 bg-orange-500/10 text-orange-500 dark:text-orange-400 px-3 py-1 rounded-full text-sm font-bold border border-orange-500/20">
            <span className="material-symbols-outlined text-lg">
              local_fire_department
            </span>
            <span>15 ngày</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-lg">
              add_circle
            </span>
            Bắt đầu phiên mới
          </Button>
        </div>
      </header>

      {/* Mode tabs — Chatbot first, Sensei second */}
      <div className="flex border-b border-border bg-muted/30 shrink-0">
        <Button
          variant="ghost"
          onClick={() => setMode("assistant")}
          className={`flex items-center gap-2 px-6 py-4 border-b-2 font-bold text-sm transition-all ${
            mode === "assistant"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <span className="material-symbols-outlined text-lg">smart_toy</span>
          Chatbot AI
        </Button>
        <Button
          variant="ghost"
          onClick={() => setMode("sensei")}
          className={`flex items-center gap-2 px-6 py-4 border-b-2 font-bold text-sm transition-all ${
            mode === "sensei"
              ? "border-secondary text-secondary bg-secondary/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            record_voice_over
          </span>
          Giao tiếp với AI Sensei
        </Button>
      </div>

      {/* Render explicit variant — no conditional inside one component */}
      {mode === "assistant" ? <AssistantPanel /> : <SenseiPanel />}
    </div>
  );
}
