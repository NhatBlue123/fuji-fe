"use client";

import { useMemo } from "react";
import { CheckCircle, XCircle, Lightbulb, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionResult {
  questionId: number;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string | null;
  isCorrect: boolean;
}

interface QuizResultsDashboardProps {
  quizTitle: string;
  totalQuestions: number;
  userScore: number;
  userName: string;
  results: QuestionResult[];
  className?: string;
}

export function QuizResultsDashboard({
  quizTitle,
  totalQuestions,
  userScore,
  userName,
  results,
  className,
}: QuizResultsDashboardProps) {
  const scorePercentage = useMemo(() => {
    if (totalQuestions === 0) return 0;
    return Math.round((userScore / totalQuestions) * 100);
  }, [userScore, totalQuestions]);

  const correctCount = useMemo(() => {
    return results.filter((r) => r.isCorrect).length;
  }, [results]);

  const wrongCount = useMemo(() => {
    return results.filter((r) => !r.isCorrect).length;
  }, [results]);

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-emerald-400";
    if (percentage >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (percentage: number) => {
    if (percentage >= 80) return "bg-emerald-500/10 border-emerald-500/30";
    if (percentage >= 60) return "bg-yellow-500/10 border-yellow-500/30";
    return "bg-red-500/10 border-red-500/30";
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-[#F0F0F0] mb-1">{quizTitle}</h3>
        <p className="text-xs text-[#8B8FA8]">Kết quả của {userName}</p>
      </div>

      {/* Score Card */}
      <div className={cn("rounded-xl border p-4 text-center", getScoreBg(scorePercentage))}>
        <div className={cn("text-4xl font-bold mb-1", getScoreColor(scorePercentage))}>
          {scorePercentage}%
        </div>
        <div className="text-sm text-[#8B8FA8]">
          {userScore} / {totalQuestions} câu đúng
        </div>
        <div className="flex items-center justify-center gap-2 mt-3">
          <TrendingUp className="h-4 w-4 text-[#8B8FA8]" />
          <span className="text-xs text-[#8B8FA8]">
            {correctCount} đúng · {wrongCount} sai
          </span>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-[#F0F0F0]">Chi tiết từng câu</h4>
        {results.map((result, index) => (
          <div
            key={result.questionId}
            className={cn(
              "rounded-lg border p-3",
              result.isCorrect
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-red-500/20 bg-red-500/5"
            )}
          >
            {/* Question Header */}
            <div className="flex items-start gap-2 mb-2">
              {result.isCorrect ? (
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-[#8B8FA8]">Câu {index + 1}</span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full",
                      result.isCorrect
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400"
                    )}
                  >
                    {result.isCorrect ? "Đúng" : "Sai"}
                  </span>
                </div>
                <p className="text-sm text-[#F0F0F0]">{result.questionText}</p>
              </div>
            </div>

            {/* Answers */}
            <div className="ml-6 space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[#8B8FA8]">Đáp án của bạn:</span>
                <span
                  className={cn(
                    "font-medium",
                    result.isCorrect ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {result.userAnswer || "(Không trả lời)"}
                </span>
              </div>
              {!result.isCorrect && (
                <div className="flex items-center gap-2">
                  <span className="text-[#8B8FA8]">Đáp án đúng:</span>
                  <span className="font-medium text-emerald-400">{result.correctAnswer}</span>
                </div>
              )}
            </div>

            {/* Explanation (only for wrong answers) */}
            {!result.isCorrect && result.explanation && (
              <div className="ml-6 mt-3 p-2 rounded-lg bg-[#252838]/50 border border-white/[0.06]">
                <div className="flex items-center gap-1.5 mb-1">
                  <Lightbulb className="h-3.5 w-3.5 text-yellow-400" />
                  <span className="text-xs font-medium text-yellow-400">Giải thích</span>
                </div>
                <p className="text-xs text-[#8B8FA8] leading-relaxed">
                  {result.explanation}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
