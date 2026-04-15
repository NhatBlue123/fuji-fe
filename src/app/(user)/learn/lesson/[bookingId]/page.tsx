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
  useStartLessonRecordingMutation,
  useStopLessonRecordingMutation,
} from "@/store/services/lessonApi";
import { useSubmitSessionReviewMutation } from "@/store/services/bookingApi";
import type { LessonRoomResponse } from "@/store/services/lessonApi";
import { useAuth } from "@/store/hooks";
import { VideoGrid } from "@/components/lesson/VideoGrid";
import { ControlBar } from "@/components/lesson/ControlBar";
import { LessonHeader } from "@/components/lesson/LessonHeader";
import { SidePanel } from "@/components/lesson/SidePanel";
import { disconnectStomp } from "@/lib/stomp";
import { useLessonRecordingStomp } from "@/hooks/useLessonRecordingStomp";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function LessonPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const bookingId = Number(params.bookingId);
  const { user, accessToken } = useAuth();

  const [lessonData, setLessonData] = useState<LessonRoomResponse | null>(null);
  const [hasMarkedActive, setHasMarkedActive] = useState(false);

  const [createRoom, { isLoading: isCreating, error: createError }] = useCreateLessonRoomMutation();
  const [endLesson] = useEndLessonMutation();
  const [submitSessionReview] = useSubmitSessionReviewMutation();
  const [markActive] = useMarkLessonActiveMutation();
  const [startRecording] = useStartLessonRecordingMutation();
  const [stopRecording] = useStopLessonRecordingMutation();

  const { remoteRecording } = useLessonRecordingStomp(
    lessonData?.lessonId ?? null,
    accessToken ?? null
  );

  const [recordingConsentOpen, setRecordingConsentOpen] = useState(false);
  const recordingConsentShownRef = useRef(false);
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
        toast.success("Phòng học đã sẵn sàng!");
      })
      .catch((err) => {
        console.error("[Lesson] Failed to create room:", err);
        const msg = err?.data?.message || "Không thể tạo phòng học";
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

  useEffect(() => {
    if (role !== "STUDENT" || !remoteRecording || recordingConsentShownRef.current) return;
    recordingConsentShownRef.current = true;
    setRecordingConsentOpen(true);
  }, [role, remoteRecording]);

  const handleToggleRecording = useCallback(async () => {
    if (!lessonData || role !== "TEACHER") return;
    try {
      if (remoteRecording) {
        await stopRecording({ lessonId: lessonData.lessonId }).unwrap();
        toast.success("Đã dừng ghi hình");
      } else {
        await startRecording({ lessonId: lessonData.lessonId }).unwrap();
        toast.success("Đã bắt đầu ghi hình");
      }
    } catch {
      toast.error("Không thể thay đổi trạng thái ghi hình");
    }
  }, [lessonData, role, remoteRecording, startRecording, stopRecording]);

  const exitLesson = useCallback(() => {
    leave();
    disconnectStomp();
    router.push("/booking/bookingmodal");
  }, [leave, router]);

  const handleLessonTimeUp = useCallback(async () => {
    if (autoEndedRef.current) return;
    autoEndedRef.current = true;
    toast.info("Đã hết thời lượng buổi học. Hệ thống tự động rời phòng.");

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
        toast.success("Buổi học đã kết thúc");
      } catch {
        toast.error("Lỗi khi kết thúc buổi học");
      }
    }
  }, [lessonData, endLesson]);

  const handleEndCall = useCallback(async () => {
    if (role === "TEACHER") {
      const confirmed = window.confirm(
        "Bạn có chắc muốn kết thúc lớp học? Hành động này sẽ đóng phòng và không thể vào lại."
      );
      if (!confirmed) return;
      setReportOpen(true);
      return;
    }

    const confirmedLeave = window.confirm(
      "Bạn có chắc muốn rời lớp học? Bạn vẫn có thể vào lại nếu buổi học chưa kết thúc."
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
    const errorMessage = dailyError || "Không thể kết nối phòng học";
    return (
      <div className="flex items-center justify-center bg-[#0f1117]" style={{ height: "calc(100vh - 64px)" }}>
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-[#1a1d27] px-8 py-7 shadow-xl max-w-md text-center">
          <AlertTriangle className="h-12 w-12 text-[#FF6B6B]" />
          <div>
            <p className="text-[#F0F0F0] font-semibold text-sm">Không thể kết nối</p>
            <p className="text-[#8B8FA8] text-xs mt-1">{String(errorMessage)}</p>
          </div>
          <button
            onClick={() => router.push("/booking/bookingmodal")}
            className="rounded-xl bg-[#6C63FF] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#5a52e0] transition-colors"
          >
            Quay lại
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
            <p className="text-[#F0F0F0] font-semibold text-sm">Đang thiết lập phòng học</p>
            <p className="text-[#8B8FA8] text-xs mt-1 animate-pulse">
              Kết nối Daily.co và chuẩn bị video...
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
              {role === "TEACHER" ? "Báo cáo học viên" : "Báo cáo giảng viên"}
            </p>
            <p className="text-xs text-[#8B8FA8] mt-1">
              Thông tin này sẽ hiển thị ở mục phản hồi và báo cáo (booking) bên admin.
            </p>
            <textarea
              value={reportComment}
              onChange={(e) => setReportComment(e.target.value)}
              placeholder={role === "TEACHER" ? "Nhập nội dung báo cáo học viên" : "Nhập nội dung báo cáo giảng viên"}
              className="mt-3 w-full min-h-[80px] rounded-lg bg-[#0f1117] border border-white/10 px-3 py-2 text-xs"
            />
            <div className="mt-2">
              <p className="text-[11px] text-[#8B8FA8] mb-1">Mức độ (1-5)</p>
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
                Hủy
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
                    toast.success("Đã gửi báo cáo thành công");
                  } catch (err: any) {
                    toast.error(err?.data?.message || "Không thể gửi báo cáo");
                  } finally {
                    setReportOpen(false);
                    exitLesson();
                  }
                }}
              >
                Gửi & kết thúc
              </button>
            </div>
          </div>
        </div>
      )}

      {recordingConsentOpen && role === "STUDENT" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="max-w-md rounded-2xl border border-white/10 bg-[#1a1d27] p-6 shadow-xl">
            <p className="text-[#F0F0F0] font-semibold text-sm">Ghi hình buổi học</p>
            <p className="text-[#8B8FA8] text-xs mt-2 leading-relaxed">
              Buổi học đang được ghi bằng cloud recording. Tiếp tục tham gia nghĩa là bạn đã nắm được
              thông tin này và đồng ý.
            </p>
            <button
              type="button"
              className="mt-4 w-full rounded-xl bg-[#6C63FF] py-2.5 text-sm font-semibold text-white hover:bg-[#5a52e0]"
              onClick={() => setRecordingConsentOpen(false)}
            >
              Đã hiểu
            </button>
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
        isRecording={remoteRecording}
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
                <p className="text-[#8B8FA8] text-sm">Đang kết nối video...</p>
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
        isRecording={remoteRecording}
        onToggleRecording={handleToggleRecording}
      />
    </div>
  );
}
