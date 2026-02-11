"use client";

import { use, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  useGetFlashCardByIdQuery,
  useSubmitExerciseResultMutation,
} from "@/store/services/flashcardApi";

/* ─── Types ──────────────────────────────────────────── */
interface MultipleChoiceQuestion {
  id: number;
  type: "vocab_to_meaning" | "meaning_to_vocab";
  question: string;
  answer: string;
  options: string[];
  hint: string;
}

type AnswerRecord = {
  selected: string;
  correct: boolean;
};

/* ─── Helpers ────────────────────────────────────────── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const LABELS = ["A", "B", "C", "D"];

/* ─── Component ──────────────────────────────────────── */
export default function MultipleChoiceExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: flashcard, isLoading, error } = useGetFlashCardByIdQuery(id);
  const [submitResult] = useSubmitExerciseResultMutation();

  const [questions, setQuestions] = useState<MultipleChoiceQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, AnswerRecord>>({});
  const [showResults, setShowResults] = useState(false);

  /* Generate questions */
  const generateQuestions = useCallback(() => {
    if (!flashcard?.cards || flashcard.cards.length < 4) return;
    const cards = flashcard.cards;
    const picked = shuffle(cards).slice(0, Math.min(10, cards.length));

    const qs: MultipleChoiceQuestion[] = picked.map((card, idx) => {
      const isV2M = Math.random() > 0.5;
      if (isV2M) {
        const wrong = shuffle(
          cards.filter((c) => c.meaning !== card.meaning).map((c) => c.meaning),
        ).slice(0, 3);
        return {
          id: idx,
          type: "vocab_to_meaning",
          question: card.vocabulary || "",
          answer: card.meaning || "",
          options: shuffle([card.meaning || "", ...wrong]),
          hint: card.pronunciation || "",
        };
      } else {
        const wrong = shuffle(
          cards
            .filter((c) => c.vocabulary !== card.vocabulary)
            .map((c) => c.vocabulary),
        ).slice(0, 3);
        return {
          id: idx,
          type: "meaning_to_vocab",
          question: card.meaning || "",
          answer: card.vocabulary || "",
          options: shuffle([card.vocabulary || "", ...wrong]),
          hint: card.pronunciation || "",
        };
      }
    });

    setQuestions(qs);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswers({});
    setShowResults(false);
  }, [flashcard]);

  useEffect(() => {
    generateQuestions();
  }, [generateQuestions]);

  /* Derived */
  const currentQ = questions[currentIndex];
  const isAnswered = selectedAnswer !== null;
  const correctCount = useMemo(
    () => Object.values(answers).filter((a) => a.correct).length,
    [answers],
  );
  const progress = questions.length
    ? ((currentIndex + (isAnswered ? 1 : 0)) / questions.length) * 100
    : 0;

  /* Handlers */
  const handleSelect = useCallback(
    (option: string) => {
      if (isAnswered || !currentQ) return;
      setSelectedAnswer(option);
      const correct = option === currentQ.answer;
      setAnswers((prev) => ({
        ...prev,
        [currentQ.id]: { selected: option, correct },
      }));
    },
    [isAnswered, currentQ],
  );

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((p) => p + 1);
      setSelectedAnswer(null);
    } else {
      setShowResults(true);
      submitResult({
        flashcardId: id,
        exerciseType: "multiple_choice",
        correctCount,
        totalCount: questions.length,
      }).catch(console.error);
    }
  }, [currentIndex, questions, correctCount, id, submitResult]);

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
    const pct = Math.round((correctCount / questions.length) * 100);
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
          {/* Score Card */}
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
              <span className="text-pink-400 font-bold">{correctCount}</span>/
              <span className="font-bold">{questions.length}</span> câu
            </p>

            {/* Big percentage ring */}
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

            {/* Answer summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <p className="text-2xl font-black text-green-400">
                  {correctCount}
                </p>
                <p className="text-xs text-muted-foreground">Đúng</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-2xl font-black text-red-400">
                  {questions.length - correctCount}
                </p>
                <p className="text-xs text-muted-foreground">Sai</p>
              </div>
            </div>

            {/* Review wrong answers */}
            {questions.length - correctCount > 0 && (
              <div className="text-left space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">
                  Câu trả lời sai:
                </p>
                {questions
                  .filter((q) => answers[q.id] && !answers[q.id].correct)
                  .map((q) => (
                    <div
                      key={q.id}
                      className="bg-card border border-border rounded-xl p-3 flex items-center gap-3"
                    >
                      <span className="material-symbols-outlined text-red-400 text-sm">
                        close
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">
                          {q.question}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Bạn chọn:{" "}
                          <span className="text-red-400">
                            {answers[q.id]?.selected}
                          </span>{" "}
                          — Đáp án:{" "}
                          <span className="text-green-400">{q.answer}</span>
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}

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
                href={`/flashcards/exercise/${id}/fill-blank`}
                className="px-6 py-3 bg-secondary hover:bg-secondary/80 border border-border text-foreground font-bold rounded-xl transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">
                  edit_note
                </span>
                Điền từ
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

  /* ─── Question Screen ──────────────────────────────── */
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
              Trắc nghiệm
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
            <span className="text-green-400">{correctCount} đúng</span>
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
            href={`/flashcards/exercise/${id}/fill-blank`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary border border-border text-muted-foreground hover:text-foreground transition-all text-sm"
          >
            <span className="material-symbols-outlined text-base">
              edit_note
            </span>
            Điền từ
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
        <div className="w-full max-w-2xl space-y-6">
          {/* Question Card */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 text-center relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500" />

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {currentQ?.type === "vocab_to_meaning"
                ? "Chọn nghĩa đúng của từ"
                : "Chọn từ vựng đúng cho nghĩa"}
            </p>

            <p className="text-3xl md:text-4xl font-black mb-2 leading-tight">
              {currentQ?.question}
            </p>

            {currentQ?.type === "vocab_to_meaning" && currentQ?.hint && (
              <p className="text-base text-pink-400 font-medium">
                /{currentQ.hint}/
              </p>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQ?.options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrectOption = option === currentQ.answer;

              let classes =
                "bg-card border-2 border-border hover:border-pink-500/50 hover:bg-pink-500/5";
              let iconEl = null;

              if (isAnswered) {
                if (isCorrectOption) {
                  classes =
                    "bg-green-500/10 border-2 border-green-500 text-green-400";
                  iconEl = (
                    <span className="material-symbols-outlined text-green-400">
                      check_circle
                    </span>
                  );
                } else if (isSelected && !isCorrectOption) {
                  classes =
                    "bg-red-500/10 border-2 border-red-500 text-red-400";
                  iconEl = (
                    <span className="material-symbols-outlined text-red-400">
                      cancel
                    </span>
                  );
                } else {
                  classes = "bg-card border-2 border-border opacity-50";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(option)}
                  disabled={isAnswered}
                  className={`flex items-center gap-3 p-4 rounded-xl transition-all ${classes} ${
                    !isAnswered ? "active:scale-[0.98] cursor-pointer" : ""
                  }`}
                >
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      isAnswered && isCorrectOption
                        ? "bg-green-500/20 text-green-400"
                        : isAnswered && isSelected
                          ? "bg-red-500/20 text-red-400"
                          : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {LABELS[idx]}
                  </span>
                  <span className="flex-1 text-left font-semibold text-sm md:text-base leading-snug">
                    {option}
                  </span>
                  {iconEl}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {isAnswered && (
            <div
              className={`flex items-center gap-3 p-4 rounded-xl border ${
                answers[currentQ.id]?.correct
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <span
                className={`material-symbols-outlined text-xl ${
                  answers[currentQ.id]?.correct
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {answers[currentQ.id]?.correct
                  ? "check_circle"
                  : "highlight_off"}
              </span>
              <div className="flex-1">
                <p
                  className={`font-bold text-sm ${
                    answers[currentQ.id]?.correct
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {answers[currentQ.id]?.correct ? "Chính xác!" : "Chưa đúng"}
                </p>
                {!answers[currentQ.id]?.correct && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Đáp án đúng:{" "}
                    <span className="text-green-400 font-semibold">
                      {currentQ.answer}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {/* Question dots */}
          <div className="flex gap-1.5 flex-wrap max-w-[50%]">
            {questions.map((q, idx) => {
              const a = answers[q.id];
              let dotClass = "bg-secondary";
              if (a) {
                dotClass = a.correct ? "bg-green-500" : "bg-red-500";
              }
              if (idx === currentIndex) {
                dotClass +=
                  " ring-2 ring-pink-500 ring-offset-1 ring-offset-background";
              }
              return (
                <div
                  key={q.id}
                  className={`w-3 h-3 rounded-full transition-all ${dotClass}`}
                  title={`Câu ${idx + 1}`}
                />
              );
            })}
          </div>

          <button
            onClick={handleNext}
            disabled={!isAnswered}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isAnswered
                ? "bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-500/20"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            }`}
          >
            {currentIndex === questions.length - 1
              ? "Xem kết quả"
              : "Tiếp theo"}
            <span className="material-symbols-outlined text-base">
              {currentIndex === questions.length - 1
                ? "assessment"
                : "arrow_forward"}
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
}
