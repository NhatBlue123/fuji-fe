"use client";

import { use, useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useGetFlashCardByIdQuery,
  useSubmitExerciseResultMutation,
} from "@/store/services/flashcardApi";

/* ─── Types ──────────────────────────────────────────── */
interface ExerciseQuestion {
  id: number;
  type: "fill_vocab" | "fill_meaning";
  question: string;
  answer: string;
  hint: string;
}

/* ─── Helpers ────────────────────────────────────────── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/* ─── Component ──────────────────────────────────────── */
export default function FillBlankExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: flashcard, isLoading, error } = useGetFlashCardByIdQuery(id);
  const [submitResult] = useSubmitExerciseResultMutation();

  const [questions, setQuestions] = useState<ExerciseQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [checkedCurrent, setCheckedCurrent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Generate questions */
  const generateQuestions = useCallback(() => {
    if (!flashcard?.cards || flashcard.cards.length < 4) return;
    const cards = flashcard.cards;
    const shuffled = shuffle(cards);
    const half = Math.ceil(shuffled.length / 2);

    const vocabQs = shuffled.slice(0, half).map((card, idx) => ({
      id: idx,
      type: "fill_vocab" as const,
      question: card.meaning || "",
      answer: card.vocabulary || "",
      hint: card.pronunciation || "",
    }));

    const meaningQs = shuffled.slice(half).map((card, idx) => ({
      id: idx + half,
      type: "fill_meaning" as const,
      question: card.vocabulary || "",
      answer: card.meaning || "",
      hint: card.pronunciation || "",
    }));

    const all = shuffle([...vocabQs, ...meaningQs]);
    setQuestions(all);
    setCurrentIndex(0);
    setAnswers({});
    setShowResults(false);
    setCheckedCurrent(false);
  }, [flashcard]);

  useEffect(() => {
    generateQuestions();
  }, [generateQuestions]);

  // Focus input when navigating questions
  useEffect(() => {
    if (!showResults) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [currentIndex, showResults]);

  /* Derived */
  const currentQ = questions[currentIndex];
  const currentAnswer = answers[currentQ?.id] || "";
  const isCurrentCorrect =
    currentQ &&
    normalizeAnswer(currentAnswer) === normalizeAnswer(currentQ.answer);

  const score = useMemo(() => {
    let correct = 0;
    questions.forEach((q) => {
      if (normalizeAnswer(answers[q.id] || "") === normalizeAnswer(q.answer)) {
        correct++;
      }
    });
    return { correct, total: questions.length };
  }, [questions, answers]);

  const answeredCount = questions.filter(
    (q) => answers[q.id]?.trim().length > 0,
  ).length;
  const allAnswered =
    questions.length > 0 && answeredCount === questions.length;
  const progress = questions.length
    ? (answeredCount / questions.length) * 100
    : 0;

  /* Handlers */
  const handleAnswerChange = useCallback(
    (value: string) => {
      if (!currentQ || showResults) return;
      setAnswers((prev) => ({ ...prev, [currentQ.id]: value }));
      setCheckedCurrent(false);
    },
    [currentQ, showResults],
  );

  const handleCheck = useCallback(() => {
    setCheckedCurrent(true);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((p) => p + 1);
      setCheckedCurrent(false);
    }
  }, [currentIndex, questions.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((p) => p - 1);
      setCheckedCurrent(false);
    }
  }, [currentIndex]);

  const handleSubmit = useCallback(async () => {
    setShowResults(true);
    try {
      await submitResult({
        flashcardId: id,
        exerciseType: "fill_blank",
        correctCount: score.correct,
        totalCount: score.total,
      }).unwrap();
    } catch (err) {
      console.error("Failed to submit:", err);
    }
  }, [id, score, submitResult]);

  /* ─── Loading / Error ──────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-background">
        <span className="material-symbols-outlined text-5xl text-pink-400 animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (error || !flashcard || flashcard.cards.length < 4) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-background gap-4">
        <span className="material-symbols-outlined text-6xl text-red-400">
          error
        </span>
        <p className="text-muted-foreground">
          {flashcard?.cards && flashcard.cards.length < 4
            ? "Cần ít nhất 4 thẻ để làm bài tập."
            : "Không thể tải bộ flashcard."}
        </p>
        <Link
          href={`/flashcards/detail/${id}`}
          className="text-pink-400 hover:underline flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Quay lại
        </Link>
      </div>
    );
  }

  /* ─── Results Screen ───────────────────────────────── */
  if (showResults) {
    const pct = Math.round((score.correct / score.total) * 100);
    const emoji =
      pct === 100
        ? "emoji_events"
        : pct >= 70
          ? "sentiment_satisfied"
          : pct >= 40
            ? "sentiment_neutral"
            : "sentiment_dissatisfied";
    const msg =
      pct === 100
        ? "Hoàn hảo!"
        : pct >= 70
          ? "Làm tốt lắm!"
          : pct >= 40
            ? "Khá ổn, cố thêm nhé!"
            : "Cần ôn lại nhiều hơn!";

    return (
      <div className="flex-1 flex flex-col h-screen bg-background text-foreground">
        {/* Header */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-border bg-background/80 backdrop-blur-md">
          <Link
            href={`/flashcards/detail/${id}`}
            className="flex items-center justify-center size-10 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all border border-border"
          >
            <span className="material-symbols-outlined text-xl">
              arrow_back
            </span>
          </Link>
          <h1 className="text-lg font-bold truncate">{flashcard.name}</h1>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-lg text-center space-y-6">
            <span
              className={`material-symbols-outlined text-7xl block ${
                pct >= 70 ? "text-yellow-400" : "text-pink-400"
              }`}
            >
              {emoji}
            </span>
            <h2 className="text-3xl font-black">{msg}</h2>
            <p className="text-muted-foreground">
              Bạn trả lời đúng{" "}
              <span className="text-pink-400 font-bold">{score.correct}</span>/
              <span className="font-bold">{score.total}</span> câu
            </p>

            {/* Progress ring */}
            <div className="relative mx-auto w-40 h-40">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  strokeWidth="10"
                  className="stroke-border"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  strokeWidth="10"
                  strokeLinecap="round"
                  className="stroke-pink-500 transition-all duration-700"
                  strokeDasharray={`${(pct / 100) * 327} 327`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-black">{pct}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <p className="text-2xl font-black text-green-400">
                  {score.correct}
                </p>
                <p className="text-xs text-muted-foreground">Đúng</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-2xl font-black text-red-400">
                  {score.total - score.correct}
                </p>
                <p className="text-xs text-muted-foreground">Sai</p>
              </div>
            </div>

            {/* Review all answers */}
            <div className="text-left space-y-2 max-h-60 overflow-y-auto">
              <p className="text-sm font-semibold text-muted-foreground sticky top-0 bg-background py-1">
                Chi tiết câu trả lời:
              </p>
              {questions.map((q, idx) => {
                const userAns = answers[q.id] || "";
                const isOk =
                  normalizeAnswer(userAns) === normalizeAnswer(q.answer);
                return (
                  <div
                    key={q.id}
                    className={`bg-card border rounded-xl p-3 flex items-start gap-3 ${
                      isOk ? "border-green-500/20" : "border-red-500/20"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-sm mt-0.5 ${
                        isOk ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {isOk ? "check_circle" : "close"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold">
                        <span className="text-muted-foreground font-normal">
                          {idx + 1}.{" "}
                        </span>
                        {q.question}
                      </p>
                      <div className="text-xs mt-0.5">
                        {isOk ? (
                          <span className="text-green-400">{q.answer}</span>
                        ) : (
                          <>
                            <span className="text-red-400 line-through">
                              {userAns || "(trống)"}
                            </span>
                            <span className="text-muted-foreground mx-1">
                              →
                            </span>
                            <span className="text-green-400">{q.answer}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={generateQuestions}
                className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">
                  replay
                </span>
                Làm lại
              </button>
              <Link
                href={`/flashcards/exercise/${id}/multiple-choice`}
                className="px-6 py-3 bg-secondary hover:bg-secondary/80 border border-border text-foreground font-bold rounded-xl transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">quiz</span>
                Trắc nghiệm
              </Link>
              <Link
                href={`/flashcards/detail/${id}`}
                className="px-6 py-3 bg-secondary hover:bg-secondary/80 border border-border text-foreground font-bold rounded-xl transition-all"
              >
                Quay lại
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ─── Exercise Screen ──────────────────────────────── */
  return (
    <div className="flex-1 flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-4">
          <Link
            href={`/flashcards/detail/${id}`}
            className="flex items-center justify-center size-10 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all border border-border"
          >
            <span className="material-symbols-outlined text-xl">
              arrow_back
            </span>
          </Link>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Điền từ
            </span>
            <h1 className="text-lg font-bold truncate max-w-[200px]">
              {flashcard.name}
            </h1>
          </div>
        </div>

        {/* Progress */}
        <div className="flex-1 max-w-sm mx-6">
          <div className="flex justify-between text-xs font-medium text-muted-foreground mb-1">
            <span>
              Câu {currentIndex + 1}/{questions.length}
            </span>
            <span>
              {answeredCount}/{questions.length} đã điền
            </span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href={`/flashcards/exercise/${id}/multiple-choice`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary border border-border text-muted-foreground hover:text-foreground transition-all text-sm"
          >
            <span className="material-symbols-outlined text-base">quiz</span>
            Trắc nghiệm
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
        <div className="w-full max-w-2xl space-y-6">
          {/* Question Card */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 relative overflow-hidden">
            {/* Decorative top bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500" />

            <div className="flex items-start gap-4 mb-6">
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                  currentQ?.type === "fill_vocab"
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-pink-500/20 text-pink-400"
                }`}
              >
                {currentQ?.type === "fill_vocab" ? "VN→JP" : "JP→VN"}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  {currentQ?.type === "fill_vocab"
                    ? "Điền từ vựng tiếng Nhật"
                    : "Điền nghĩa tiếng Việt"}
                </p>
                <p className="text-2xl md:text-3xl font-black leading-tight">
                  {currentQ?.question}
                </p>
                {currentQ?.hint && currentQ.type === "fill_meaning" && (
                  <p className="text-sm text-pink-400 mt-1 font-medium">
                    /{currentQ.hint}/
                  </p>
                )}
              </div>
            </div>

            {/* Input */}
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={currentAnswer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (currentAnswer.trim() && !checkedCurrent) {
                      handleCheck();
                    } else if (checkedCurrent) {
                      if (currentIndex < questions.length - 1) handleNext();
                      else if (allAnswered) handleSubmit();
                    }
                  }
                }}
                placeholder={
                  currentQ?.type === "fill_vocab"
                    ? "Nhập từ vựng tiếng Nhật..."
                    : "Nhập nghĩa tiếng Việt..."
                }
                className={`w-full border-2 rounded-xl px-4 py-4 text-lg font-semibold placeholder:font-normal bg-secondary/30 placeholder:text-muted-foreground focus:outline-none transition-colors ${
                  checkedCurrent
                    ? isCurrentCorrect
                      ? "border-green-500 bg-green-500/5"
                      : "border-red-500 bg-red-500/5"
                    : "border-border focus:border-pink-500"
                }`}
                disabled={showResults}
                autoComplete="off"
              />
              {currentAnswer.trim() && !checkedCurrent && (
                <button
                  onClick={handleCheck}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Kiểm tra
                </button>
              )}
              {checkedCurrent && (
                <span
                  className={`material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 ${
                    isCurrentCorrect ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {isCurrentCorrect ? "check_circle" : "cancel"}
                </span>
              )}
            </div>

            {/* Feedback */}
            {checkedCurrent && (
              <div
                className={`mt-4 flex items-center gap-3 p-3 rounded-xl border ${
                  isCurrentCorrect
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-red-500/10 border-red-500/30"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-lg ${
                    isCurrentCorrect ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {isCurrentCorrect ? "check_circle" : "highlight_off"}
                </span>
                <div className="flex-1">
                  <p
                    className={`font-bold text-sm ${
                      isCurrentCorrect ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {isCurrentCorrect ? "Chính xác!" : "Chưa đúng"}
                  </p>
                  {!isCurrentCorrect && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Đáp án:{" "}
                      <span className="text-green-400 font-semibold">
                        {currentQ.answer}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Hint section */}
          {currentQ?.hint && currentQ.type === "fill_vocab" && (
            <div className="flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-xl">
              <span className="material-symbols-outlined text-pink-400 text-base">
                lightbulb
              </span>
              <span className="text-sm text-muted-foreground">
                Gợi ý phát âm:{" "}
                <span className="text-pink-400 font-medium">
                  /{currentQ.hint}/
                </span>
              </span>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          {/* Nav buttons */}
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-border ${
              currentIndex === 0
                ? "opacity-40 cursor-not-allowed bg-secondary/30"
                : "bg-secondary/50 hover:bg-secondary"
            }`}
          >
            <span className="material-symbols-outlined text-base">
              arrow_back
            </span>
            Trước
          </button>

          {/* Question pills */}
          <div className="flex gap-1.5 flex-wrap justify-center max-w-[60%]">
            {questions.map((q, idx) => {
              const hasAnswer = answers[q.id]?.trim().length > 0;
              let pillClass = "bg-secondary text-muted-foreground";
              if (showResults) {
                const isOk =
                  normalizeAnswer(answers[q.id] || "") ===
                  normalizeAnswer(q.answer);
                pillClass = isOk
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400";
              } else if (hasAnswer) {
                pillClass = "bg-pink-500/20 text-pink-400";
              }
              if (idx === currentIndex) {
                pillClass +=
                  " ring-2 ring-pink-500 ring-offset-1 ring-offset-background";
              }
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setCheckedCurrent(false);
                  }}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${pillClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Next / Submit */}
          {currentIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                allAnswered
                  ? "bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-500/20"
                  : "bg-secondary text-muted-foreground cursor-not-allowed"
              }`}
            >
              Nộp bài
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-secondary/50 hover:bg-secondary border border-border transition-all"
            >
              Tiếp
              <span className="material-symbols-outlined text-base">
                arrow_forward
              </span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
