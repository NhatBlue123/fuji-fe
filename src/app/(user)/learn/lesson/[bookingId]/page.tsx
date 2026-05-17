/**
 * [I18N PAGE - LESSON ROOM]
 * Thực hiện:
 * - Localize các thông báo phòng học (Phòng đã sẵn sàng, Lỗi kết nối).
 * - Dịch các pop-up quan trọng: Xác nhận ghi hình (Consent), Báo cáo (Report modal), và xác nhận thoát (Exit check).
 * - Chuyển đổi định dạng thời gian còn lại sang chuẩn quốc tế.
 */
"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useDailyRoom } from "@/hooks/useDailyRoom";
import { useStompChat } from "@/hooks/useStompChat";
import { useMeetingSummary } from "@/hooks/useMeetingSummary";
import { useTranscriptSync } from "@/hooks/useTranscriptSync";
import { useLessonTranscript } from "@/hooks/useLessonTranscript";
import { useVoiceTranscript, type VoiceTranscriptLanguage } from "@/hooks/useVoiceTranscript";
import { API_CONFIG } from "@/config/api";
import {
  useCreateLessonRoomMutation,
  useEndLessonMutation,
  useMarkLessonActiveMutation,
  useMarkLessonPresenceMutation,
  useGetChatHistoryQuery,
} from "@/store/services/lessonApi";
import { useSubmitSessionReviewMutation } from "@/store/services/bookingApi";
import type { LessonRoomResponse } from "@/store/services/lessonApi";
import { useAuth } from "@/store/hooks";
import { VideoGrid } from "@/components/lesson/VideoGrid";
import { ControlBar } from "@/components/lesson/ControlBar";
import { LessonHeader } from "@/components/lesson/LessonHeader";
import { SidePanel } from "@/components/lesson/SidePanel";
import { AiSummarySettingsModal } from "@/components/meeting-summary/AiSummarySettingsModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { disconnectStomp } from "@/lib/stomp";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { tMsg } from "@/i18n";
import { useTranslation } from "react-i18next";

