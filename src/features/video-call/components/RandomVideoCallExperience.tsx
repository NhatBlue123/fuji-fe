"use client";

import { useEffect, useRef, useState } from "react";
import {
  GraduationCap,
  Mic,
  MicOff,
  PhoneOff,
  Radio,
  RefreshCw,
  SkipForward,
  Video,
  VideoOff,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRandomVideoCall } from "../hooks/useRandomVideoCall";
import type { JLPTLevel, VideoCallMatchMode } from "../types";
import { ChatBox } from "./ChatBox";

const LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

const MATCH_MODES: Array<{
  value: VideoCallMatchMode;
  label: string;
}> = [
  { value: "same_level", label: "Cùng level" },
  { value: "over_level", label: "Over level" },
];

export default function RandomVideoCallExperience() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel>("N5");
  const [matchMode, setMatchMode] =
    useState<VideoCallMatchMode>("same_level");
  const call = useRandomVideoCall({ autoStart: false });

  useEffect(() => {
    if (localVideoRef.current && call.localStream) {
      localVideoRef.current.srcObject = call.localStream;
    }
  }, [call.localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && call.remoteStream) {
      remoteVideoRef.current.srcObject = call.remoteStream;
    }
  }, [call.remoteStream]);

  const isConnected = call.status === "connected";
  const isMatching =
    call.status === "searching" ||
    call.status === "matched" ||
    call.status === "calling" ||
    call.status === "reconnecting";
  const isBusy = isMatching || isConnected;
  const canStart = Boolean(call.localStream) && !isBusy;
  const statusLabel =
    call.status === "error"
      ? "Lỗi thiết bị"
      : call.status === "closed"
        ? "Đã dừng"
        : call.status === "idle"
          ? "Sẵn sàng"
          : isConnected
            ? "Đã kết nối"
            : isMatching
              ? "Đang matching"
              : "Đang chuẩn bị";

  const handleStartMatching = () => {
    call.startSearch({
      level: selectedLevel,
      matchMode,
    });
  };

  return (
    <div
      className="relative flex overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50"
      style={{ height: "calc(100vh - 64px)" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.15),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(244,63,94,0.10),transparent_34%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.22),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(244,63,94,0.16),transparent_34%)]" />

      <main className="relative z-10 flex min-h-0 flex-1 flex-col">
        <section className={cn(
          "grid min-h-0 flex-1 gap-4 bg-slate-100 p-4 dark:bg-slate-950",
          isConnected ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 lg:grid-cols-2"
        )}>
          <div className="relative min-h-[340px] overflow-hidden rounded-2xl border-4 border-sky-500/80 bg-slate-100 shadow-2xl dark:border-white/90 dark:bg-slate-950">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "h-full w-full scale-x-[-1] bg-slate-100 object-cover transition-opacity duration-300 dark:bg-slate-950",
                (!call.localStream || !call.isCameraOn) && "opacity-0",
              )}
            />

            {(!call.localStream || !call.isCameraOn) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50/98 px-6 text-center dark:bg-slate-950/92">
                {!call.localStream ? (
                  <RefreshCw className="h-9 w-9 animate-spin text-sky-500 dark:text-sky-300" />
                ) : (
                  <VideoOff className="h-9 w-9 text-slate-500 dark:text-slate-400" />
                )}
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Màn hình của bạn</h2>
                  <p className="mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-300">
                    {!call.localStream
                      ? call.notice
                      : "Camera đang tắt."}
                  </p>
                </div>
              </div>
            )}

            <div className="absolute left-5 top-5 flex items-center gap-2">
              <Badge className="rounded-full border border-sky-300 bg-sky-50/95 px-3 py-1 text-[11px] text-sky-700 dark:border-white/15 dark:bg-slate-900/75 dark:text-slate-100">
                Bạn
              </Badge>
              {!call.isMicOn && (
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-300/50 bg-rose-50/90 dark:border-rose-300/20 dark:bg-rose-500/15">
                  <MicOff className="h-4 w-4 text-rose-600 dark:text-rose-200" />
                </span>
              )}
            </div>
          </div>

          <div className="relative min-h-[340px] overflow-hidden rounded-2xl border-4 border-sky-500/80 bg-slate-100 shadow-2xl dark:border-white/90 dark:bg-slate-950">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={cn(
                "h-full w-full scale-x-[-1] bg-slate-100 object-cover transition-opacity duration-300 dark:bg-slate-950",
                (!call.remoteStream || !call.remoteMedia.video) && "opacity-0",
              )}
            />

            {(!call.remoteStream || !call.remoteMedia.video) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-slate-50/98 px-6 text-center dark:bg-slate-950/92">
                {isBusy ? (
                  <>
                    {call.status === "error" || call.status === "closed" ? (
                      <WifiOff className="h-10 w-10 text-rose-500 dark:text-rose-300" />
                    ) : (
                      <RefreshCw className="h-10 w-10 animate-spin text-sky-500 dark:text-sky-300" />
                    )}
                    <div>
                      <h1 className="text-xl font-semibold tracking-wide text-slate-900 dark:text-slate-50">
                        Đang đợi đối phương
                      </h1>
                      <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
                        {call.notice || "Đang thiết lập phòng gọi..."}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-sky-400/50 bg-sky-100/90 dark:border-sky-300/25 dark:bg-sky-400/15">
                      <GraduationCap className="h-7 w-7 text-sky-600 dark:text-sky-200" />
                    </div>
                    <div>
                      <h1 className="text-xl font-semibold tracking-wide text-slate-900 dark:text-slate-50">
                        Random Japanese Call
                      </h1>
                      <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
                        {call.notice || "Chọn bộ lọc rồi bắt đầu matching."}
                      </p>
                    </div>

                    <div className="w-full max-w-md space-y-4">
                      <div className="grid grid-cols-5 gap-2">
                        {LEVELS.map((level) => (
                          <button
                            key={level}
                            type="button"
                            className={cn(
                              "h-10 rounded-md border text-sm font-semibold transition",
                              selectedLevel === level
                                ? "border-sky-500 bg-sky-500 text-white dark:border-sky-300 dark:bg-sky-400 dark:text-slate-950"
                                : "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800",
                            )}
                            onClick={() => setSelectedLevel(level)}
                          >
                            {level}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {MATCH_MODES.map((mode) => (
                          <button
                            key={mode.value}
                            type="button"
                            className={cn(
                              "h-10 rounded-md border text-sm font-semibold transition",
                              matchMode === mode.value
                                ? "border-emerald-500 bg-emerald-500 text-white dark:border-emerald-300 dark:bg-emerald-400 dark:text-slate-950"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800",
                            )}
                            onClick={() => setMatchMode(mode.value)}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>

                      <Button
                        type="button"
                        className="h-12 w-full rounded-full bg-sky-500 text-white hover:bg-sky-600 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
                        onClick={handleStartMatching}
                        disabled={!canStart}
                      >
                        <Radio className="h-4 w-4" />
                        Bắt đầu matching
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="absolute left-5 top-5 flex items-center gap-2">
              <Badge
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px]",
                  isConnected
                    ? "border-emerald-400/60 bg-emerald-50/95 text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-400/15 dark:text-emerald-200"
                    : "border-sky-400/60 bg-sky-50/95 text-sky-700 dark:border-sky-300/25 dark:bg-sky-400/15 dark:text-sky-100",
                )}
              >
                {isConnected ? (
                  <Wifi className="mr-1 h-3 w-3" />
                ) : isMatching || call.status === "connecting" ? (
                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Radio className="mr-1 h-3 w-3" />
                )}
                {statusLabel}
              </Badge>
              {call.status === "reconnecting" && (
                <Badge className="rounded-full border border-amber-400/60 bg-amber-50/95 px-3 py-1 text-[11px] text-amber-700 dark:border-amber-300/30 dark:bg-amber-400/15 dark:text-amber-100">
                  Đang nối lại
                </Badge>
              )}
            </div>

            <div className="absolute right-5 top-5 flex items-center gap-2">
              {!call.remoteMedia.audio && (
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-200 bg-sky-50/95 dark:border-white/10 dark:bg-slate-900/75">
                  <MicOff className="h-4 w-4 text-rose-600 dark:text-rose-200" />
                </span>
              )}
              {call.remoteStream && !call.remoteMedia.video && (
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-200 bg-sky-50/95 dark:border-white/10 dark:bg-slate-900/75">
                  <VideoOff className="h-4 w-4 text-rose-600 dark:text-rose-200" />
                </span>
              )}
            </div>
          </div>
        </section>

        <footer className="relative z-20 flex shrink-0 flex-wrap items-center justify-center gap-3 border-t border-sky-200 bg-slate-50/98 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
          <Button
            type="button"
            size="icon"
            className="h-11 w-11 rounded-full bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700"
            onClick={call.toggleMic}
            disabled={!call.localStream}
            title={call.isMicOn ? "Tắt micro" : "Bật micro"}
          >
            {call.isMicOn ? <Mic /> : <MicOff />}
          </Button>

          <Button
            type="button"
            size="icon"
            className="h-11 w-11 rounded-full bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700"
            onClick={call.toggleCamera}
            disabled={!call.localStream}
            title={call.isCameraOn ? "Tắt camera" : "Bật camera"}
          >
            {call.isCameraOn ? <Video /> : <VideoOff />}
          </Button>

          <Button
            type="button"
            className={cn(
              "h-12 rounded-full px-7",
              isBusy
                ? "bg-rose-500 text-white hover:bg-rose-600 dark:hover:bg-rose-400"
                : "bg-sky-500 text-white hover:bg-sky-600 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400",
            )}
            onClick={isBusy ? call.endCall : handleStartMatching}
            disabled={!call.localStream}
          >
            {isBusy ? (
              <>
                <PhoneOff className="h-4 w-4" />
                Dừng
              </>
            ) : (
              <>
                <Radio className="h-4 w-4" />
                Matching
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-full border-sky-300 bg-sky-50 px-5 text-sky-700 hover:bg-sky-100 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-800"
            onClick={call.nextPeer}
            disabled={!isMatching && !isConnected}
          >
            <SkipForward className="h-4 w-4" />
            Next
          </Button>
        </footer>
      </main>

      {/* Chat Box - Right Side */}
      {isConnected && (
        <div className="relative z-10 w-80 flex-shrink-0 h-full">
          <ChatBox
            messages={call.chatMessages}
            onSendMessage={call.sendChatMessage}
            isBanned={call.isChatBanned}
            banUntil={call.chatBanUntil}
            violationCount={call.violationCount}
            showWarning={call.showWarning}
          />
        </div>
      )}
    </div>
  );
}
