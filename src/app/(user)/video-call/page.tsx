"use client";

import { useState, useEffect, useCallback, useRef, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/hooks";
import { useSignaling } from "@/hooks/useSignaling";
import { useWebRTC } from "@/hooks/useWebRTC";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  X,
  Radio,
  Users,
  Loader2,
  ChevronDown,
  PhoneOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

type JLPTLevel = "N1" | "N2" | "N3" | "N4" | "N5";

const LEVEL_LABELS: Record<JLPTLevel, string> = {
  N1: "Nâng cao",
  N2: "Trung cấp cao",
  N3: "Trung cấp",
  N4: "Sơ cấp cao",
  N5: "Sơ cấp",
};

// Sakura petal falling animation
function SakuraFall({ density = 18 }: { density?: number }) {
  return (
    <div className="sakura-layer">
      {Array.from({ length: density }).map((_, i) => {
        const left = (i / density) * 100;
        const duration = 9 + (i % 6) * 1.25;
        const delay = (i % 9) * -1.3;
        const size = 10 + (i % 5) * 2;
        const opacity = 0.3 + (i % 7) * 0.07;
        const sx = (i % 6) * 6 - 14;
        const sx2 = (i % 5) * 7 - 16;
        const r0 = (i % 7) * 25;
        const r1 = 220 + (i % 9) * 30;

        return (
          <span
            key={i}
            className="sakura-item sakura-petal"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              opacity,
              animationDuration: `${duration}s, ${2.6 + (i % 4) * 0.35}s`,
              animationDelay: `${delay}s, ${delay * 0.6}s`,
              ["--sx"]: `${sx}px`,
              ["--sx2"]: `${sx2}px`,
              ["--r0"]: `${r0}deg`,
              ["--r1"]: `${r1}deg`,
            } as CSSProperties}
          />
        );
      })}
    </div>
  );
}

// Animated dots for loading
function SearchingDots() {
  return (
    <span className="inline-flex gap-1 items-end h-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce"
          style={{ animationDelay: `${i * 0.18}s`, animationDuration: "0.8s" }}
        />
      ))}
    </span>
  );
}

