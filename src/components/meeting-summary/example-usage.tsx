/**
 * Ví dụ tích hợp Meeting Summary vào Lesson Page
 *
 * Đây là code mẫu để thêm tính năng Meeting Summary vào trang lesson:
 * src/app/(user)/learn/lesson/[bookingId]/page.tsx
 */

import { useMeetingSummary } from "@/hooks/useMeetingSummary";
import { MeetingSummaryModal } from "@/components/meeting-summary/MeetingSummaryModal";
import { AiSummarySettingsModal } from "@/components/meeting-summary/AiSummarySettingsModal";
import { FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// === TRONG COMPONENT ===

// 1. Thêm hook vào component
const meetingSummary = useMeetingSummary();
const [showSummaryModal, setShowSummaryModal] = useState(false);
const [showSettingsModal, setShowSettingsModal] = useState(false);

// 2. Load settings khi mount
useEffect(() => {
  meetingSummary.loadSettings();
}, []);

// 3. Trong hàm handleEndCall - KIỂM TRA SETTINGS TRƯỚC KHI GENERATE
const handleEndCall = useCallback(async () => {
  if (role === "TEACHER") {
    const confirmed = window.confirm(t("lesson.confirm.endTeacher"));
    if (!confirmed) return;

    // Gọi API kết thúc lesson
    await endSessionOnly();

    // Chỉ generate summary nếu user đã bật settings
    if (meetingSummary.isSummaryEnabled && lessonData) {
      const result = await meetingSummary.generateSummary(
        lessonData.lessonId,
        "LESSON",
        meetingSummary.settings.language
      );

      if (result) {
        setShowSummaryModal(true);
      }
    }
    return;
  }
  // ...
}, [role, lessonData, meetingSummary]);

// 4. Nếu user tắt AI Summary, vẫn có thể xem summary cũ (nếu có)
const handleViewSummary = async () => {
  if (lessonData) {
    const existingSummary = await meetingSummary.getSummary(
      lessonData.lessonId,
      "LESSON"
    );
    if (existingSummary) {
      setShowSummaryModal(true);
    }
  }
};

// === TRONG JSX ===

{/* Nút mở Settings */}
<Button
  variant="ghost"
  size="icon"
  onClick={() => setShowSettingsModal(true)}
  className="text-[#8B8FA8] hover:text-[#F0F0F0]"
>
  <Settings className="h-5 w-5" />
</Button>

{/* Nút xem Summary (có thể ẩn nếu chưa có summary) */}
<Button
  onClick={handleViewSummary}
  className="gap-2"
>
  <FileText className="h-4 w-4" />
  {t("meetingSummary.viewSummary", "View Summary")}
</Button>

{/* Settings Modal */}
<AiSummarySettingsModal
  isOpen={showSettingsModal}
  onClose={() => setShowSettingsModal(false)}
  enabled={meetingSummary.settings.enabled}
  language={meetingSummary.settings.language}
  onToggle={meetingSummary.toggleAiSummary}
  onLanguageChange={meetingSummary.setAiSummaryLanguage}
  isLoading={meetingSummary.isLoading}
/>

{/* Summary Modal */}
<MeetingSummaryModal
  isOpen={showSummaryModal}
  onClose={() => setShowSummaryModal(false)}
  summary={meetingSummary.summary}
  isLoading={meetingSummary.isLoading}
  isGenerating={meetingSummary.isGenerating}
  error={meetingSummary.error}
  onRetry={() => lessonData && meetingSummary.generateSummary(
    lessonData.lessonId,
    "LESSON",
    meetingSummary.settings.language
  )}
/>


// === CẤU HÌNH ASSEMBLYAI TRANSCRIPTION ===

/**
 * Để thu thập transcript real-time, cần tích hợp với Daily.co
 * hoặc AssemblyAI Real-time API.
 *
 * Ví dụ với AssemblyAI WebSocket:
 */

import { useEffect, useRef, useCallback } from "react";

interface AssemblyAiRealtimeOptions {
  sessionId: number;
  onTranscript: (segment: TranscriptSegment) => void;
  enabled: boolean; // Toggle từ user settings
}

export function useAssemblyAiRealtime({
  sessionId,
  onTranscript,
  enabled
}: AssemblyAiRealtimeOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = useCallback(async () => {
    if (!enabled) return;

    try {
      // 1. Get realtime token
      const tokenRes = await fetch(
        `${API_CONFIG.BASE_URL}/summaries/realtime-token?sessionId=${sessionId}`
      );
      const { token } = await tokenRes.json();

      // 2. Connect to AssemblyAI WebSocket
      const ws = new WebSocket("wss://api.assemblyai.com/v2/realtime/stream");
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ auth_token: token }));

        // Start audio recording
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
              ws.send(e.data);
            }
          };

          mediaRecorder.start(250);
        });
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.message_type === "FinalTranscript") {
          // Speaker labels từ AssemblyAI
          const speakerRole = data.speaker === "speaker_0" ? "TEACHER" : "STUDENT";
          onTranscript({
            speakerRole,
            content: data.text,
            startTimeMs: data.audio_start,
            endTimeMs: data.audio_end,
          });
        }
      };

    } catch (error) {
      console.error("[AssemblyAI] Failed to start:", error);
    }
  }, [sessionId, onTranscript, enabled]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopRecording();
  }, [stopRecording]);

  return { startRecording, stopRecording };
}


// === SỬ DỤNG TRONG LESSON PAGE ===

/**
 * Ví dụ cách tích hợp đầy đủ:
 */

// Trong component
const [transcripts, setTranscripts] = useState<TranscriptSegment[]>([]);

// Theo dõi settings để bật/tắt recording
useEffect(() => {
  if (meetingSummary.isSummaryEnabled) {
    // Bắt đầu recording khi vào phòng
    startRecording();
  } else {
    // Dừng recording nếu user tắt
    stopRecording();
  }
}, [meetingSummary.isSummaryEnabled]);

// Khi có transcript mới, lưu vào backend
const handleNewTranscript = useCallback(async (segment: TranscriptSegment) => {
  setTranscripts((prev) => [...prev, segment]);

  // Lưu từng đoạn (hoặc bulk save định kỳ)
  await meetingSummary.saveTranscript(segment);
}, [meetingSummary]);

// Khi kết thúc buổi học - chỉ generate nếu được bật
const handleEndCall = async () => {
  stopRecording(); // Dừng recording

  if (meetingSummary.isSummaryEnabled && lessonData) {
    // Bulk save remaining transcripts
    if (transcripts.length > 0) {
      await meetingSummary.saveBulkTranscripts(transcripts);
    }

    // Generate summary
    const result = await meetingSummary.generateSummary(
      lessonData.lessonId,
      "LESSON",
      meetingSummary.settings.language
    );

    if (result) {
      setShowSummaryModal(true);
    }
  }
};
