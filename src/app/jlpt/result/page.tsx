"use client";

export const dynamic = "force-dynamic";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useGetAttemptByIdQuery,
  useCreateExamFeedbackMutation,
} from "@/store/services/jlptApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  XCircle,
  Clock,
  Trophy,
  Target,
  MessageSquareText,
} from "lucide-react";
import { toast } from "sonner";

function JLPTResultPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");

  const {
    data: attempt,
    isLoading,
    error,
  } = useGetAttemptByIdQuery(Number(attemptId), { skip: !attemptId });

  const [createExamFeedback, createExamFeedbackState] =
    useCreateExamFeedbackMutation();
  const [examFeedback, setExamFeedback] = React.useState("");
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1120]">
        <div className="text-center text-white">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-400 mb-4" />
          <p className="text-lg">Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1120]">
        <div className="text-center text-white">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-lg font-semibold">Không thể tải kết quả</p>
          <p className="text-sm text-slate-400 mt-2">
            Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ
          </p>
          <Button
            onClick={() => router.push("/JLPT_Practice")}
            className="mt-6 bg-pink-600 hover:bg-pink-700"
          >
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const accuracyPercent = Math.round(
    (attempt.correctAnswers / attempt.totalQuestions) * 100,
  );

  const handleSubmitFeedback = async () => {
    try {
      await createExamFeedback({
        testId: attempt.testId,
        attemptId: attempt.id,
        testTitle: attempt.test?.title,
        feedback: examFeedback.trim(),
      }).unwrap();
      toast.success("Đã gửi phản hồi. Cảm ơn bạn!");
      setExamFeedback("");
      setFeedbackOpen(false);
      router.push("/JLPT_Practice");
    } catch (e) {
      console.error(e);
      toast.error("Gửi phản hồi thất bại, hãy thử lại.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white py-8 px-4 pr-14 sm:pr-16">
      <Sheet open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <button
          type="button"
          onClick={() => setFeedbackOpen(true)}
          className="fixed right-0 top-1/2 z-40 -translate-y-1/2 flex flex-col items-center justify-center gap-2 rounded-l-xl border border-r-0 border-pink-500/50 bg-gradient-to-l from-pink-600 to-pink-700 px-2.5 py-6 shadow-lg shadow-pink-900/30 transition hover:from-pink-500 hover:to-pink-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
          aria-label="Mở gửi phản hồi đề thi"
        >
          <MessageSquareText className="h-5 w-5 shrink-0 text-white" />
          <span
            className="text-xs font-semibold uppercase tracking-wider text-white"
            style={{ writingMode: "vertical-rl" }}
          >
            Phản hồi
          </span>
        </button>

        <SheetContent
          side="right"
          className="w-full border-l border-slate-700 bg-[#0B1120] p-6 text-white sm:max-w-md [&>button]:text-slate-400 [&>button]:hover:text-white"
        >
          <SheetHeader className="space-y-1 text-left">
            <SheetTitle className="text-xl text-white">
              Phản hồi đề thi
            </SheetTitle>
            <SheetDescription className="text-slate-400">
              Góp ý chung về đề thi (không cần trích nội dung câu hỏi). Sau khi
              gửi, bạn sẽ được chuyển về danh sách bài thi.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <Textarea
              rows={6}
              className="resize-none border-slate-600 bg-slate-900/80 text-sm text-white placeholder:text-slate-500 focus-visible:ring-pink-500"
              value={examFeedback}
              onChange={(e) => setExamFeedback(e.target.value)}
              placeholder="Ví dụ: Độ khó, thời gian, trải nghiệm làm bài..."
            />
          </div>
          <SheetFooter className="mt-6 flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="text-slate-300 hover:bg-slate-800 hover:text-white"
              onClick={() => setFeedbackOpen(false)}
            >
              Đóng
            </Button>
            <Button
              type="button"
              disabled={
                createExamFeedbackState.isLoading || !examFeedback.trim()
              }
              className="bg-pink-600 hover:bg-pink-700"
              onClick={handleSubmitFeedback}
            >
              {createExamFeedbackState.isLoading ? "Đang gửi..." : "Gửi phản hồi"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4 mb-8">
          {attempt.isPassed ? (
            <>
              <Trophy className="w-20 h-20 text-yellow-400 mx-auto" />
              <h1 className="text-4xl font-bold text-green-400">
                Chúc mừng! Bạn đã đỗ
              </h1>
            </>
          ) : (
            <>
              <XCircle className="w-20 h-20 text-red-400 mx-auto" />
              <h1 className="text-4xl font-bold text-red-400">
                Chưa đạt yêu cầu
              </h1>
            </>
          )}
          {attempt.test?.title && (
            <p className="text-lg text-slate-300">{attempt.test.title}</p>
          )}
          {!attempt.isPassed && (
            <p className="text-slate-400">
              Đừng nản lòng — hãy ôn tập và thử lại khi sẵn sàng.
            </p>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 max-w-2xl mx-auto">
          Để bảo vệ nội dung đề thi, hệ thống không hiển thị lại chi tiết từng
          câu sau khi nộp bài.
        </p>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Target className="w-6 h-6 text-pink-400" />
              Kết quả tổng quan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                <div className="text-3xl font-bold text-pink-400">
                  {attempt.totalScore.toFixed(1)}
                </div>
                <div className="text-sm text-slate-400 mt-2">Tổng điểm</div>
              </div>
              <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                <div className="text-3xl font-bold text-white">
                  {attempt.correctAnswers}/{attempt.totalQuestions}
                </div>
                <div className="text-sm text-slate-400 mt-2">Câu đúng</div>
              </div>
              <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                <div className="text-3xl font-bold text-white">
                  {accuracyPercent}%
                </div>
                <div className="text-sm text-slate-400 mt-2">Độ chính xác</div>
              </div>
              <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                <div className="text-3xl font-bold text-green-400">
                  {formatTime(attempt.timeSpent)}
                </div>
                <div className="text-sm text-slate-400 mt-2">Thời gian</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl">Điểm theo phần</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <div>
                <div className="font-medium">
                  Kiến thức ngôn ngữ (Từ vựng + Ngữ pháp)
                </div>
                <div className="text-sm text-slate-400">Tối thiểu: 19 điểm</div>
              </div>
              <Badge
                variant={
                  attempt.languageKnowledgeScore >= 19 ? "default" : "destructive"
                }
                className="text-lg px-4 py-1"
              >
                {attempt.languageKnowledgeScore.toFixed(1)}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <div>
                <div className="font-medium">Đọc hiểu</div>
                <div className="text-sm text-slate-400">Tối thiểu: 19 điểm</div>
              </div>
              <Badge
                variant={attempt.readingScore >= 19 ? "default" : "destructive"}
                className="text-lg px-4 py-1"
              >
                {attempt.readingScore.toFixed(1)}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <div>
                <div className="font-medium">Nghe hiểu</div>
                <div className="text-sm text-slate-400">Tối thiểu: 19 điểm</div>
              </div>
              <Badge
                variant={
                  attempt.listeningScore >= 19 ? "default" : "destructive"
                }
                className="text-lg px-4 py-1"
              >
                {attempt.listeningScore.toFixed(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => router.push("/JLPT_Practice")}
            variant="outline"
            className="border-slate-600 text-white hover:bg-slate-800"
          >
            Quay lại danh sách
          </Button>
          {!attempt.isPassed && (
            <Button
              onClick={() =>
                router.push(`/Exam/JLPTtest?testId=${attempt.testId}`)
              }
              className="bg-pink-600 hover:bg-pink-700"
            >
              Làm lại bài thi
            </Button>
          )}
        </div>

        <div className="text-center text-sm text-slate-500 space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            <span>
              Bắt đầu: {new Date(attempt.startedAt).toLocaleString("vi-VN")}
            </span>
          </div>
          {attempt.completedAt && (
            <div>
              Hoàn thành:{" "}
              {new Date(attempt.completedAt).toLocaleString("vi-VN")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JLPTResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0B1120]">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-400" />
        </div>
      }
    >
      <JLPTResultPageInner />
    </Suspense>
  );
}
