"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
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

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

/** A single ruby segment: text + optional furigana reading */
type Seg = { t: string; r?: string };

type SenseiMessage = {
  id: number;
  role: "ai" | "user";
  /** AI messages: ruby-annotated segments */
  segments?: Seg[];
  /** User messages: plain Japanese text */
  textJp?: string;
  textVn?: string;
  feedback?: "good" | "bad";
};

type AssistantMessage = {
  id: number;
  role: "ai" | "user";
  textJp?: string;
  textVn?: string;
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

const SENSEI_INITIAL: SenseiMessage[] = [
  {
    id: 1,
    role: "ai",
    segments: [
      { t: "こんにちは", r: "konnichiwa" },
      { t: "、ミン・アインさん。" },
      { t: "今日", r: "kyou" },
      { t: "は" },
      { t: "買", r: "ka" },
      { t: "い" },
      { t: "物", r: "mono" },
      { t: "について" },
      { t: "話", r: "hana" },
      { t: "しましょうか？" },
    ],
    textVn:
      "Xin chào Minh Anh. Hôm nay chúng ta cùng nói chuyện về chủ đề mua sắm nhé?",
  },
  {
    id: 2,
    role: "user",
    textJp: "はい、いいですよ。スーパーに行きたいです。",
    textVn: "Vâng, được thôi ạ. Tôi muốn đi siêu thị.",
    feedback: "good",
  },
  {
    id: 3,
    role: "ai",
    segments: [
      { t: "いいですね。スーパーで" },
      { t: "何", r: "nani" },
      { t: "を" },
      { t: "買", r: "ka" },
      { t: "いたいですか？" },
    ],
    textVn: "Hay quá. Bạn muốn mua gì ở siêu thị?",
  },
];

const ASSISTANT_INITIAL: AssistantMessage[] = [
  {
    id: 1,
    role: "ai",
    textVn: "Xin chào! Tôi là Trợ giảng AI của FUJI. Bạn muốn học gì hôm nay?",
  },
];

/* ------------------------------------------------------------------ */
/* Shared sub-components                                                */
/* ------------------------------------------------------------------ */

/** Renders japanese text with furigana ruby annotations */
const RubyText = memo(function RubyText({ segments }: { segments: Seg[] }) {
  return (
    <>
      {segments.map((seg, i) =>
        seg.r ? (
          <ruby key={i}>
            {seg.t}
            <rt>{seg.r}</rt>
          </ruby>
        ) : (
          <span key={i}>{seg.t}</span>
        ),
      )}
    </>
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
  const [messages] = useState<SenseiMessage[]>(SENSEI_INITIAL);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(true); // AI starts speaking
  const [showHistory, setShowHistory] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("N4");
  const [selectedTopic, setSelectedTopic] = useState("shopping");

  const handleMicClick = useCallback(() => {
    setIsListening((prev) => !prev);
    // Simulate: when user starts listening, AI stops; when user stops, AI speaks
    setIsSpeaking((prev) => prev); // will be driven by real AI later
  }, []);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main voice area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center relative p-6 bg-gradient-to-b from-background to-muted/30">
          {/* Background glow effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[100px]" />
          </div>

          {/* Floating AI chibi avatar */}
          <div className="relative z-10 flex flex-col items-center mb-8 w-full max-w-lg">
            <div className="relative w-64 h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 animate-[float_6s_ease-in-out_infinite] group">
              {/* Glow behind avatar */}
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/20 to-primary/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
              {/* Chroma-keyed video avatar — no interaction */}
              <div className="w-full h-full flex items-center justify-center relative">
                <ChromaKeyVideo
                  src={SENSEI_VIDEO_SRC}
                  playing={isSpeaking}
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              </div>
              {/* "Sensei đang nghe" badge */}
              <div className="absolute -top-4 -right-8 bg-card/90 dark:bg-card/90 backdrop-blur text-foreground px-4 py-2 rounded-2xl rounded-bl-none shadow-lg rotate-6 animate-pulse z-20 border border-border">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 bg-green-500 rounded-full" />
                  <p className="text-xs font-bold">Sensei đang nghe...</p>
                </div>
              </div>
            </div>
          </div>

          {/* Big microphone button */}
          <div className="relative z-20 mb-12">
            {isListening && (
              <>
                <div className="absolute inset-0 bg-secondary/30 rounded-full blur-2xl animate-pulse" />
                <div className="absolute -inset-4 border border-secondary/20 rounded-full animate-ping opacity-20" />
              </>
            )}
            <Button
              onClick={handleMicClick}
              className={`relative size-20 md:size-24 rounded-full flex items-center justify-center border-4 border-background transition-all duration-300 group ${
                isListening
                  ? "bg-gradient-to-br from-pink-500 to-rose-600 shadow-[0_0_40px_rgba(244,114,182,0.4)] hover:shadow-[0_0_60px_rgba(244,114,182,0.6)] hover:scale-105"
                  : "bg-gradient-to-br from-pink-500/80 to-rose-600/80 shadow-[0_0_20px_rgba(244,114,182,0.2)] hover:shadow-[0_0_40px_rgba(244,114,182,0.4)] hover:scale-105"
              }`}
            >
              <span className="material-symbols-outlined text-4xl md:text-5xl text-white drop-shadow-md group-hover:animate-pulse">
                mic
              </span>
            </Button>
            <p className="absolute -bottom-10 w-48 -left-12 text-center text-xs font-bold text-secondary uppercase tracking-widest opacity-80 animate-pulse">
              Nhấn để nói
            </p>
          </div>

          {/* Conversation history panel */}
          <div className="w-full max-w-2xl z-10 shrink-0">
            <div className="bg-card/70 backdrop-blur-xl border border-border rounded-2xl overflow-hidden shadow-2xl flex flex-col">
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
                <div className="p-5 max-h-44 overflow-y-auto space-y-4">
                  {messages.map((msg) =>
                    msg.role === "ai" ? (
                      <div key={msg.id} className="flex gap-4">
                        <div className="shrink-0 size-8 rounded-full bg-gradient-to-br from-secondary to-purple-600 p-0.5 mt-1">
                          <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                            <span className="material-symbols-outlined text-sm text-secondary">
                              smart_toy
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {msg.segments && (
                            <p className="text-foreground text-base font-medium leading-relaxed [&_rt]:text-[0.6em] [&_rt]:text-muted-foreground [&_rt]:font-normal">
                              <RubyText segments={msg.segments} />
                            </p>
                          )}
                          {msg.textVn && (
                            <p className="text-xs text-muted-foreground italic">
                              &ldquo;{msg.textVn}&rdquo;
                            </p>
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
                    ),
                  )}

                  {/* Voice recognition indicator */}
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
                        Đang nhận diện giọng nói...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
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
  const [messages, setMessages] =
    useState<AssistantMessage[]>(ASSISTANT_INITIAL);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState("N4");
  const [selectedTopic, setSelectedTopic] = useState("shopping");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", textJp: trimmed },
    ]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          textVn:
            "Đây là câu trả lời từ Trợ giảng AI. Tôi sẽ giải thích ngữ pháp này chi tiết cho bạn!",
        },
      ]);
    }, 2000);
  }, [input]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex justify-center">
            <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
              Hôm nay, 10:30 AM
            </span>
          </div>

          {messages.map((msg) =>
            msg.role === "ai" ? (
              <div key={msg.id} className="flex items-start gap-4 max-w-3xl">
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
                    {msg.textJp && (
                      <p className="font-bold text-lg mb-1">{msg.textJp}</p>
                    )}
                    {msg.textVn && <p className="text-sm">{msg.textVn}</p>}
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

          {isTyping && <TypingIndicator label="Trợ giảng đang soạn..." />}
          <div ref={messagesEndRef} />
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
