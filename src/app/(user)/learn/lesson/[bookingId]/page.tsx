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
import {
  useCreateLessonRoomMutation,
  useEndLessonMutation,
  useMarkLessonActiveMutation,
  useGetChatHistoryQuery,
} from "@/store/services/lessonApi";
import { useSubmitSessionReviewMutation } from "@/store/services/bookingApi";
import type { LessonRoomResponse } from "@/store/services/lessonApi";
import { useAuth } from "@/store/hooks";
import { VideoGrid } from "@/components/lesson/VideoGrid";
import { ControlBar } from "@/components/lesson/ControlBar";
import { LessonHeader } from "@/components/lesson/LessonHeader";
import { SidePanel } from "@/components/lesson/SidePanel";
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
  const autoEndedRef = useRef(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportRating, setReportRating] = useState(5);
  const [reportComment, setReportComment] = useState("");

  const role: "TEACHER" | "STUDENT" = useMemo(() => {
    if (!lessonData || !user) return "STUDENT";
    return lessonData.teacherName === user.fullName ? "TEACHER" : "STUDENT";
  }, [lessonData, user]);

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

  // Daily.co room connection
  const {
    participants,
    activeSpeakerId,
    localSessionId,
    isMicOn,
    isCameraOn,
    isScreenSharing,
    isJoined,
    error: dailyError,
    toggleMic,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    leave,
  } = useDailyRoom(lessonData?.roomUrl ?? null, lessonData?.token ?? null);

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

  const endSessionOnly = useCallback(async () => {
    if (lessonData) {
      try {
        await endLesson({ lessonId: lessonData.lessonId }).unwrap();
        toast.success(t("lesson.ended"));
      } catch {
        toast.error(t("lesson.errorEnd"));
      }
    }
  }, [lessonData, endLesson]);

  const handleEndCall = useCallback(async () => {
    if (role === "TEACHER") {
      const confirmed = window.confirm(
        t("lesson.confirm.endTeacher")
      );
      if (!confirmed) return;
      setReportOpen(true);
      return;
    }

    const confirmedLeave = window.confirm(
      t("lesson.confirm.leaveStudent")
    );
    if (!confirmedLeave) return;
    exitLesson();
  }, [role, exitLesson]);

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
      <div className="flex items-center justify-center bg-[#0f1117]" style={{ height: "calc(100vh - 64px)" }}>
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-[#1a1d27] px-8 py-7 shadow-xl max-w-md text-center">
          <AlertTriangle className="h-12 w-12 text-[#FF6B6B]" />
          <div>
            <p className="text-[#F0F0F0] font-semibold text-sm">{t('auto.booking_lesson_1')}</p>
            <p className="text-[#8B8FA8] text-xs mt-1">{String(errorMessage)}</p>
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
      <div className="flex items-center justify-center bg-[#0f1117]" style={{ height: "calc(100vh - 64px)" }}>
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-[#1a1d27] px-8 py-7 shadow-xl">
          <div className="relative flex items-center justify-center">
            <div className="h-14 w-14 rounded-full border-2 border-[#6C63FF]/30" />
            <RefreshCw className="absolute h-6 w-6 text-[#6C63FF] animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-[#F0F0F0] font-semibold text-sm">{t('auto.booking_lesson_2')}</p>
            <p className="text-[#8B8FA8] text-xs mt-1 animate-pulse">
              {t("common.loading")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#0f1117]" style={{ height: "calc(100vh - 64px)" }}>
      {reportOpen && lessonData && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1a1d27] p-5">
            <p className="text-sm font-semibold text-[#F0F0F0]">
              {role === "TEACHER" ? t("lesson.report.student") : t("lesson.report.teacher")}
            </p>
            <p className="text-xs text-[#8B8FA8] mt-1">
              {t("lesson.report.desc")}
            </p>
            <textarea
              value={reportComment}
              onChange={(e) => setReportComment(e.target.value)}
              placeholder={role === "TEACHER" ? t("lesson.report.placeholder_student") : t("lesson.report.placeholder_teacher")}
              className="mt-3 w-full min-h-[80px] rounded-lg bg-[#0f1117] border border-white/10 px-3 py-2 text-xs"
            />
            <div className="mt-2">
              <p className="text-[11px] text-[#8B8FA8] mb-1">{t('auto.booking_lesson_3')}</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setReportRating(score)}
                    className={`h-8 w-8 rounded-md text-xs font-semibold ${
                      reportRating === score
                        ? "bg-[#6C63FF] text-white"
                        : "bg-[#0f1117] border border-white/10 text-[#8B8FA8]"
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
                className="px-4 py-2 rounded-lg border border-white/20 text-xs"
                onClick={() => setReportOpen(false)}
              >
                {t("lesson.report.btn_cancel")}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-[#6C63FF] text-xs text-white"
                onClick={async () => {
                  try {
                    await endSessionOnly();
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

      {/* Header */}
      <LessonHeader
        subject={lessonData.subject}
        teacherName={lessonData.teacherName}
        studentName={lessonData.studentName}
        remainingSeconds={lessonData.remainingSeconds}
        isConnected={isJoined && participants.filter((p) => !p.local).length > 0}
        role={role}
        onTimeUp={handleLessonTimeUp}
      />

      {/* Main content area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Video Area — 65% width */}
        <div className="flex-[65] min-w-0 p-4">
          <div className="w-full h-full rounded-[24px] overflow-hidden border border-white/[0.08] shadow-2xl bg-[#1a1d27]">
            {isJoined ? (
              <VideoGrid
                participants={participants}
                activeSpeakerId={activeSpeakerId}
                localSessionId={localSessionId}
                screenShareParticipant={screenShareParticipant}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <RefreshCw className="h-8 w-8 text-[#8B8FA8] animate-spin" />
                <p className="text-[#8B8FA8] text-sm">{t('common.loading')}</p>
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
            messages={liveMessages}
            typingUsers={typingUsers}
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
      />
    </div>
  );
}
