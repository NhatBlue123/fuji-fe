"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type JLPTLevel = "N1" | "N2" | "N3" | "N4" | "N5";

const LEVEL_COLORS: Record<JLPTLevel, { gradient: string; badge: string }> = {
  N1: { gradient: "from-red-600 via-rose-700 to-red-900", badge: "bg-red-500" },
  N2: {
    gradient: "from-orange-500 via-amber-700 to-orange-900",
    badge: "bg-orange-500",
  },
  N3: {
    gradient: "from-blue-600 via-indigo-700 to-blue-900",
    badge: "bg-blue-500",
  },
  N4: {
    gradient: "from-violet-600 via-purple-700 to-violet-900",
    badge: "bg-violet-500",
  },
  N5: {
    gradient: "from-emerald-600 via-teal-700 to-emerald-900",
    badge: "bg-emerald-500",
  },
};

const LEVEL_LABELS: Record<JLPTLevel, string> = {
  N1: "Nâng cao",
  N2: "Trung cấp cao",
  N3: "Trung cấp",
  N4: "Sơ cấp cao",
  N5: "Sơ cấp",
};

// Dots loading animation
function SearchingDots() {
  return (
    <span className="inline-flex gap-1 items-end h-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce"
          style={{ animationDelay: `${i * 0.18}s`, animationDuration: "0.8s" }}
        />
      ))}
    </span>
  );
}