export default function LessonPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const bookingId = Number(params.bookingId);
  const { user, accessToken } = useAuth();

  const [lessonData, setLessonData] = useState<LessonRoomResponse | null>(null);
  const [hasMarkedActive, setHasMarkedActive] = useState(false);

  const [createRoom, { isLoading: isCreating, error: createError }] = useCreateLessonRoomMutation();
  const [endLesson] = useEndLessonMutation();
  const [submitSessionReview] = useSubmitSessionReviewMutation();
  const [markActive] = useMarkLessonActiveMutation();
  const [markPresence] = useMarkLessonPresenceMutation();
  const autoEndedRef = useRef(false);
  const presenceLessonIdRef = useRef<number | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [reportRating, setReportRating] = useState(5);
  const [reportComment, setReportComment] = useState("");
  const [aiSummarySettingsOpen, setAiSummarySettingsOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [transcriptLanguage, setTranscriptLanguage] = useState<VoiceTranscriptLanguage>("vi");

  // AI Summary hook
  const meetingSummary = useMeetingSummary();

  // Load AI summary settings on mount
  useEffect(() => {
    meetingSummary.loadSettings();
  }, []);


  const role: "TEACHER" | "STUDENT" = useMemo(() => {
    if (!lessonData || !user) return "STUDENT";
    return lessonData.teacherName === user.fullName ? "TEACHER" : "STUDENT";
  }, [lessonData, user]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 10_000);
    return () => window.clearInterval(timer);
  }, []);

  const hasLessonStarted = useMemo(() => {
    if (!lessonData?.scheduledStartAt) return true;
    const startMs = new Date(lessonData.scheduledStartAt).getTime();
    if (!Number.isFinite(startMs)) return true;
    return nowMs >= startMs;
  }, [lessonData?.scheduledStartAt, nowMs]);

  // Load chat history via REST, then subscribe to STOMP for live updates
  const { data: chatHistory } = useGetChatHistoryQuery(
    { lessonId: lessonData?.lessonId ?? 0 },
    { skip: !lessonData }
  );

  const {
    messages: liveMessages,
    typingUsers,
    sendMessage,
    sendTyping,
    sendReaction,
    markSeen,
  } = useStompChat(
    lessonData?.lessonId ?? null,
    accessToken ?? null,
    chatHistory,
    {
      senderId: Number(user?.id ?? 0),
      senderName: user?.fullName ?? "Unknown",
      senderRole: role,
    }
  );

  // Transcript sync hook — auto-saves TEXT chat messages as transcripts for AI Summary
  // Placed here to ensure liveMessages and role are already defined
  const { flushAll: flushTranscripts } = useTranscriptSync(liveMessages, {
    lessonId: lessonData?.lessonId ?? null,
    role,
    userId: Number(user?.id ?? 0),
    userName: user?.fullName ?? "Unknown",
    accessToken: accessToken ?? null,
    enabled: meetingSummary.settings.enabled,
  });

  // Daily.co room connection
  const {
    participants,
    activeSpeakerId,
    isMicOn,
    isCameraOn,
    isScreenSharing,
    isJoined,
    error: dailyError,
    mediaError,
    isMicLoading,
    isCameraLoading,
    localAudioLevel,
    toggleMic,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    leave,
  } = useDailyRoom(lessonData?.roomUrl ?? null, lessonData?.token ?? null);

  const sendPresenceKeepalive = useCallback(
    (lessonId: number, present: boolean) => {
      if (!accessToken) return;
      fetch(
        `${API_CONFIG.BASE_URL}/lessons/${lessonId}/presence/${present ? "join" : "leave"}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
          keepalive: true,
        }
      ).catch(() => {});
    },
    [accessToken]
  );

  // Voice transcript — uses browser SpeechRecognition realtime, saves final turns as transcripts
  // Starts automatically when mic is on, pauses when mic is off
  const voiceTranscript = useVoiceTranscript({
    lessonId: lessonData?.lessonId ?? null,
    role,
    userId: Number(user?.id ?? 0),
    userName: user?.fullName ?? "Unknown",
    accessToken: accessToken ?? null,
    isMicOn,
    enabled: meetingSummary.settings.enabled,
    classroomTopic: lessonData?.subject ?? null,
    language: transcriptLanguage,
  });

  const {
    transcripts,
    isLoading: transcriptsLoading,
    error: transcriptsError,
  } = useLessonTranscript(lessonData?.lessonId ?? null, accessToken ?? null);

  // Screen share participant
  const screenShareParticipant = useMemo(
    () => participants.find((p) => p.screen && p.screenVideoTrack) ?? null,
    [participants]
  );

  // Create or join room on mount
  useEffect(() => {
    if (!bookingId || lessonData) return;

    createRoom({ bookingId })
      .unwrap()
      .then((data) => {
        setLessonData(data);
        toast.success(tMsg((data as any).messageKey) || t("lesson.room.ready"));
      })
      .catch((err) => {
        console.error("[Lesson] Failed to create room:", err);
        const msg = tMsg(err?.data?.messageKey) || tMsg("api.error") || t("lesson.room.errorCreate");
        toast.error(msg);
      });
  }, [bookingId, createRoom, lessonData]);

  useEffect(() => {
    const lessonId = lessonData?.lessonId;
    if (!lessonId) return;

    if (!isJoined) {
      if (presenceLessonIdRef.current === lessonId) {
        presenceLessonIdRef.current = null;
        sendPresenceKeepalive(lessonId, false);
      }
      return;
    }

    presenceLessonIdRef.current = lessonId;
    markPresence({ lessonId, present: true }).unwrap().catch(() => {});

    const heartbeat = window.setInterval(() => {
      markPresence({ lessonId, present: true }).unwrap().catch(() => {});
    }, 30_000);

    return () => {
      window.clearInterval(heartbeat);
      if (presenceLessonIdRef.current === lessonId) {
        presenceLessonIdRef.current = null;
        sendPresenceKeepalive(lessonId, false);
      }
    };
  }, [lessonData?.lessonId, isJoined, markPresence, sendPresenceKeepalive]);

  useEffect(() => {
    const handlePageHide = () => {
      const lessonId = presenceLessonIdRef.current;
      if (!lessonId) return;
      presenceLessonIdRef.current = null;
      sendPresenceKeepalive(lessonId, false);
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [sendPresenceKeepalive]);

  // Mark lesson active when both participants have joined
  useEffect(() => {
    if (!lessonData || hasMarkedActive) return;
    const remoteCount = participants.filter((p) => !p.local).length;
    if (remoteCount > 0 && isJoined) {
      markActive({ lessonId: lessonData.lessonId }).unwrap().catch(() => {});
      setHasMarkedActive(true);
    }
  }, [participants, isJoined, lessonData, hasMarkedActive, markActive]);

  const exitLesson = useCallback(() => {
    leave();
    disconnectStomp();
    router.push("/booking/bookingmodal");
  }, [leave, router]);

  const handleLessonTimeUp = useCallback(async () => {
    if (autoEndedRef.current) return;
    autoEndedRef.current = true;
    toast.info(t("lesson.timeup"));

    if (lessonData && role === "TEACHER") {
      try {
        await endLesson({ lessonId: lessonData.lessonId }).unwrap();
      } catch (err) {
        console.error("[Lesson] Failed to auto end session:", err);
      }
    }

    exitLesson();
  }, [lessonData, role, endLesson, exitLesson]);

  const endSessionOnly = useCallback(async (): Promise<boolean> => {
    if (!lessonData) return false;
    try {
      // Flush any un-synced transcripts before ending so AI Summary has all data
      await flushTranscripts(liveMessages);
      await endLesson({ lessonId: lessonData.lessonId }).unwrap();
      toast.success(t("lesson.ended"));
      return true;
    } catch (err: any) {
      const message =
        tMsg(err?.data?.messageKey) ||
        err?.data?.message ||
        err?.message ||
        t("lesson.errorEnd");
      toast.error(message);
      return false;
    }
  }, [lessonData, endLesson, flushTranscripts, liveMessages, t]);

  const handleEndCall = useCallback(async () => {
    if (role === "TEACHER") {
      if (!hasLessonStarted) {
        toast.info("Buổi học chưa đến giờ bắt đầu. Rời phòng sẽ không kết thúc buổi học.");
        setLeaveConfirmOpen(true);
        return;
      }
      setReportOpen(true);
      return;
    }

    setLeaveConfirmOpen(true);
  }, [role, hasLessonStarted]);

  const handleToggleScreenShare = useCallback(() => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  }, [isScreenSharing, startScreenShare, stopScreenShare]);

  // Error state
  if (createError || dailyError) {
    const errorMessage = dailyError || t("lesson.room.errorCreate");
    return (
      <div className="flex items-center justify-center bg-slate-50 dark:bg-[#0f1117]" style={{ height: "calc(100vh - 64px)" }}>
        <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-card px-8 py-7 text-center shadow-xl dark:border-white/10 dark:bg-[#1a1d27]">
          <AlertTriangle className="h-12 w-12 text-[#FF6B6B]" />
          <div>
            <p className="text-sm font-semibold text-foreground dark:text-[#F0F0F0]">{t('auto.booking_lesson_1')}</p>
            <p className="mt-1 text-xs text-muted-foreground dark:text-[#8B8FA8]">{String(errorMessage)}</p>
          </div>
          <button
            onClick={() => router.push("/booking/bookingmodal")}
            className="rounded-xl bg-[#6C63FF] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#5a52e0] transition-colors"
          >
            {t("common.back")}
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (!lessonData || isCreating) {
    return (
      <div className="flex items-center justify-center bg-slate-50 dark:bg-[#0f1117]" style={{ height: "calc(100vh - 64px)" }}>
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-8 py-7 shadow-xl dark:border-white/10 dark:bg-[#1a1d27]">
          <div className="relative flex items-center justify-center">
            <div className="h-14 w-14 rounded-full border-2 border-[#6C63FF]/30" />
            <RefreshCw className="absolute h-6 w-6 text-[#6C63FF] animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground dark:text-[#F0F0F0]">{t('auto.booking_lesson_2')}</p>
            <p className="mt-1 animate-pulse text-xs text-muted-foreground dark:text-[#8B8FA8]">
              {t("common.loading")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-slate-50 text-foreground dark:bg-[#0f1117]" style={{ height: "calc(100vh - 64px)" }}>
      {reportOpen && lessonData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 dark:bg-black/60">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl dark:border-white/10 dark:bg-[#1a1d27]">
            <p className="text-sm font-semibold text-foreground dark:text-[#F0F0F0]">
              {role === "TEACHER" ? t("lesson.report.student") : t("lesson.report.teacher")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground dark:text-[#8B8FA8]">
              {t("lesson.report.desc")}
            </p>
            <textarea
              value={reportComment}
              onChange={(e) => setReportComment(e.target.value)}
              placeholder={role === "TEACHER" ? t("lesson.report.placeholder_student") : t("lesson.report.placeholder_teacher")}
              className="mt-3 min-h-[96px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-[#6C63FF] dark:border-white/10 dark:bg-[#0f1117] dark:text-[#F0F0F0]"
            />
            <div className="mt-2">
              <p className="mb-1 text-[11px] text-muted-foreground dark:text-[#8B8FA8]">{t('auto.booking_lesson_3')}</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setReportRating(score)}
                    className={`h-8 w-8 rounded-md text-xs font-semibold ${
                      reportRating === score
                        ? "bg-[#6C63FF] text-white"
                        : "border border-border bg-muted text-muted-foreground dark:border-white/10 dark:bg-[#0f1117] dark:text-[#8B8FA8]"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground transition hover:bg-muted dark:border-white/20 dark:text-[#F0F0F0] dark:hover:bg-white/5"
                onClick={() => setReportOpen(false)}
              >
                {t("lesson.report.btn_cancel")}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-[#6C63FF] text-xs text-white"
                onClick={async () => {
                  const ended = await endSessionOnly();
                  if (!ended) return;

                  try {
                    await submitSessionReview({
                      bookingId,
                      rating: reportRating,
                      comment: reportComment || undefined,
                    }).unwrap();
                    toast.success(tMsg("api.success") || t("lesson.report.success"));
                  } catch (err: any) {
                    toast.error(tMsg(err?.data?.messageKey) || tMsg("api.error"));
                  } finally {
                    setReportOpen(false);
                    exitLesson();
                  }
                }}
              >
                {t("lesson.report.btn_send")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Confirmation Dialog for Students */}
      <AlertDialog open={leaveConfirmOpen} onOpenChange={setLeaveConfirmOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("lesson.confirm.leaveTitle") || "Xác nhận rời lớp học"}</AlertDialogTitle>
            <AlertDialogDescription>
              {role === "TEACHER" && !hasLessonStarted ? (
                "Buổi học chưa đến giờ bắt đầu. Rời phòng lúc này sẽ không kết thúc buổi học, học viên và giảng viên vẫn có thể vào lại."
              ) : (
              t("lesson.confirm.leaveStudent") || "Bạn có chắc chắn muốn rời lớp học không?"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel") || "Hủy"}</AlertDialogCancel>
            <AlertDialogAction onClick={exitLesson}>
              {t("lesson.confirm.leaveConfirm") || "Rời lớp"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <LessonHeader
        subject={lessonData.subject}
        teacherName={lessonData.teacherName}
        studentName={lessonData.studentName}
        remainingSeconds={lessonData.remainingSeconds}
        isConnected={isJoined && participants.filter((p) => !p.local).length > 0}
        role={role}
        onTimeUp={handleLessonTimeUp}
        onSettingsClick={() => setAiSummarySettingsOpen(true)}
      />

      {/* Main content area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Video Area — 65% width */}
        <div className="flex-[65] min-w-0 p-4">
          <div className="h-full w-full overflow-hidden rounded-[24px] border border-border bg-card shadow-2xl dark:border-white/[0.08] dark:bg-[#1a1d27]">
            {isJoined ? (
              <VideoGrid
                participants={participants}
                activeSpeakerId={activeSpeakerId}
                screenShareParticipant={screenShareParticipant}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <RefreshCw className="h-8 w-8 text-[#8B8FA8] animate-spin" />
                <p className="text-sm text-muted-foreground dark:text-[#8B8FA8]">{t('common.loading')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel — 35% width */}
        <div className="flex-[35] min-w-0 p-4 pl-0">
          <SidePanel
            lessonId={lessonData.lessonId}
            currentUserId={Number(user?.id ?? 0)}
            token={accessToken ?? null}
            isTeacher={role === "TEACHER"}
            currentUserName={user?.fullName ?? "Unknown"}
            currentUserRole={role}
            messages={liveMessages}
            typingUsers={typingUsers}
            transcripts={transcripts}
            transcriptsLoading={transcriptsLoading}
            transcriptsError={transcriptsError}
            voiceTranscriptStatus={voiceTranscript.status}
            voiceTranscriptError={voiceTranscript.error}
            voiceTranscriptPartialText={voiceTranscript.partialTranscript}
            voiceTranscriptLanguage={transcriptLanguage}
            onVoiceTranscriptLanguageChange={setTranscriptLanguage}
            transcriptEnabled={meetingSummary.settings.enabled}
            onSendMessage={sendMessage}
            onSendTyping={sendTyping}
            onReaction={sendReaction}
            onMarkSeen={markSeen}
          />
        </div>
      </div>

      {/* Control Bar */}
      <ControlBar
        isMicOn={isMicOn}
        isCameraOn={isCameraOn}
        isScreenSharing={isScreenSharing}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={handleToggleScreenShare}
        onEndCall={handleEndCall}
        isTeacher={role === "TEACHER"}
        isMicLoading={isMicLoading}
        isCameraLoading={isCameraLoading}
        mediaError={mediaError}
        audioLevel={localAudioLevel}
      />

      {/* AI Summary Settings Modal */}
      <AiSummarySettingsModal
        isOpen={aiSummarySettingsOpen}
        onClose={() => setAiSummarySettingsOpen(false)}
        enabled={meetingSummary.settings.enabled}
        language={meetingSummary.settings.language}
        onToggle={meetingSummary.toggleAiSummary}
        onLanguageChange={meetingSummary.setAiSummaryLanguage}
        isLoading={meetingSummary.isLoading}
      />
    </div>
  );
}
