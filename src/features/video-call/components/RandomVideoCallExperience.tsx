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
  Shield,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useRandomVideoCall } from "../hooks/useRandomVideoCall";
import type { JLPTLevel, VideoCallMatchMode } from "../types";
import { ChatBox } from "./ChatBox";
import { Label } from "@/components/ui/label";

const LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

const MATCH_MODES: Array<{
  value: VideoCallMatchMode;
  labelKey: string;
}> = [
  { value: "same_level", labelKey: "videoCall.random.matchModes.sameLevel" },
  { value: "over_level", labelKey: "videoCall.random.matchModes.overLevel" },
];

interface CallRule {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: React.ElementType;
  color: string;
}

const CALL_RULES: CallRule[] = [
  {
    id: "japanese_only",
    titleKey: "videoCall.random.rules.items.japaneseOnly.title",
    descriptionKey: "videoCall.random.rules.items.japaneseOnly.description",
    icon: GraduationCap,
    color: "text-blue-600",
  },
  {
    id: "no_pii",
    titleKey: "videoCall.random.rules.items.noPii.title",
    descriptionKey: "videoCall.random.rules.items.noPii.description",
    icon: EyeOff,
    color: "text-purple-600",
  },
  {
    id: "respectful",
    titleKey: "videoCall.random.rules.items.respectful.title",
    descriptionKey: "videoCall.random.rules.items.respectful.description",
    icon: CheckCircle2,
    color: "text-green-600",
  },
  {
    id: "no_record",
    titleKey: "videoCall.random.rules.items.noRecord.title",
    descriptionKey: "videoCall.random.rules.items.noRecord.description",
    icon: Eye,
    color: "text-amber-600",
  },
  {
    id: "appropriate_content",
    titleKey: "videoCall.random.rules.items.appropriateContent.title",
    descriptionKey: "videoCall.random.rules.items.appropriateContent.description",
    icon: Shield,
    color: "text-rose-600",
  },
];

function RulePreviewItem({ rule }: { rule: CallRule }) {
  const { t } = useTranslation();
  const Icon = rule.icon;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
      <div className="mt-0.5 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
        <Icon className={cn("h-5 w-5", rule.color)} />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            {t(rule.titleKey)}
          </p>
        </div>
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {t(rule.descriptionKey)}
        </p>
      </div>
    </div>
  );
}

