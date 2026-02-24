"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useGetAttemptByIdQuery } from "@/store/services/jlptApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Trophy, Target } from "lucide-react";
import type { AnswerDetail } from "@/types/jlpt";

export default function JLPTResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");

  const { data: attempt, isLoading, error } = useGetAttemptByIdQuery(
    Number(attemptId),
    { skip: !attemptId }
  );

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

  // Parse answer details if available
  let answerDetails: AnswerDetail[] = [];
  try {
    if (attempt.userAnswers) {
      answerDetails = JSON.parse(attempt.userAnswers);
    }
  } catch (e) {
    console.error("Failed to parse answer details:", e);
  }

  const accuracyPercent = Math.round(
    (attempt.correctAnswers / attempt.totalQuestions) * 100
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
                <div className="text-sm text-slate-400">
                  Tối thiểu: 19 điểm
                </div>
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

            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
              <div>
                <div className="font-semibold text-white">Đọc hiểu</div>
                <div className="text-sm text-slate-400">
                  Tối thiểu: 19 điểm
                </div>
              </div>
              <Badge
                variant={
                  attempt.readingScore >= 19 ? "default" : "destructive"
                }
                className="text-lg px-4 py-1"
              >
                {attempt.readingScore.toFixed(1)}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
              <div>
                <div className="font-semibold text-white">Nghe hiểu</div>
                <div className="text-sm text-slate-400">
                  Tối thiểu: 19 điểm
                </div>
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
      </div>
    </div>
  );
}