function SakuraFall({ density = 18 }: { density?: number }) {
  return (
    <div className="sakura-layer">
      {Array.from({ length: density }).map((_, i) => {
        const left = (i / density) * 100;
        const duration = 9 + (i % 6) * 1.25;
        const delay = (i % 9) * -1.3;
        const size = 10 + (i % 5) * 2;
        const opacity = 0.25 + (i % 7) * 0.08;
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
            }}
          />
        );
      })}
    </div>
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
  const [cameraReady, setCameraReady] = useState(false);

  // Determine default level
  const getDefaultLevel = (): JLPTLevel => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("autoSearch");
      if (saved) return saved as JLPTLevel;
    }
    if (authUser?.level) return authUser.level as JLPTLevel;
    return "N3";
  };

  const [level, setLevel] = useState<JLPTLevel>(getDefaultLevel);

  const { gradient: levelGrad, badge: levelBadge } = LEVEL_COLORS[level];

  // ── Start camera on mount ─────────────────────────────────────────────────
  useEffect(() => {
    webrtc
      .startLocalStream()
      .then(() => setCameraReady(true))
      .catch(() => setCameraReady(false));
    return () => webrtc.cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach local stream to video element
  useEffect(() => {
    if (!localVideoRef.current || !webrtc.localStream) return;
    localVideoRef.current.srcObject = webrtc.localStream;
    // Some browsers need an explicit play() after srcObject is set.
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
      // NOTE: do NOT call webrtc.cleanup() here — room page takes over the camera
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

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-between overflow-hidden transition-all duration-700",
        `bg-gradient-to-br ${levelGrad}`,
      )}
      style={{ height: "calc(100vh - 64px)" }}
    >
      <SakuraFall density={22} />
      {/* ── Blurred background pattern ── */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* ── Top header ── */}
      <div className="relative z-50 flex flex-col items-center gap-2 pt-8">
        {/* Level badge + picker toggle */}
        <div className="relative">
          <button
            onClick={() => !isSearching && setShowLevelPicker((o) => !o)}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-full font-black text-white shadow-xl text-base tracking-wider transition-transform",
              levelBadge,
              !isSearching && "hover:scale-105 cursor-pointer",
              isSearching && "cursor-default",
            )}
          >
            JLPT {level}
            {!isSearching && <ChevronDown className="h-4 w-4 opacity-70" />}
          </button>

          {/* Level dropdown */}
          {showLevelPicker && !isSearching && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl z-[200] min-w-[160px]">
              {(["N1", "N2", "N3", "N4", "N5"] as JLPTLevel[]).map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setLevel(l);
                    setShowLevelPicker(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 text-white text-sm font-semibold hover:bg-white/20 transition-colors flex justify-between items-center",
                    l === level && "bg-white/20",
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

        {isSearching ? (
          <div className="flex items-center gap-2 text-white/90 font-semibold text-lg">
            <span>Đang tìm bạn học</span>
            <SearchingDots />
          </div>
        ) : (
          <p className="text-white/70 text-sm">
            Nhấn để chọn trình độ • Bắt đầu tìm bạn luyện nói
          </p>
        )}
      </div>

      {/* ── Main: Camera + Partner ── */}
      <div className="relative z-10 flex items-center justify-center gap-4 flex-1 px-6 w-full max-w-3xl">
        {/* User camera */}
        <div className="relative flex-1 max-w-sm aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 bg-black/40">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              "w-full h-full object-cover scale-x-[-1]", // mirror effect
              !isCameraOn && "opacity-0",
            )}
          />

          {/* Loading overlay while stream is starting */}
          {!webrtc.localStream && isCameraOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55">
              <Loader2 className="h-7 w-7 text-white/70 animate-spin mb-2" />
              <p className="text-white/60 text-sm">Đang bật camera...</p>
            </div>
          )}

          {/* Camera off overlay */}
          {!isCameraOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
              <VideoOff className="h-10 w-10 text-white/40 mb-2" />
              <p className="text-white/40 text-sm">Camera tắt</p>
            </div>
          )}

          {/* "Bạn" label */}
          <div className="absolute top-3 left-3">
            <span className="bg-black/40 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
              {authUser?.fullname || authUser?.username || "Bạn"}
            </span>
          </div>

          {/* Mic/Camera status pills */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            <span
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
                isMicOn
                  ? "bg-green-500/80 text-white"
                  : "bg-red-500/80 text-white",
              )}
            >
              {isMicOn ? (
                <Mic className="h-3 w-3" />
              ) : (
                <MicOff className="h-3 w-3" />
              )}
              {isMicOn ? "Mic bật" : "Mic tắt"}
            </span>
            <span
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
                isCameraOn
                  ? "bg-green-500/80 text-white"
                  : "bg-red-500/80 text-white",
              )}
            >
              {isCameraOn ? (
                <Video className="h-3 w-3" />
              ) : (
                <VideoOff className="h-3 w-3" />
              )}
              {isCameraOn ? "Cam bật" : "Cam tắt"}
            </span>
          </div>
        </div>

        {/* Partner placeholder */}
        <div className="relative flex-1 max-w-sm aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10 bg-black/20 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          {isSearching ? (
            <>
              {/* Ripple animation */}
              <div className="relative flex items-center justify-center">
                <div
                  className="absolute w-28 h-28 rounded-full bg-white/5 animate-ping"
                  style={{ animationDuration: "1.5s" }}
                />
                <div
                  className="absolute w-20 h-20 rounded-full bg-white/10 animate-ping"
                  style={{ animationDuration: "1.5s", animationDelay: "0.3s" }}
                />
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-base">Đang tìm</p>
                <p className="text-white/60 text-sm mt-1 font-mono">
                  {formatTime(waitSeconds)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                <Users className="h-8 w-8 text-white/40" />
              </div>
              <p className="text-white/50 text-sm text-center px-4">
                Nhấn "Bắt đầu" để
                <br />
                tìm bạn luyện nói
              </p>
            </>
          )}

          {/* "Đối tác" label */}
          <div className="absolute top-3 left-3">
            <span className="bg-black/30 backdrop-blur-sm text-white/60 text-xs font-bold px-3 py-1 rounded-full">
              Đối tác
            </span>
          </div>
        </div>
      </div>

      {/* ── Bottom controls ── */}
      <div className="relative z-10 flex items-center justify-center gap-4 pb-8">
        {/* Mic toggle */}
        <button
          onClick={webrtc.toggleMic}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95",
            isMicOn
              ? "bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/20"
              : "bg-red-500 hover:bg-red-600 text-white",
          )}
        >
          {isMicOn ? (
            <Mic className="h-6 w-6" />
          ) : (
            <MicOff className="h-6 w-6" />
          )}
        </button>

        {/* Camera toggle */}
        <button
          onClick={webrtc.toggleCamera}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95",
            isCameraOn
              ? "bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/20"
              : "bg-red-500 hover:bg-red-600 text-white",
          )}
        >
          {isCameraOn ? (
            <Video className="h-6 w-6" />
          ) : (
            <VideoOff className="h-6 w-6" />
          )}
        </button>

        {/* Main action button */}
        {!isSearching ? (
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 h-14 px-8 rounded-full bg-white text-gray-900 font-bold text-base shadow-2xl hover:scale-105 active:scale-95 transition-transform"
          >
            <Radio className="h-5 w-5 animate-pulse text-blue-600" />
            Bắt đầu
          </button>
        ) : (
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 h-14 px-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-base shadow-2xl active:scale-95 transition-all"
          >
            <X className="h-5 w-5" />
            Hủy
          </button>
        )}
      </div>
    </div>
  );
}