function RulesHoverButton({
  iconOnly = false,
  placement = "bottom",
}: {
  iconOnly?: boolean;
  placement?: "bottom" | "top";
}) {
  const { t } = useTranslation();

  return (
    <div className="group relative inline-flex">
      <Button
        type="button"
        variant={iconOnly ? "ghost" : "outline"}
        size={iconOnly ? "icon" : "sm"}
        className={cn(
          "gap-2",
          iconOnly
            ? "h-11 w-11 rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            : "border-sky-200 bg-sky-50 hover:bg-sky-100 dark:border-white/10 dark:bg-slate-900/60 dark:hover:bg-slate-800",
        )}
        title={t("videoCall.random.rules.viewTitle")}
      >
        <Shield className="h-4 w-4 text-blue-600" />
        {!iconOnly && t("videoCall.random.rules.button")}
      </Button>

      <div
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 w-[min(24rem,calc(100vw-2rem))] opacity-0 shadow-2xl transition duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100",
          placement === "top"
            ? "bottom-full left-1/2 mb-3 -translate-x-1/2 translate-y-1 group-hover:translate-y-0 group-focus-within:translate-y-0"
            : "right-0 top-full mt-3 -translate-y-1 group-hover:translate-y-0 group-focus-within:translate-y-0",
        )}
      >
        <div className="rounded-2xl border border-sky-200 bg-white p-4 text-left text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50">
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/15">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="font-semibold">{t("videoCall.random.rules.title")}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {t("videoCall.random.rules.noticeDescription")}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {CALL_RULES.map((rule) => (
              <RulePreviewItem key={rule.id} rule={rule} />
            ))}
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t("videoCall.random.rules.noticeTitle")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RandomVideoCallExperience() {
  const { t } = useTranslation();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel>("N5");
  const [matchMode, setMatchMode] = useState<VideoCallMatchMode>("same_level");
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
      ? t("videoCall.random.status.deviceError")
      : call.status === "closed"
        ? t("videoCall.random.status.closed")
        : call.status === "idle"
          ? t("videoCall.random.status.ready")
          : isConnected
            ? t("videoCall.random.status.connected")
            : isMatching
              ? t("videoCall.random.status.matching")
              : t("videoCall.random.status.preparing");

  const handleStartMatching = () => {
    call.startSearch({
      level: selectedLevel,
      matchMode,
    });
  };

  return (
    <>
      {/* Main Video Call UI */}
      <div
        className="relative flex overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50"
        style={{ height: "calc(100vh - 64px)" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.15),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(244,63,94,0.10),transparent_34%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.22),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(244,63,94,0.16),transparent_34%)]" />

        <main className="relative z-10 flex min-h-0 flex-1 flex-col">
          {/* Top Bar with Rules Button */}
          <div className="flex items-center justify-between border-b border-sky-200/50 bg-white/80 px-4 py-2 backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/80">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold">{t("videoCall.random.title")}</h1>
                <p className="text-xs text-muted-foreground">
                  {t("videoCall.random.subtitle")}
                </p>
              </div>
            </div>
            <RulesHoverButton />
          </div>

          {/* Video Grid */}
          <section className={cn(
            "grid min-h-0 flex-1 gap-4 bg-transparent p-4",
            isConnected ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 lg:grid-cols-2"
          )}>
            {/* Local Video */}
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
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                      {t("videoCall.random.localScreen")}
                    </h2>
                    <p className="mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-300">
                      {!call.localStream
                        ? call.notice
                        : t("videoCall.random.cameraOff")}
                    </p>
                  </div>
                </div>
              )}

              <div className="absolute left-5 top-5 flex items-center gap-2">
                <Badge className="rounded-full border border-sky-300 bg-sky-50/95 px-3 py-1 text-[11px] text-sky-700 dark:border-white/15 dark:bg-slate-900/75 dark:text-slate-100">
                  {t("common.me")}
                </Badge>
                {!call.isMicOn && (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-300/50 bg-rose-50/90 dark:border-rose-300/20 dark:bg-rose-500/15">
                    <MicOff className="h-4 w-4 text-rose-600 dark:text-rose-200" />
                  </span>
                )}
              </div>
            </div>

            {/* Remote Video */}
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
                          {t("videoCall.random.waitingPeer")}
                        </h1>
                        <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
                          {call.notice || t("videoCall.random.settingUpRoom")}
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
                          {t("videoCall.random.title")}
                        </h1>
                        <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
                          {t("videoCall.random.chooseFilters")}
                        </p>
                      </div>

                      {/* Level Selection */}
                      <div className="w-full max-w-md space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">
                            {t("videoCall.random.chooseLevel")}
                          </Label>
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
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">
                            {t("videoCall.random.matchMode")}
                          </Label>
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
                                {t(mode.labelKey)}
                              </button>
                            ))}
                          </div>
                        </div>

                        <Button
                          type="button"
                          className="h-12 w-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/25 dark:from-sky-500 dark:to-blue-600 dark:hover:from-sky-400 dark:hover:to-blue-500"
                          onClick={handleStartMatching}
                          disabled={!canStart}
                        >
                          <Radio className="mr-2 h-4 w-4" />
                          {t("videoCall.random.startMatching")}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Status Badge */}
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
                    {t("videoCall.random.status.reconnecting")}
                  </Badge>
                )}
              </div>

              {/* Remote Media Indicators */}
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

          {/* Control Bar */}
          <footer className="relative z-20 flex shrink-0 flex-wrap items-center justify-center gap-3 border-t border-sky-200 bg-white/80 px-4 py-4 backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/80">
            <Button
              type="button"
              size="icon"
              className="h-11 w-11 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700"
              onClick={call.toggleMic}
              disabled={!call.localStream}
              title={call.isMicOn ? t("videoCall.random.controls.micOff") : t("videoCall.random.controls.micOn")}
            >
              {call.isMicOn ? <Mic /> : <MicOff />}
            </Button>

            <Button
              type="button"
              size="icon"
              className="h-11 w-11 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700"
              onClick={call.toggleCamera}
              disabled={!call.localStream}
              title={call.isCameraOn ? t("videoCall.random.controls.cameraOff") : t("videoCall.random.controls.cameraOn")}
            >
              {call.isCameraOn ? <Video /> : <VideoOff />}
            </Button>

            <Button
              type="button"
              className={cn(
                "h-12 rounded-full px-7 font-semibold transition-all",
                isBusy
                  ? "bg-gradient-to-r from-rose-500 to-red-600 text-white hover:from-rose-600 hover:to-red-700 shadow-lg shadow-rose-500/25"
                  : "bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/25 dark:from-sky-500 dark:to-blue-600 dark:hover:from-sky-400 dark:hover:to-blue-500",
              )}
              onClick={isBusy ? call.endCall : handleStartMatching}
              disabled={!call.localStream}
            >
              {isBusy ? (
                <>
                  <PhoneOff className="mr-2 h-4 w-4" />
                  {t("videoCall.random.controls.stop")}
                </>
              ) : (
                <>
                  <Radio className="mr-2 h-4 w-4" />
                  {t("videoCall.random.controls.matching")}
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-full border-sky-200 bg-sky-50 px-5 font-semibold text-sky-700 hover:bg-sky-100 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-800"
              onClick={call.nextPeer}
              disabled={!isMatching && !isConnected}
            >
              <SkipForward className="mr-2 h-4 w-4" />
              {t("videoCall.random.controls.next")}
            </Button>

            <RulesHoverButton iconOnly placement="top" />
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
    </>
  );
}
