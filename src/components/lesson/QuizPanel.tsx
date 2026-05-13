"use client";

import { useCallback, useState } from "react";
import { HelpCircle, Play, SkipForward, Eye, EyeOff, Flag, Plus, X, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateQuizMutation,
  useListQuizzesQuery,
  useSubmitQuizAnswerMutation,
  useGetQuizResultsQuery,
  type QuizResponse,
  type QuizType,
} from "@/store/services/lessonApi";
import { useQuizStomp, type QuizQuestionPublic, type QuizSubmissionEvent, type QuizRevealEvent } from "@/hooks/useQuizStomp";
import { cn } from "@/lib/utils";
import { QuizCreator } from "./quiz/QuizCreator";
import { StickyAudioPlayer } from "./quiz/StickyAudioPlayer";
import { SplitScreenView } from "./quiz/SplitScreenView";
import { QuizProgress } from "./quiz/QuizProgress";
import { QuizResultsDashboard } from "./quiz/QuizResultsDashboard";

interface QuizPanelProps {
  lessonId: number;
  token: string | null;
  isTeacher: boolean;
}

export function QuizPanel({ lessonId, token, isTeacher }: QuizPanelProps) {
  const { data: quizzes = [], refetch } = useListQuizzesQuery({ lessonId });
  const [createQuiz, { isLoading: creating }] = useCreateQuizMutation();
  const [submitAnswer, { isLoading: submitting }] = useSubmitQuizAnswerMutation();

  // Quiz creator state
  const [creatorTitle, setCreatorTitle] = useState("");
  const [creatorQuizType, setCreatorQuizType] = useState<QuizType>("VOCAB");
  const [creatorMediaContent, setCreatorMediaContent] = useState("");
  const [creatorPassageText, setCreatorPassageText] = useState("");
  const [creatorQuestions, setCreatorQuestions] = useState<import("@/store/services/lessonApi").QuizQuestionItem[]>([]);

  // Quiz panel state
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null);
  const [liveQuestion, setLiveQuestion] = useState<QuizQuestionPublic | null>(null);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [reveal, setReveal] = useState<QuizRevealEvent | null>(null);
  const [feed, setFeed] = useState<QuizSubmissionEvent[]>([]);
  const [showCreator, setShowCreator] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isLiveQuestionHidden, setIsLiveQuestionHidden] = useState(false);

  const resetLiveQuiz = useCallback(() => {
    setActiveQuizId(null);
    setLiveQuestion(null);
    setStudentAnswer("");
    setReveal(null);
    setFeed([]);
    setShowResults(false);
    setIsLiveQuestionHidden(false);
  }, []);

  const onQuestion = useCallback((q: QuizQuestionPublic) => {
    setActiveQuizId(q.quizId);
    setLiveQuestion(q);
    setReveal(null);
    setStudentAnswer("");
    setShowResults(false);
    setIsLiveQuestionHidden(false);
  }, []);

  const onSubmission = useCallback((s: QuizSubmissionEvent) => {
    setFeed((prev) => [...prev.slice(-20), s]);
  }, []);

  const onReveal = useCallback((r: QuizRevealEvent) => {
    setReveal(r);
  }, []);

  const onEnded = useCallback(() => {
    resetLiveQuiz();
  }, [resetLiveQuiz]);

  const { startQuiz, nextQuestion, submitLive, sendReveal, endQuiz } = useQuizStomp({
    lessonId,
    token,
    onQuestion,
    onSubmission,
    onReveal,
    onEnded,
  });

  // Reactive query: enabled when teacher + results are shown for an active quiz.
  // No manual refetch needed — RTK Query auto-fetches when `enabled` flips false→true.
  const { data: results } = useGetQuizResultsQuery(
    { lessonId, quizId: activeQuizId ?? 0 },
    { skip: !isTeacher || !activeQuizId || !showResults }
  );

  const handleCreate = async () => {
    if (!creatorTitle.trim() || creatorQuestions.length === 0) {
      toast.error("Nhập tiêu đề và ít nhất 1 câu hỏi");
      return;
    }

    // Validate questions
    for (const q of creatorQuestions) {
      if (!q.questionText.trim()) {
        toast.error("Câu hỏi không được để trống");
        return;
      }
      if (q.type === "MULTIPLE_CHOICE" && !q.optionsJson) {
        toast.error("Câu hỏi trắc nghiệm cần có các lựa chọn");
        return;
      }
    }

    try {
      await createQuiz({
        lessonId,
        title: creatorTitle.trim(),
        quizType: creatorQuizType,
        mediaContent: creatorQuizType === "LISTENING" ? creatorMediaContent : undefined,
        passageText: creatorQuizType === "READING" ? creatorPassageText : undefined,
        questions: creatorQuestions.map((q, idx) => ({
          ...q,
          orderIndex: idx,
        })),
      }).unwrap();

      toast.success("Đã tạo quiz");
      setCreatorTitle("");
      setCreatorQuestions([]);
      setCreatorMediaContent("");
      setCreatorPassageText("");
      setShowCreator(false);
      refetch();
    } catch {
      toast.error("Không tạo được quiz");
    }
  };

  const parseOptions = (json?: string | null): string[] => {
    if (!json) return [];
    try {
      const v = JSON.parse(json) as unknown;
      return Array.isArray(v) ? v.map(String) : [];
    } catch {
      return [];
    }
  };

  const handleSubmitAnswer = async () => {
    if (!studentAnswer || !liveQuestion || !activeQuizId) return;
    try {
      await submitAnswer({
        lessonId,
        quizId: activeQuizId,
        questionId: liveQuestion.id,
        answer: studentAnswer,
      }).unwrap();
      submitLive(activeQuizId, liveQuestion.id, studentAnswer);
      toast.success("Đã gửi");
    } catch {
      toast.error("Gửi thất bại");
    }
  };

  const handleEndQuiz = (quizId: number) => {
    endQuiz(quizId);
    resetLiveQuiz();
  };

  const getQuizQuestionCount = (quizId: number) => {
    return quizzes.find((q) => q.id === quizId)?.questionCount ?? 0;
  };

  const getNextQuizInList = (quizId: number) => {
    const currentIndex = quizzes.findIndex((q) => q.id === quizId);
    return currentIndex >= 0 ? quizzes[currentIndex + 1] : undefined;
  };

  const canGoNext = (quizId: number) => {
    if (!liveQuestion || liveQuestion.quizId !== quizId) {
      return false;
    }

    const totalQuestions = getQuizQuestionCount(quizId);
    if (totalQuestions > 0 && liveQuestion.questionIndex + 1 < totalQuestions) {
      return true;
    }

    return Boolean(getNextQuizInList(quizId));
  };

  const handleStartQuiz = (quizId: number) => {
    setActiveQuizId(quizId);
    setShowResults(false);
    setIsLiveQuestionHidden(false);
    startQuiz(quizId, 0);
  };

  const handleNextQuestion = (quizId: number) => {
    if (!liveQuestion || liveQuestion.quizId !== quizId) {
      toast.info("Bấm Start trước khi chuyển câu tiếp theo");
      return;
    }

    const totalQuestions = getQuizQuestionCount(quizId);
    const next = liveQuestion.questionIndex + 1;
    if (totalQuestions > 0 && next < totalQuestions) {
      setReveal(null);
      setStudentAnswer("");
      setIsLiveQuestionHidden(false);
      nextQuestion(quizId, next);
      return;
    }

    const nextQuiz = getNextQuizInList(quizId);
    if (nextQuiz) {
      setActiveQuizId(nextQuiz.id);
      setReveal(null);
      setStudentAnswer("");
      setIsLiveQuestionHidden(false);
      startQuiz(nextQuiz.id, 0);
      return;
    }

    toast.info("Đây là câu cuối của danh sách quiz");
  };

  const getNextTitle = (quizId: number) => {
    if (!liveQuestion || liveQuestion.quizId !== quizId) {
      return "Bấm Start trước";
    }

    const totalQuestions = getQuizQuestionCount(quizId);
    if (totalQuestions > 0 && liveQuestion.questionIndex + 1 < totalQuestions) {
      return "Câu tiếp theo";
    }

    const nextQuiz = getNextQuizInList(quizId);
    if (nextQuiz) {
      return `Chuyển sang quiz: ${nextQuiz.title}`;
    }

    return "Đây là câu cuối";
  };

  const getQuizTypeLabel = (type?: string) => {
    switch (type) {
      case "LISTENING": return "Nghe";
      case "READING": return "Đọc";
      default: return "Ngữ pháp";
    }
  };

  const getQuizTypeColor = (type?: string) => {
    switch (type) {
      case "LISTENING": return "bg-blue-500/20 text-blue-400";
      case "READING": return "bg-green-500/20 text-green-400";
      default: return "bg-[#6C63FF]/20 text-[#6C63FF]";
    }
  };

  // Get total questions from current quiz
  const getTotalQuestions = () => {
    return activeQuizId ? getQuizQuestionCount(activeQuizId) : 0;
  };

  return (
    <div className="h-full flex flex-col min-h-0 text-[13px]">
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/[0.08] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-[#6C63FF]" />
          <span className="font-medium text-[#F0F0F0]">Quiz</span>
        </div>
        {liveQuestion && (
          <button
            type="button"
            onClick={() => setIsLiveQuestionHidden((prev) => !prev)}
            className={cn(
              "ml-auto mr-1.5 flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
              isLiveQuestionHidden
                ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                : "bg-white/[0.06] text-[#C9CAD4] hover:bg-white/[0.1]"
            )}
            title={isLiveQuestionHidden ? "Hiện quiz" : "Ẩn quiz"}
          >
            {isLiveQuestionHidden ? (
              <>
                <Eye className="h-3 w-3" />
                Hiện quiz
              </>
            ) : (
              <>
                <EyeOff className="h-3 w-3" />
                Ẩn quiz
              </>
            )}
          </button>
        )}
        {isTeacher && (
          <button
            onClick={() => setShowCreator(!showCreator)}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
              showCreator
                ? "bg-[#FF6B6B]/20 text-[#FF6B6B]"
                : "bg-[#6C63FF]/20 text-[#6C63FF] hover:bg-[#6C63FF]/30"
            )}
          >
            {showCreator ? (
              <>
                <X className="h-3 w-3" />
                Đóng
              </>
            ) : (
              <>
                <Plus className="h-3 w-3" />
                Tạo mới
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
        {/* Quiz Creator */}
        {isTeacher && showCreator && (
          <div className="rounded-xl border border-[#6C63FF]/30 bg-[#1a1d27] p-3">
            <QuizCreator
              title={creatorTitle}
              setTitle={setCreatorTitle}
              quizType={creatorQuizType}
              setQuizType={setCreatorQuizType}
              mediaContent={creatorMediaContent}
              setMediaContent={setCreatorMediaContent}
              passageText={creatorPassageText}
              setPassageText={setCreatorPassageText}
              questions={creatorQuestions}
              setQuestions={setCreatorQuestions}
              onCreate={handleCreate}
              isCreating={creating}
            />
          </div>
        )}

        {/* Quiz List */}
        <div className="space-y-2">
          <p className="text-xs text-[#8B8FA8]">Danh sách quiz</p>
          {quizzes.length === 0 ? (
            <p className="text-xs text-[#8B8FA8]/70">Chưa có quiz nào</p>
          ) : (
            quizzes.map((q: QuizResponse) => (
              <div
                key={q.id}
                className={cn(
                  "rounded-lg border px-2 py-2 flex items-center justify-between gap-2 transition-colors",
                  activeQuizId === q.id
                    ? "border-[#6C63FF]/50 bg-[#6C63FF]/10"
                    : "border-white/[0.08] bg-[#1a1d27]/80 hover:border-white/[0.12]"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[#F0F0F0] text-xs font-medium truncate">{q.title}</p>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full shrink-0", getQuizTypeColor(q.quizType))}>
                      {getQuizTypeLabel(q.quizType)}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8B8FA8]">{q.questionCount} câu</p>
                </div>
                <div className="flex flex-wrap gap-1 shrink-0">
                  <button
                    type="button"
                    className="rounded-md bg-white/[0.06] px-2 py-1 text-[10px] text-[#F0F0F0] hover:bg-white/10"
                    onClick={() => {
                      setActiveQuizId(q.id);
                      setFeed([]);
                      setShowResults(false);
                    }}
                  >
                    Chọn
                  </button>
                  {isTeacher && activeQuizId === q.id && (
                    <>
                      <button
                        type="button"
                        className="rounded-md bg-[#6C63FF]/30 px-2 py-1 text-[10px] text-[#F0F0F0]"
                        onClick={() => handleStartQuiz(q.id)}
                        title="Bắt đầu"
                      >
                        <Play className="inline h-3 w-3 mr-0.5" />
                        Start
                      </button>
                      <button
                        type="button"
                        disabled={
                          !liveQuestion ||
                          liveQuestion.quizId !== q.id ||
                          !canGoNext(q.id)
                        }
                        className="rounded-md bg-white/[0.08] px-2 py-1 text-[10px] disabled:cursor-not-allowed disabled:opacity-40"
                        onClick={() => handleNextQuestion(q.id)}
                        title={getNextTitle(q.id)}
                      >
                        <SkipForward className="inline h-3 w-3 mr-0.5" />
                        Next
                      </button>
                      <button
                        type="button"
                        className="rounded-md bg-white/[0.08] px-2 py-1 text-[10px]"
                        onClick={() => liveQuestion && sendReveal(liveQuestion.id)}
                      >
                        <Eye className="inline h-3 w-3 mr-0.5" />
                        Reveal
                      </button>
                      <button
                        type="button"
                        className="rounded-md bg-[#FF6B6B]/25 px-2 py-1 text-[10px] text-[#ffb4b4]"
                        onClick={() => handleEndQuiz(q.id)}
                      >
                        <Flag className="inline h-3 w-3 mr-0.5" />
                        End
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Live Question Display */}
        {liveQuestion && isLiveQuestionHidden && (
          <div className="rounded-xl border border-white/[0.08] bg-[#1a1d27]/80 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", getQuizTypeColor(liveQuestion.quizType))}>
                    {getQuizTypeLabel(liveQuestion.quizType)}
                  </span>
                  <span className="text-xs text-[#F0F0F0]">
                    Câu {liveQuestion.questionIndex + 1}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[#8B8FA8] truncate">
                  Quiz đang được ẩn trên máy này để dành chỗ tạo quiz mới.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLiveQuestionHidden(false)}
                className="shrink-0 rounded-md bg-[#6C63FF]/20 px-2 py-1 text-[10px] text-[#CFCBFF] hover:bg-[#6C63FF]/30"
              >
                <Eye className="inline h-3 w-3 mr-1" />
                Hiện quiz
              </button>
            </div>
          </div>
        )}

        {liveQuestion && !isLiveQuestionHidden && (
          <div className="rounded-xl border border-[#6C63FF]/30 bg-[#1a1d27] p-3 space-y-3">
            {/* Question Header with Progress */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", getQuizTypeColor(liveQuestion.quizType))}>
                  {getQuizTypeLabel(liveQuestion.quizType)}
                </span>
                <ChevronRight className="h-3 w-3 text-[#8B8FA8]" />
                <span className="text-xs text-[#8B8FA8]">
                  Câu {liveQuestion.questionIndex + 1}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <QuizProgress
              current={liveQuestion.questionIndex + 1}
              total={getTotalQuestions()}
            />

            {/* Audio Player for LISTENING */}
            {liveQuestion.quizType === "LISTENING" && liveQuestion.mediaContent && (
              <StickyAudioPlayer audioUrl={liveQuestion.mediaContent} />
            )}

            {/* Split View for READING */}
            {liveQuestion.quizType === "READING" && liveQuestion.passageText && (
              <SplitScreenView
                passageText={liveQuestion.passageText}
                questions={[
                  ...(liveQuestion.passageQuestions || []),
                  {
                    id: liveQuestion.id,
                    questionIndex: liveQuestion.questionIndex,
                    questionText: liveQuestion.questionText,
                    optionsJson: liveQuestion.optionsJson,
                  },
                ]}
                currentQuestionIndex={liveQuestion.passageQuestions?.length ?? 0}
                selectedAnswer={studentAnswer}
                onAnswerSelect={setStudentAnswer}
                showResults={!!reveal}
              />
            )}

            {/* Standard Question Display for VOCAB/LISTENING without audio */}
            {(liveQuestion.quizType !== "READING") && (
              <>
                <p className="text-sm text-[#F0F0F0] whitespace-pre-wrap">{liveQuestion.questionText}</p>
                {liveQuestion.questionType === "MULTIPLE_CHOICE" && (
                  <div className="space-y-1.5">
                    {parseOptions(liveQuestion.optionsJson).map((opt, i) => {
                      const labels = ["A", "B", "C", "D", "E", "F", "G", "H"];
                      return (
                        <label
                          key={i}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-xs",
                            studentAnswer === opt
                              ? "bg-[#6C63FF]/20 border border-[#6C63FF]/50"
                              : "bg-[#252838]/50 border border-white/[0.06] hover:border-white/[0.12]"
                          )}
                        >
                          <input
                            type="radio"
                            name="mc"
                            className="accent-[#6C63FF]"
                            checked={studentAnswer === opt}
                            onChange={() => setStudentAnswer(opt)}
                          />
                          <span className="text-[#8B8FA8] font-medium w-5">{labels[i]}.</span>
                          <span className="text-[#E8E8F0]">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {liveQuestion.questionType !== "MULTIPLE_CHOICE" && (
                  <input
                    className="w-full rounded-lg bg-[#252838] border border-white/10 px-2 py-1.5 text-xs"
                    placeholder="Nhập đáp án..."
                    value={studentAnswer}
                    onChange={(e) => setStudentAnswer(e.target.value)}
                  />
                )}
              </>
            )}

            {/* Reveal Section */}
            {reveal && reveal.questionId === liveQuestion.id && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <p className="text-xs text-emerald-400 font-medium">
                  Đáp án: <span className="font-mono">{reveal.correctAnswer}</span>
                </p>
                {reveal.explanation && (
                  <div className="pt-2 border-t border-emerald-500/20">
                    <p className="text-xs text-[#8B8FA8]">
                      <span className="text-yellow-400 font-medium">Giải thích: </span>
                      {reveal.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button for Students */}
            {!isTeacher && liveQuestion && activeQuizId && (
              <button
                type="button"
                disabled={submitting || !studentAnswer}
                className="w-full rounded-lg bg-[#6C63FF] px-3 py-2 text-xs text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#5a52e0] transition-colors"
                onClick={handleSubmitAnswer}
              >
                {submitting ? "Đang gửi..." : "Gửi đáp án"}
              </button>
            )}
          </div>
        )}

        {/* Results Dashboard */}
        {showResults && activeQuizId && results && (
          <div className="rounded-xl border border-[#6C63FF]/30 bg-[#1a1d27] p-3">
            <QuizResultsDashboard
              quizTitle={quizzes.find(q => q.id === activeQuizId)?.title || "Quiz"}
              totalQuestions={results.totalQuestions}
              userScore={results.scoresByUser[String(results.submissions[0]?.userId)] || 0}
              userName={results.submissions[0]?.userName || "Học viên"}
              results={results.submissions.map((s, idx) => ({
                questionId: s.questionId,
                questionText: `Câu ${idx + 1} (ID: ${s.questionId})`,
                userAnswer: s.userAnswer || (s.correct ? "Đúng" : "Sai"),
                correctAnswer: s.correctAnswer || (s.correct ? "Đúng" : "Sai"),
                isCorrect: s.correct,
              }))}
            />
          </div>
        )}

        {/* Realtime Feed for Teacher */}
        {isTeacher && feed.length > 0 && (
          <div className="rounded-xl border border-white/[0.08] p-2 space-y-1">
            <p className="text-[10px] text-[#8B8FA8]">Realtime</p>
            {feed.map((f, i) => (
              <div key={`${f.userId}-${f.questionId}-${i}`} className="text-[11px] text-[#c9cad4]">
                <span className="text-[#6C63FF]">{f.userName}</span> —{" "}
                {f.correct ? (
                  <span className="text-emerald-400">đúng (+{f.scorePoints})</span>
                ) : (
                  <span className="text-[#FF6B6B]">sai</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Results JSON for Teacher */}
        {isTeacher && results && activeQuizId && !showResults && (
          <div className="rounded-xl border border-white/[0.08] p-2 text-[11px] text-[#8B8FA8]">
            <p className="text-[#F0F0F0] text-xs mb-1">Kết quả</p>
            <div className="space-y-1">
              {Object.entries(results.scoresByUser).map(([userId, score]) => {
                const submissions = results.submissions.filter(s => String(s.userId) === userId);
                const userName = submissions[0]?.userName || `User ${userId}`;
                const correctCount = submissions.filter(s => s.correct).length;
                return (
                  <div key={userId} className="flex items-center justify-between">
                    <span className="text-[#6C63FF]">{userName}</span>
                    <span className="text-emerald-400">{correctCount}/{results.totalQuestions} đúng ({score} điểm)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
