"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useGetAttemptByIdQuery,
  useGetAttemptReviewQuery,
  useCreateQuestionReportMutation,
  useCreateExamFeedbackMutation,
} from "@/store/services/jlptApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Trophy, Target, AlertTriangle } from "lucide-react";
import type { AnswerDetail } from "@/types/jlpt";
import type { AnswerReview } from "@/types/jlpt-review";
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

  const {
    data: review,
  } = useGetAttemptReviewQuery(Number(attemptId), { skip: !attemptId });

  const [createReport] = useCreateQuestionReportMutation();
  const [createExamFeedback, createExamFeedbackState] = useCreateExamFeedbackMutation();
  const [reportingQuestionId, setReportingQuestionId] = React.useState<number | null>(null);
  const [reportReason, setReportReason] = React.useState("");
  const [examFeedback, setExamFeedback] = React.useState("");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1120]">
        <div className="text-center text-white">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-400 mb-4"></div>
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
            className="mt-6"
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

  // Parse answer details if available (fallback only)
  let answerDetails: AnswerDetail[] = [];
  try {
    if (attempt.userAnswers) {
      answerDetails = JSON.parse(attempt.userAnswers);
    }
  } catch (e) {
    console.error("Failed to parse answer details:", e);
  }

  const accuracyPercent = Math.round(
    (attempt.correctAnswers / attempt.totalQuestions) * 100,
  );

  return (
    <div className="min-h-screen bg-[#0B1120] text-white py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          {attempt.isPassed ? (
            <>
              <Trophy className="w-20 h-20 text-yellow-400 mx-auto" />
              <h1 className="text-4xl font-bold text-green-400">
                🎉 Chúc mừng! Bạn đã đỗ!
              </h1>
            </>
          ) : (
            <>
              <XCircle className="w-20 h-20 text-red-400 mx-auto" />
              <h1 className="text-4xl font-bold text-red-400">
                Chưa đạt yêu cầu
              </h1>
              <p className="text-slate-400">
                Đừng nản lòng! Hãy tiếp tục luyện tập nhé! 💪
              </p>
            </>
          )}
        </div>

        {/* Overall Score Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5" />
              Kết quả tổng quan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-slate-900 rounded-lg">
                <div className="text-3xl font-bold text-pink-400">
                  {attempt.totalScore.toFixed(1)}
                </div>
                <div className="text-sm text-slate-400 mt-1">Tổng điểm</div>
              </div>

              <div className="text-center p-4 bg-slate-900 rounded-lg">
                <div className="text-3xl font-bold text-blue-400">
                  {attempt.correctAnswers}/{attempt.totalQuestions}
                </div>
                <div className="text-sm text-slate-400 mt-1">Câu đúng</div>
              </div>

              <div className="text-center p-4 bg-slate-900 rounded-lg">
                <div className="text-3xl font-bold text-purple-400">
                  {accuracyPercent}%
                </div>
                <div className="text-sm text-slate-400 mt-1">Độ chính xác</div>
              </div>

              <div className="text-center p-4 bg-slate-900 rounded-lg">
                <div className="text-3xl font-bold text-green-400">
                  {formatTime(attempt.timeSpent)}
                </div>
                <div className="text-sm text-slate-400 mt-1">Thời gian</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Scores */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Điểm theo phần</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
              <div>
                <div className="font-semibold text-white">
                  Kiến thức ngôn ngữ (Từ vựng + Ngữ pháp)
                </div>
                <div className="text-sm text-slate-400">Tối thiểu: 19 điểm</div>
              </div>
              <Badge
                variant={
                  attempt.languageKnowledgeScore >= 19
                    ? "default"
                    : "destructive"
                }
                className="text-lg px-4 py-1"
              >
                {attempt.languageKnowledgeScore.toFixed(1)}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
              <div>
                <div className="font-semibold text-white">Đọc hiểu</div>
                <div className="text-sm text-slate-400">Tối thiểu: 19 điểm</div>
              </div>
              <Badge
                variant={attempt.readingScore >= 19 ? "default" : "destructive"}
                className="text-lg px-4 py-1"
              >
                {attempt.readingScore.toFixed(1)}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
              <div>
                <div className="font-semibold text-white">Nghe hiểu</div>
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

        {/* Actions */}
        <div className="flex gap-4 justify-center pt-4">
          <Button
            onClick={() => router.push("/JLPT_Practice")}
            variant="outline"
            size="lg"
            className="bg-slate-800 text-white border-slate-600 hover:bg-slate-700"
          >
            Quay lại danh sách
          </Button>
          {!attempt.isPassed && (
            <Button
              onClick={() =>
                router.push(`/Exam/JLPTtest?testId=${attempt.testId}`)
              }
              size="lg"
              className="bg-pink-500 hover:bg-pink-600"
            >
              Làm lại bài thi
            </Button>
          )}
        </div>

        {/* Time info */}
        <div className="text-center text-slate-500 text-sm space-y-1">
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

        {/* Optional test feedback */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Feedback đề thi (tuỳ chọn)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-400">
              Nếu bạn thấy đề thi/câu hỏi có vấn đề (quá khó, lỗi nội dung, format), bạn có thể gửi góp ý để team cải thiện.
              Bạn có thể bỏ qua phần này.
            </p>
            <textarea
              className="w-full h-24 rounded bg-slate-900 border border-slate-600 text-sm text-white p-2"
              value={examFeedback}
              onChange={(e) => setExamFeedback(e.target.value)}
              placeholder="Ví dụ: Câu 12 có 2 đáp án đúng / phần đọc hơi thiếu ngữ cảnh..."
            />
            <div className="flex justify-end">
              <Button
                variant="outline"
                className="bg-slate-800 text-white border-slate-600 hover:bg-slate-700"
                disabled={createExamFeedbackState.isLoading || !examFeedback.trim()}
                onClick={async () => {
                  try {
                    await createExamFeedback({
                      testId: attempt.testId,
                      attemptId: attempt.id,
                      testTitle: attempt.test?.title,
                      feedback: examFeedback.trim(),
                    }).unwrap();
                    toast.success("Đã gửi feedback đề thi. Cảm ơn bạn!");
                    setExamFeedback("");
                  } catch (e) {
                    console.error(e);
                    toast.error("Gửi feedback thất bại, hãy thử lại.");
                  }
                }}
              >
                Gửi feedback đề thi
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Question review list */}
        {review && review.length > 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Chi tiết từng câu hỏi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {review.map((r: AnswerReview, idx: number) => {
                let options: string[] = [];
                if (r.options) {
                  try {
                    const parsed = JSON.parse(r.options);
                    if (Array.isArray(parsed)) options = parsed;
                  } catch {
                    // ignore parse error
                  }
                }
                const isCorrect = r.isCorrect;
                return (
                  <div
                    key={r.questionId}
                    className="p-3 rounded-lg border border-slate-700 bg-slate-900 space-y-2"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200">
                          Câu {idx + 1} • 問題{r.mondaiNumber} {r.mondaiTitle ? `- ${r.mondaiTitle}` : ""}
                        </span>
                        <span className="text-slate-400">
                          Phần: {r.section}
                        </span>
                      </div>
                      <Badge variant={isCorrect ? "default" : "destructive"}>
                        {isCorrect ? "Đúng" : "Sai"}
                      </Badge>
                    </div>
                    <p className="text-sm whitespace-pre-wrap text-slate-100">
                      {r.contentText}
                    </p>
                    {options.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 text-xs mt-1">
                        {options.map((opt, i) => {
                          const choice = i + 1;
                          const isUser = r.selected === choice;
                          const isAns = r.correctOption === choice;
                          return (
                            <div
                              key={i}
                              className={[
                                "px-2 py-1 rounded border",
                                isAns
                                  ? "border-green-500 bg-green-900/40"
                                  : "border-slate-600 bg-slate-800",
                                isUser && !isAns && "border-red-500 bg-red-900/40",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            >
                              <span className="text-slate-400 mr-1">{choice}.</span>
                              <span>{opt}</span>
                              {isUser && (
                                <span className="ml-1 text-[10px] text-pink-300">
                                  (bạn chọn)
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {r.explanation && (
                      <p className="text-xs text-slate-300 mt-2 whitespace-pre-wrap">
                        <span className="font-semibold text-slate-100">Giải thích: </span>
                        {r.explanation}
                      </p>
                    )}
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border-amber-400 text-amber-300 hover:bg-amber-500/10"
                        onClick={() => {
                          setReportingQuestionId(r.questionId);
                          setReportReason("");
                        }}
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Báo cáo câu hỏi
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Report modal (simple overlay) */}
        {reportingQuestionId && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 w-full max-w-md space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Báo cáo câu hỏi
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReportingQuestionId(null)}
                >
                  Đóng
                </Button>
              </div>
              <p className="text-xs text-slate-400">
                Hãy mô tả ngắn gọn vấn đề: đáp án sai, câu mơ hồ, lỗi chính tả,...
              </p>
              <textarea
                className="w-full h-24 rounded bg-slate-800 border border-slate-600 text-xs text-white p-2"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReportingQuestionId(null)}
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  disabled={!reportReason.trim()}
                  onClick={async () => {
                    try {
                      await createReport({
                        questionId: reportingQuestionId,
                        attemptId: attempt.id,
                        reason: reportReason.trim(),
                      }).unwrap();
                      toast.success("Đã gửi báo cáo câu hỏi. Cảm ơn bạn!");
                      setReportingQuestionId(null);
                    } catch (e) {
                      console.error(e);
                      toast.error("Gửi báo cáo thất bại, hãy thử lại.");
                    }
                  }}
                >
                  Gửi báo cáo
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function JLPTResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0B1120]">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-400"></div>
        </div>
      }
    >
      <JLPTResultPageInner />
    </Suspense>
  );
}
