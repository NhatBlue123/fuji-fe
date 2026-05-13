"use client";

export const dynamic = "force-dynamic";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  useGetAttemptByIdQuery,
  useCreateExamFeedbackMutation,
  useGetJlptAiAssessmentQuery,
  useCreateJlptAiAssessmentMutation,
  type JlptAiAssessment,
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
  BotMessageSquare,
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

  // ── AI Assessment ─────────────────────────────────────────────────────────────
  const attemptIdNum = attemptId ? Number(attemptId) : 0;

  const {
    data: assessment,
    isLoading: isGetLoading,
    error: getError,
  } = useGetJlptAiAssessmentQuery(attemptIdNum, {
    skip: !attemptIdNum,
  });

  const [triggerAssessment, { data: mutateResult, isLoading: isMutationLoading, error: generateError }] =
    useCreateJlptAiAssessmentMutation();

  // Local state mirrors the assessment data.
  // Updated either from the GET query cache or from the POST mutation result.
  const [assessmentData, setAssessmentData] = React.useState<JlptAiAssessment | null>(null);

  // Sync from GET query
  React.useEffect(() => {
    if (assessment) setAssessmentData(assessment);
  }, [assessment]);

  // Sync from POST mutation result (fires when invalidatesTags causes refetch to succeed)
  React.useEffect(() => {
    if (mutateResult) setAssessmentData(mutateResult);
  }, [mutateResult]);

  // Trigger POST only when GET returns 404
  React.useEffect(() => {
    if (!attemptIdNum || isGetLoading) return;
    if (assessment || assessmentData) return; // already have it
    if (getError && (getError as { status?: number }).status === 404) {
      triggerAssessment(attemptIdNum).catch(() => {});
    }
  }, [attemptIdNum, isGetLoading, assessment, assessmentData, getError, triggerAssessment]);

  // Loading: GET in flight, or POST triggered and not yet reflected in query cache
  const isAiLoading = isGetLoading || (isMutationLoading && !mutateResult);
  // Error: non-404 GET failure, or POST/generation failure (only if we have no data)
  const aiError = (!assessmentData && !mutateResult)
    ? ((getError && (getError as { status?: number }).status !== 404) ? getError : generateError)
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-foreground">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4" />
          <p className="text-lg">Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-foreground">
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <p className="text-lg font-semibold">Không thể tải kết quả</p>
          <p className="text-sm text-muted-foreground mt-2">
            Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ
          </p>
          <Button
            onClick={() => router.push("/jlpt-practice")}
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
      router.push("/jlpt-practice");
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
        icon: <Trophy className="w-5 h-5 text-yellow-500" />,
        title: "Xuất sắc!",
        desc: "Bạn đã vượt qua tất cả các phần. Hãy tiếp tục luyện tập để duy trì phong độ!",
        resources: [
          { text: "Luyện đề Nâng cao", href: "/jlpt-practice" },
          { text: "Học từ vựng N1/N2", href: "/flashcards" },
        ]
      };
    }

    const weakest = weakSections.reduce((a, b) => a.score < b.score ? a : b);

    if (weakest.key === "grammar") {
      return {
        icon: <BookOpen className="w-5 h-5 text-primary" />,
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
        icon: <Lightbulb className="w-5 h-5 text-yellow-500" />,
        title: "Cải thiện Đọc hiểu",
        desc: `Phần đọc hiểu cần thêm ${(passThreshold - weakest.score).toFixed(1)} điểm. Hãy luyện đọc các bài văn ngắn.`,
        resources: [
          { text: "Luyện đọc JLPT", href: "/jlpt-practice" },
          { text: "Chat AI hỗ trợ", href: "/ai-chat" },
        ]
      };
    }
    return {
      icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
      title: "Cải thiện Nghe hiểu",
      desc: `Bạn cần thêm ${(passThreshold - weakest.score).toFixed(1)} điểm. Hãy luyện nghe mỗi ngày.`,
      resources: [
        { text: "Luyện nghe JLPT", href: "/jlpt-practice" },
        { text: "Video call với giáo viên", href: "/video-call" },
      ]
    };
  };

  const suggestion = getSuggestion();

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4">
      <Sheet open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <button
          type="button"
          onClick={() => setFeedbackOpen(true)}
          className="fixed right-0 top-1/2 z-40 -translate-y-1/2 flex flex-col items-center justify-center gap-2 rounded-l-xl border border-r-0 border-primary/50 bg-primary text-primary-foreground px-2.5 py-6 shadow-lg transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Mở gửi phản hồi đề thi"
        >
          <MessageSquareText className="h-5 w-5 shrink-0" />
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ writingMode: "vertical-rl" }}
          >
            Phản hồi
          </span>
        </button>

        <SheetContent
          side="right"
          className="w-full border-l p-6 sm:max-w-md"
        >
          <SheetHeader className="space-y-1 text-left">
            <SheetTitle>
              Phản hồi đề thi
            </SheetTitle>
            <SheetDescription>
              Góp ý chung về đề thi (không cần trích nội dung câu hỏi). Sau khi
              gửi, bạn sẽ được chuyển về danh sách bài thi.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <Textarea
              rows={6}
              className="resize-none"
              value={examFeedback}
              onChange={(e) => setExamFeedback(e.target.value)}
              placeholder="Ví dụ: Độ khó, thời gian, trải nghiệm làm bài..."
            />
          </div>
          <SheetFooter className="mt-6 flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFeedbackOpen(false)}
            >
              Đóng
            </Button>
            <Button
              type="button"
              disabled={
                createExamFeedbackState.isLoading || !examFeedback.trim()
              }
              onClick={handleSubmitFeedback}
            >
              {createExamFeedbackState.isLoading ? "Đang gửi..." : "Gửi phản hồi"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Hero Result */}
        <div className="relative overflow-hidden rounded-3xl border p-8 text-center bg-card">
          {/* Background decorations */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-2xl" />

          <div className="relative z-10">
            {/* Score Progress Ring */}
            <div className="relative inline-flex items-center justify-center mb-6">
              <svg className="w-36 h-36 -rotate-90">
                <circle cx="72" cy="72" r="64" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                <circle
                  cx="72" cy="72" r="64" fill="none"
                  stroke="currentColor" strokeWidth="8"
                  strokeLinecap="round"
                  className={cn(
                    "transition-all duration-1000",
                    attempt.isPassed ? "text-emerald-500" : "text-primary"
                  )}
                  strokeDasharray={`${2 * Math.PI * 64}`}
                  strokeDashoffset={`${2 * Math.PI * 64 * (1 - accuracyPercent / 100)}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black">{accuracyPercent}%</span>
                <span className="text-xs text-muted-foreground">Độ chính xác</span>
              </div>
            </div>

            {/* Result Icon & Title */}
            {attempt.isPassed ? (
              <>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Trophy className="w-10 h-10 text-yellow-500 animate-pulse" />
                  <h1 className="text-3xl font-black">
                    Chúc mừng! Bạn đã đỗ
                  </h1>
                  <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
                </div>
                <p className="text-lg mb-2">{attempt.test?.title}</p>
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-semibold">Kết quả: {attempt.isPassed ? "PASS" : "FAIL"}</span>
                  <Star className="w-4 h-4" />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Star className="w-8 h-8 text-primary" />
                  <h1 className="text-3xl font-black">
                    Kết quả bài thi
                  </h1>
                </div>
                <p className="text-lg mb-2">{attempt.test?.title}</p>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Bạn chưa đạt điểm tối thiểu ở một số phần. Đừng nản lòng — mỗi lần thất bại là một bước tiến!
                </p>
              </>
            )}
          </div>
        </div>

        {/* Overall Score Progress Bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-primary" />
              Điểm tổng quan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Tổng điểm</span>
                  <span className="text-2xl font-black">{attempt.totalScore.toFixed(1)}<span className="text-sm text-muted-foreground">/180</span></span>
                </div>
                <Progress
                  value={(attempt.totalScore / 180) * 100}
                  className="h-3"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 border rounded-xl">
                  <div className="text-2xl font-bold">{attempt.correctAnswers}</div>
                  <div className="text-xs text-muted-foreground">Câu đúng</div>
                </div>
                <div className="text-center p-3 border rounded-xl">
                  <div className="text-2xl font-bold">{attempt.totalQuestions - attempt.correctAnswers}</div>
                  <div className="text-xs text-muted-foreground">Câu sai</div>
                </div>
                <div className="text-center p-3 border rounded-xl">
                  <div className="text-2xl font-bold text-primary">{accuracyPercent}%</div>
                  <div className="text-xs text-muted-foreground">Độ chính xác</div>
                </div>
                <div className="text-center p-3 border rounded-xl">
                  <div className="text-2xl font-bold text-primary">{formatTime(attempt.timeSpent)}</div>
                  <div className="text-xs text-muted-foreground">Thời gian</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Scores with Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Điểm theo phần</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sectionScore.map((section) => (
              <div key={section.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{section.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-lg font-bold",
                      section.score >= section.min ? "text-emerald-500" : "text-destructive"
                    )}>
                      {section.score.toFixed(1)}
                    </span>
                    <Badge
                      variant={section.score >= section.min ? "default" : "destructive"}
                    >
                      {section.score >= section.min ? "Đạt" : `Cần ${section.min}`}
                    </Badge>
                  </div>
                </div>
                <Progress
                  value={(section.score / 60) * 100}
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Learning Suggestions */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                {suggestion.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">{suggestion.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{suggestion.desc}</p>

                <div className="flex flex-wrap gap-2">
                  {suggestion.resources.map((resource, i) => (
                    <Button
                      key={i}
                      asChild
                      size="sm"
                      variant="outline"
                      className={cn(
                        "gap-2 transition-all",
                        attempt.isPassed
                          ? "border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                          : "border-primary/50 hover:bg-primary/10"
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

        {/* AI Assessment Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              Sensei đánh giá bài làm
              {assessmentData && assessmentData.modelVersion && (
                <Badge variant="outline" className="text-xs ml-2">
                  {assessmentData.modelVersion}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isAiLoading ? (
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Sensei đang phân tích bài làm...</p>
                    <p className="text-xs text-muted-foreground">Vui lòng chờ trong giây lát</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[100, 80, 65, 45].map((w, i) => (
                    <div key={i} className="h-3 bg-muted rounded-full animate-pulse" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </div>
            ) : aiError ? (
              <div className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border mb-3">
                  <BotMessageSquare className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Chưa thể tạo đánh giá AI lúc này
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Kết quả thi và gợi ý học tập vẫn hiển thị bình thường.
                </p>
              </div>
            ) : assessmentData ? (
              <div className="p-6">
                {assessmentData.generatedAt && (
                  <p className="text-xs text-muted-foreground mb-4">
                    Đánh giá lúc {new Date(assessmentData.generatedAt).toLocaleString("vi-VN")}
                  </p>
                )}
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {assessmentData.markdown}
                  </ReactMarkdown>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => router.push("/jlpt-practice")}
            variant="outline"
          >
            Quay lại danh sách
          </Button>
          {!attempt.isPassed && (
            <Button
              onClick={() =>
                router.push(`/jlpt-test?testId=${attempt.testId}`)
              }
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Làm lại bài thi
            </Button>
          )}
          {attempt.isPassed && (
            <Button
              onClick={() => router.push("/jlpt-practice")}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Tiếp tục luyện tập
            </Button>
          )}
        </div>

        {/* Exam Info */}
        <div className="text-center text-sm text-muted-foreground space-y-1">
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
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary" />
        </div>
      }
    >
      <JLPTResultPageInner />
    </Suspense>
  );
}

