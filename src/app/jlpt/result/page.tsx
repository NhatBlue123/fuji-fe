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
import { Progress } from "@/components/ui/progress";
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
  BookOpen,
  Lightbulb,
  TrendingUp,
  Star,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  const passThreshold = 19;
  const sectionScore = [
    { name: "Ngữ pháp & Từ vựng", score: attempt.languageKnowledgeScore, min: passThreshold, key: "grammar" },
    { name: "Đọc hiểu", score: attempt.readingScore, min: passThreshold, key: "reading" },
    { name: "Nghe hiểu", score: attempt.listeningScore, min: passThreshold, key: "listening" },
  ];

  const getSuggestion = () => {
    const weakSections = sectionScore.filter(s => s.score < s.min);
    if (weakSections.length === 0) {
      return {
        icon: <Trophy className="w-5 h-5 text-yellow-400" />,
        title: "Xuất sắc!",
        desc: "Bạn đã vượt qua tất cả các phần. Hãy tiếp tục luyện tập để duy trì phong độ!",
        resources: [
          { text: "Luyện đề Nâng cao", href: "/JLPT_Practice" },
          { text: "Học từ vựng N1/N2", href: "/flashcards" },
        ]
      };
    }

    const weakest = weakSections.reduce((a, b) => a.score < b.score ? a : b);

    if (weakest.key === "grammar") {
      return {
        icon: <BookOpen className="w-5 h-5 text-blue-400" />,
        title: "Cải thiện Ngữ pháp & Từ vựng",
        desc: `Bạn cần đạt tối thiểu ${passThreshold} điểm. Hãy ôn tập ngữ pháp cơ bản và mở rộng vốn từ vựng.`,
        resources: [
          { text: "Học ngữ pháp N3/N2", href: "/course" },
          { text: "Flashcard từ vựng", href: "/flashcards" },
        ]
      };
    }
    if (weakest.key === "reading") {
      return {
        icon: <Lightbulb className="w-5 h-5 text-amber-400" />,
        title: "Cải thiện Đọc hiểu",
        desc: `Phần đọc hiểu cần thêm ${(passThreshold - weakest.score).toFixed(1)} điểm. Hãy luyện đọc các bài văn ngắn.`,
        resources: [
          { text: "Luyện đọc JLPT", href: "/JLPT_Practice" },
          { text: "Chat AI hỗ trợ", href: "/ai-chat" },
        ]
      };
    }
    return {
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
      title: "Cải thiện Nghe hiểu",
      desc: `Bạn cần thêm ${(passThreshold - weakest.score).toFixed(1)} điểm. Hãy luyện nghe mỗi ngày.`,
      resources: [
        { text: "Luyện nghe JLPT", href: "/JLPT_Practice" },
        { text: "Video call với giáo viên", href: "/video-call" },
      ]
    };
  };

  const suggestion = getSuggestion();

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
        {/* Hero Result */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 p-8 text-center">
          {/* Background decorations */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-2xl" />

          <div className="relative z-10">
            {/* Score Progress Ring */}
            <div className="relative inline-flex items-center justify-center mb-6">
              <svg className="w-36 h-36 -rotate-90">
                <circle cx="72" cy="72" r="64" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-700" />
                <circle
                  cx="72" cy="72" r="64" fill="none"
                  stroke="currentColor" strokeWidth="8"
                  strokeLinecap="round"
                  className={cn(
                    "transition-all duration-1000",
                    attempt.isPassed ? "text-emerald-400" : "text-pink-400"
                  )}
                  strokeDasharray={`${2 * Math.PI * 64}`}
                  strokeDashoffset={`${2 * Math.PI * 64 * (1 - accuracyPercent / 100)}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white">{accuracyPercent}%</span>
                <span className="text-xs text-slate-400">Độ chính xác</span>
              </div>
            </div>

            {/* Result Icon & Title */}
            {attempt.isPassed ? (
              <>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Trophy className="w-10 h-10 text-yellow-400 animate-pulse" />
                  <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                    Chúc mừng! Bạn đã đỗ
                  </h1>
                  <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
                </div>
                <p className="text-slate-300 text-lg mb-2">{attempt.test?.title}</p>
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-4 py-2 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-semibold">Kết quả: {attempt.isPassed ? "PASS" : "FAIL"}</span>
                  <Star className="w-4 h-4" />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Star className="w-8 h-8 text-pink-400" />
                  <h1 className="text-3xl font-black text-white">
                    Kết quả bài thi
                  </h1>
                </div>
                <p className="text-slate-300 text-lg mb-2">{attempt.test?.title}</p>
                <p className="text-slate-400 max-w-md mx-auto">
                  Bạn chưa đạt điểm tối thiểu ở một số phần. Đừng nản lòng — mỗi lần thất bại là một bước tiến!
                </p>
              </>
            )}
          </div>
        </div>

        {/* Overall Score Progress Bar */}
        <Card className="bg-slate-800/60 border-slate-700/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-pink-400" />
              Điểm tổng quan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">Tổng điểm</span>
                  <span className="text-2xl font-black text-white">{attempt.totalScore.toFixed(1)}<span className="text-sm text-slate-400">/180</span></span>
                </div>
                <Progress
                  value={(attempt.totalScore / 180) * 100}
                  className="h-3 bg-slate-700"
                  indicatorClassName={cn(
                    "bg-gradient-to-r transition-all",
                    attempt.isPassed
                      ? "from-emerald-500 to-teal-400"
                      : "from-pink-500 to-rose-400"
                  )}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-slate-900/50 rounded-xl">
                  <div className="text-2xl font-bold text-white">{attempt.correctAnswers}</div>
                  <div className="text-xs text-slate-400">Câu đúng</div>
                </div>
                <div className="text-center p-3 bg-slate-900/50 rounded-xl">
                  <div className="text-2xl font-bold text-white">{attempt.totalQuestions - attempt.correctAnswers}</div>
                  <div className="text-xs text-slate-400">Câu sai</div>
                </div>
                <div className="text-center p-3 bg-slate-900/50 rounded-xl">
                  <div className="text-2xl font-bold text-pink-400">{accuracyPercent}%</div>
                  <div className="text-xs text-slate-400">Độ chính xác</div>
                </div>
                <div className="text-center p-3 bg-slate-900/50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-400">{formatTime(attempt.timeSpent)}</div>
                  <div className="text-xs text-slate-400">Thời gian</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Scores with Progress */}
        <Card className="bg-slate-800/60 border-slate-700/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Điểm theo phần</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sectionScore.map((section) => (
              <div key={section.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-200">{section.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-lg font-bold",
                      section.score >= section.min ? "text-emerald-400" : "text-pink-400"
                    )}>
                      {section.score.toFixed(1)}
                    </span>
                    <Badge
                      variant={section.score >= section.min ? "default" : "destructive"}
                      className={cn(
                        "text-xs px-2 py-0.5",
                        section.score >= section.min
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                          : "bg-pink-500/20 text-pink-400 border-pink-500/40"
                      )}
                    >
                      {section.score >= section.min ? "Đạt" : `Cần ${section.min}`}
                    </Badge>
                  </div>
                </div>
                <Progress
                  value={(section.score / 60) * 100}
                  className="h-2 bg-slate-700"
                  indicatorClassName={cn(
                    "transition-all",
                    section.score >= section.min
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                      : "bg-gradient-to-r from-pink-500 to-rose-400"
                  )}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Learning Suggestions */}
        <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
                {suggestion.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">{suggestion.title}</h3>
                <p className="text-sm text-slate-300 mb-4">{suggestion.desc}</p>

                <div className="flex flex-wrap gap-2">
                  {suggestion.resources.map((resource, i) => (
                    <Button
                      key={i}
                      asChild
                      size="sm"
                      className={cn(
                        "gap-2 transition-all",
                        attempt.isPassed
                          ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40"
                          : "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/40"
                      )}
                    >
                      <a href={resource.href}>
                        {resource.text}
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
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
              className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 shadow-lg shadow-pink-500/25"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Làm lại bài thi
            </Button>
          )}
          {attempt.isPassed && (
            <Button
              onClick={() => router.push("/JLPT_Practice")}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/25"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Tiếp tục luyện tập
            </Button>
          )}
        </div>

        {/* Exam Info */}
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