export default function VideoCallMatchingPage() {
  const router = useRouter();
  const signaling = useSignaling();
  const webrtc = useWebRTC();
  const { user: authUser } = useAuth();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [waitSeconds, setWaitSeconds] = useState(0);

  const getDefaultLevel = (): JLPTLevel => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("autoSearch");
      if (saved) return saved as JLPTLevel;
    }
    if (authUser?.level) return authUser.level as JLPTLevel;
    return "N5";
  };

  const [level, setLevel] = useState<JLPTLevel>(getDefaultLevel);

  // ── Start camera on mount ─────────────────────────────────────────────────
  useEffect(() => {
    webrtc.startLocalStream().catch(() => {});
    return () => webrtc.cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach local stream to video element
  useEffect(() => {
    if (!localVideoRef.current || !webrtc.localStream) return;
    localVideoRef.current.srcObject = webrtc.localStream;
    localVideoRef.current.play?.().catch(() => {});
  }, [webrtc.localStream]);

  // ── Listen for match-found ────────────────────────────────────────────────
  useEffect(() => {
    signaling.on<{
      roomId: string;
      peerId: string;
      peerName: string;
      peerAvatarUrl: string;
      peerLevel: string;
      isInitiator: boolean;
    }>("match-found", (data) => {
      const myName = authUser?.fullname || authUser?.username || "Ẩn danh";
      const myLevel = authUser?.level ?? level;
      sessionStorage.setItem(
        "matchData",
        JSON.stringify({ ...data, myName, myLevel }),
      );
      router.push(`/video-call/room/${data.roomId}`);
    });
    return () => signaling.off("match-found");
  }, [signaling, router, authUser, level]);

  // ── Wait timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSearching) return;
    const t = setInterval(() => setWaitSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isSearching]);

  // ── Auto-search from "Next" button ───────────────────────────────────────
  useEffect(() => {
    const autoLevel = sessionStorage.getItem("autoSearch");
    if (autoLevel) {
      sessionStorage.removeItem("autoSearch");
      setLevel(autoLevel as JLPTLevel);
      setTimeout(() => startSearch(autoLevel as JLPTLevel), 400);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSearch = useCallback(
    (searchLevel: JLPTLevel) => {
      setIsSearching(true);
      setWaitSeconds(0);
      const displayName = authUser?.fullname || authUser?.username || "Ẩn danh";
      const userId = String(
        authUser?.id ??
          authUser?._id ??
          "guest-" + Math.random().toString(36).slice(2, 8),
      );
      signaling.joinQueue({ userId, jlptLevel: searchLevel, displayName });
    },
    [signaling, authUser],
  );

  const handleSearch = useCallback(
    () => startSearch(level),
    [startSearch, level],
  );

  const handleCancel = useCallback(() => {
    setIsSearching(false);
    setWaitSeconds(0);
    signaling.leaveQueue();
  }, [signaling]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const isMicOn = webrtc.isMicOn;
  const isCameraOn = webrtc.isCameraOn;
  const userName = authUser?.fullname || authUser?.username || "Bạn";

  return (
    <div
      className="relative flex flex-col items-center justify-between overflow-hidden"
      style={{ height: "calc(100vh - 64px)" }}
    >
      {/* ── Mount Fuji Background ── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/fuji-bg.png')" }}
      />
      {/* Soft overlay for readability */}
      <div className="absolute inset-0 bg-white/30" />

      {/* ── Sakura petals ── */}
      <SakuraFall density={22} />

      {/* ── Top Title ── */}
      <div className="relative z-50 flex flex-col items-center gap-1 pt-8">
        <h1
          className="text-4xl font-bold tracking-wide"
          style={{
            color: "#2d2d2d",
            textShadow: "0 1px 8px rgba(255,255,255,0.8)",
          }}
        >
          Hội thoại tiếng Nhật
        </h1>
        <p className="text-sm text-gray-500">
          Luyện tiếng Nhật qua video call ngẫu nhiên
        </p>

        {/* Level Picker */}
        <div className="relative mt-3">
          <button
            onClick={() => !isSearching && setShowLevelPicker((o) => !o)}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-sm shadow-md transition-all",
              "bg-white/80 backdrop-blur-sm text-gray-700 border border-white/60 hover:bg-white/95",
              isSearching && "cursor-default opacity-80",
            )}
          >
            JLPT {level}
            {!isSearching && <ChevronDown className="h-4 w-4 opacity-60" />}
          </button>

          {/* Level dropdown */}
          {showLevelPicker && !isSearching && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl overflow-hidden shadow-2xl z-[500] min-w-[180px]">
              {(["N1", "N2", "N3", "N4", "N5"] as JLPTLevel[]).map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setLevel(l);
                    setShowLevelPicker(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 text-gray-700 text-sm font-semibold hover:bg-rose-50 transition-colors flex justify-between items-center",
                    l === level && "bg-rose-50 text-rose-600",
                  )}
                >
                  <span>{l}</span>
                  <span className="opacity-60 text-xs font-normal">
                    {LEVEL_LABELS[l]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Main: Camera Cards (horizontal layout like reference) ── */}
      <div className="relative z-10 flex items-center justify-center gap-4 flex-1 px-4 w-full max-w-3xl mx-auto">
        
        {/* User camera — dark card */}
        <div className="relative rounded-[2rem] overflow-hidden shadow-2xl bg-gray-900"
          style={{ width: '300px', height: '400px', flexShrink: 0 }}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              "w-full h-full object-cover scale-x-[-1]",
              !isCameraOn && "opacity-0",
            )}
          />

          {/* Loading overlay */}
          {!webrtc.localStream && isCameraOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
              <Loader2 className="h-7 w-7 text-white/50 animate-spin mb-2" />
              <p className="text-white/40 text-xs">Đang bật camera...</p>
            </div>
          )}

          {/* Camera off overlay */}
          {!isCameraOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
              <VideoOff className="h-9 w-9 text-white/30 mb-2" />
              <p className="text-white/30 text-xs">Camera: TẮT</p>
            </div>
          )}

          {/* Name label top-left */}
          <div className="absolute top-3 left-3">
            <span className="text-white text-xs font-semibold px-1">
              Camera: {isCameraOn ? "BẬT" : "TẮT"}
            </span>
          </div>

          {/* User name bottom center */}
          <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2">
            <span className="text-white/90 text-sm font-medium" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
              {userName}
            </span>
            {/* Mic icon */}
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              isMicOn ? "bg-white/20" : "bg-red-500/80",
            )}>
              {isMicOn ? (
                <Mic className="h-4 w-4 text-white" />
              ) : (
                <MicOff className="h-4 w-4 text-white" />
              )}
            </div>
          </div>
        </div>

        {/* Partner card — light card */}
        <div
          className="relative rounded-[2rem] overflow-hidden shadow-xl flex flex-col items-center justify-center gap-4 bg-white/85 backdrop-blur-sm"
          style={{ width: '300px', height: '400px', flexShrink: 0 }}
        >
          {isSearching ? (
            <>
              {/* Ripple searching animation */}
              <div className="relative flex items-center justify-center">
                <div
                  className="absolute w-28 h-28 rounded-full bg-rose-100 animate-ping"
                  style={{ animationDuration: "1.8s" }}
                />
                <div
                  className="absolute w-20 h-20 rounded-full bg-rose-200/60 animate-ping"
                  style={{ animationDuration: "1.8s", animationDelay: "0.4s" }}
                />
                <div className="w-16 h-16 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center z-10">
                  <div className="w-10 h-10 rounded-full bg-blue-200/80 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-gray-700 font-semibold text-base">
                  Đang tìm đối tác...
                </p>
                <p className="text-gray-400 text-xs mt-1 font-mono">
                  {formatTime(waitSeconds)}
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Idle state */}
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="w-11 h-11 rounded-full bg-blue-200 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <div className="text-center px-4">
                <p className="text-gray-600 font-medium text-sm">
                  Tìm bạn luyện nói
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Nhấn Bắt đầu để kết nối...
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom controls ── */}
      <div className="relative z-10 flex flex-col items-center gap-3 pb-8">
        <div className="flex items-center gap-4">
          {/* Mic toggle */}
          <button
            onClick={webrtc.toggleMic}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95",
              isMicOn
                ? "bg-rose-500 hover:bg-rose-600 text-white"
                : "bg-rose-500 hover:bg-rose-600 text-white",
            )}
          >
            {isMicOn ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>

          {/* Main action button */}
          {!isSearching ? (
            <button
              onClick={handleSearch}
              className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-lg hover:bg-gray-50 active:scale-95 transition-all"
            >
              <Radio className="h-5 w-5 text-blue-500 animate-pulse" />
            </button>
          ) : (
            <button
              onClick={handleCancel}
              className="w-12 h-12 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          )}

          {/* Camera toggle */}
          <button
            onClick={webrtc.toggleCamera}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95",
              "bg-rose-500 hover:bg-rose-600 text-white",
            )}
          >
            {isCameraOn ? (
              <VideoOff className="h-5 w-5" />
            ) : (
              <Video className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Bottom hint text */}
        <p className="text-gray-500 text-xs">
          Luyện hội thoại tiếng Nhật cùng đối tác ngẫu nhiên
        </p>
      </div>
    </div>
  );
}
