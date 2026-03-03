"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSignaling } from "@/hooks/useSignaling";
import { Loader2, X, Radio, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type JLPTLevel = "N1" | "N2" | "N3" | "N4" | "N5";

const LEVEL_COLORS: Record<JLPTLevel, string> = {
  N1: "from-red-500 to-rose-600",
  N2: "from-orange-500 to-amber-600",
  N3: "from-yellow-500 to-amber-500",
  N4: "from-blue-500 to-indigo-600",
  N5: "from-green-500 to-emerald-600",
};

export default function VideoCallMatchingPage() {
  const router = useRouter();
  const signaling = useSignaling();

  const [level, setLevel] = useState<JLPTLevel>("N3");
  const [isSearching, setIsSearching] = useState(false);
  const [waitSeconds, setWaitSeconds] = useState(0);

  // ── Listen for match-found ────────────────────────────────────────────────
  useEffect(() => {
    signaling.on<{
      roomId: string; peerId: string; peerName: string;
      peerAvatarUrl: string; peerLevel: string; isInitiator: boolean;
    }>("match-found", (data) => {
      // Store match data for the room page
      sessionStorage.setItem("matchData", JSON.stringify(data));
      router.push(`/video-call/room/${data.roomId}`);
    });

    return () => signaling.off("match-found");
  }, [signaling, router]);

  // ── Wait timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isSearching) {
      interval = setInterval(() => setWaitSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  const handleSearch = useCallback(() => {
    setIsSearching(true);
    setWaitSeconds(0);
    signaling.joinQueue({
      userId: "user-" + Math.random().toString(36).slice(2, 8), // replace w/ real userId from auth
      jlptLevel: level,
      displayName: "User",
    });
  }, [signaling, level]);

  const handleCancel = useCallback(() => {
    setIsSearching(false);
    setWaitSeconds(0);
    signaling.leaveQueue();
  }, [signaling]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="h-full flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-8">

        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
            <Radio className="h-4 w-4 animate-pulse" />
            Luyện nói JLPT
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Tìm bạn luyện nói</h1>
          <p className="text-muted-foreground">
            Ghép đôi ngẫu nhiên với người học cùng trình độ, luyện hội thoại thực tế
          </p>
        </div>

        {/* Level picker */}
        {!isSearching && (
          <div className="space-y-3">
            <label className="text-sm font-semibold">Chọn trình độ của bạn</label>
            <Select value={level} onValueChange={(v) => setLevel(v as JLPTLevel)}>
              <SelectTrigger className="h-12 text-base font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["N1", "N2", "N3", "N4", "N5"] as JLPTLevel[]).map((l) => (
                  <SelectItem key={l} value={l} className="text-base">
                    {l} — {l === "N1" ? "Nâng cao" : l === "N2" ? "Trung cấp cao" : l === "N3" ? "Trung cấp" : l === "N4" ? "Sơ cấp cao" : "Sơ cấp"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={handleSearch}
              className={cn(
                "w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r text-white shadow-lg hover:scale-[1.02] transition-transform",
                LEVEL_COLORS[level]
              )}
            >
              <Users className="mr-2 h-5 w-5" />
              Tìm bạn {level}
            </Button>
          </div>
        )}

        {/* Searching animation */}
        {isSearching && (
          <div className="flex flex-col items-center gap-6 py-10">
            {/* Ripple animation */}
            <div className="relative">
              <div className={cn(
                "absolute inset-0 rounded-full bg-gradient-to-br opacity-20 animate-ping",
                LEVEL_COLORS[level]
              )} style={{ width: 120, height: 120, top: -20, left: -20 }} />
              <div className={cn(
                "w-20 h-20 rounded-full bg-gradient-to-br flex items-center justify-center shadow-xl",
                LEVEL_COLORS[level]
              )}>
                <span className="text-white font-black text-2xl">{level}</span>
              </div>
            </div>

            <div className="text-center space-y-1">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Đang tìm bạn luyện nói...
              </div>
              <p className="text-muted-foreground text-sm">
                Đã chờ: <span className="font-mono font-bold text-foreground">{formatTime(waitSeconds)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Ưu tiên ghép cùng trình độ {level} — nếu không tìm thấy sẽ ghép bất kỳ
              </p>
            </div>

            <Button
              variant="outline"
              onClick={handleCancel}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Hủy tìm kiếm
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
