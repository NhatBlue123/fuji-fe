"use client";

import { useTranslation } from "react-i18next";
import { use, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useAddWeakCardsMutation,
  useGetFlashCardByIdQuery,
  useSubmitExerciseResultMutation,
} from "@/store/services/flashcardApi";
import { Button } from "@/components/ui/button";
import {
  buildFlashcardDetailHref,
  buildFlashcardExerciseHref,
  extractTrailingId,
} from "@/lib/flashcardSeo";
import { getMockImage } from "@/lib/mockImages";
import { useAuth } from "@/store/hooks";
import type { CardResponseDTO } from "@/types/flashcard";

/* ─── Types ──────────────────────────────────────────── */
interface MultipleChoiceQuestion {
  id: number;
  flashcardId: number;
  type: "vocab_to_meaning" | "meaning_to_vocab";
  question: string;
  answer: string;
  options: string[];
  hint: string;
  previewUrl?: string | null;
}

function buildMultipleChoiceQuestions(cards: CardResponseDTO[]): MultipleChoiceQuestion[] {
  if (!cards || cards.length < 4) return [];
  const picked = shuffle(cards).slice(0, Math.min(10, cards.length));

  return picked.map((card, idx) => {
    const isV2M = Math.random() > 0.5;
    if (isV2M) {
      const wrong = shuffle(
        cards
          .filter((c) => c.id !== card.id && c.meaning !== card.meaning)
          .map((c) => c.meaning),
      ).slice(0, 3);
      return {
        id: idx,
        flashcardId: Number(card.id),
        type: "vocab_to_meaning" as const,
        question: card.vocabulary || "",
        answer: card.meaning || "",
        options: shuffle([card.meaning || "", ...wrong]),
        hint: card.pronunciation || "",
        previewUrl: card.previewUrl || null,
      };
    }
    const wrong = shuffle(
      cards
        .filter((c) => c.id !== card.id && c.vocabulary !== card.vocabulary)
        .map((c) => c.vocabulary),
    ).slice(0, 3);
    return {
      id: idx,
      flashcardId: Number(card.id),
      type: "meaning_to_vocab" as const,
      question: card.meaning || "",
      answer: card.vocabulary || "",
      options: shuffle([card.vocabulary || "", ...wrong]),
      hint: card.pronunciation || "",
      previewUrl: card.previewUrl || null,
    };
  });
}

type AnswerRecord = { selected: string; correct: boolean };

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
const ANSWER_COLORS = [
  { base: "from-rose-500 to-pink-500", shadow: "shadow-rose-500/20", icon: "🌸" },
  { base: "from-violet-500 to-purple-500", shadow: "shadow-violet-500/20", icon: "🟣" },
  { base: "from-cyan-500 to-blue-500", shadow: "shadow-cyan-500/20", icon: "💎" },
  { base: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/20", icon: "🟠" },
];

/* ─── Component ──────────────────────────────────────── */
export default function MultipleChoiceExercisePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { t } = useTranslation();
  const { slug } = use(params);
  const id = extractTrailingId(slug);
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();
  const { data: flashcard, isLoading, error } = useGetFlashCardByIdQuery(id, {
    skip: !isAuthenticated,
  });
  const [submitResult] = useSubmitExerciseResultMutation();
  const [addWeakCards] = useAddWeakCardsMutation();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) router.replace("/login");
  }, [isInitialized, isAuthenticated, router]);

  const [questionSeed, setQuestionSeed] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, AnswerRecord>>({});
  const [showResults, setShowResults] = useState(false);
  const [shakeOption, setShakeOption] = useState<string | null>(null);

  const generateQuestions = useCallback(() => {
    setQuestionSeed((seed) => seed + 1);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswers({});
    setShowResults(false);
  }, []);

  const questions = useMemo(
    () => {
      void questionSeed;
      return buildMultipleChoiceQuestions(flashcard?.cards || []);
    },
    [flashcard?.cards, questionSeed],
  );

  const currentQ = questions[currentIndex];
  const isAnswered = selectedAnswer !== null;
  const correctCount = useMemo(
    () => Object.values(answers).filter((a) => a.correct).length,
    [answers],
  );
  const progress = questions.length
    ? ((currentIndex + (isAnswered ? 1 : 0)) / questions.length) * 100
    : 0;
  const detailHref = flashcard
    ? buildFlashcardDetailHref(flashcard)
    : `/flashcards/detail/${slug}`;
  const fillBlankHref = flashcard
    ? buildFlashcardExerciseHref(flashcard, "fill-blank")
    : `/flashcards/exercise/${slug}/fill-blank`;

  const currentImage =
    currentQ?.previewUrl || getMockImage(currentQ?.id ?? 0);

  const handleSelect = useCallback(
    (option: string) => {
      if (isAnswered || !currentQ) return;
      setSelectedAnswer(option);
      const correct = option === currentQ.answer;
      if (!correct) setShakeOption(option);
      setAnswers((prev) => ({
        ...prev,
        [currentQ.id]: { selected: option, correct },
      }));
    },
    [isAnswered, currentQ],
  );

  useEffect(() => {
    if (shakeOption) {
      const timer = setTimeout(() => setShakeOption(null), 600);
      return () => clearTimeout(timer);
    }
  }, [shakeOption]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((p) => p + 1);
      setSelectedAnswer(null);
      setShakeOption(null);
    } else {
      setShowResults(true);
      submitResult({
        flashcardId: id,
        exerciseType: "multiple_choice",
        correctCount,
        totalCount: questions.length,
      }).catch(console.error);

      const wrongCardIds = Array.from(
        new Set(
          questions
            .filter((q) => answers[q.id] && !answers[q.id].correct)
            .map((q) => q.flashcardId),
        ),
      );

      if (wrongCardIds.length > 0) {
        void addWeakCards({
          flashcardIds: wrongCardIds,
          deckSlug: slug,
          source: "multiple-choice",
        }).unwrap().catch(console.error);
      }
    }
  }, [currentIndex, questions, correctCount, id, submitResult, answers, addWeakCards, slug]);

  /* ─── Loading ─────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-background gap-3">
        <div className="relative size-16">
          <div className="absolute inset-0 rounded-full border-4 border-pink-500/20 border-t-pink-500 animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center text-xl">📚</span>
        </div>
        <p className="text-muted-foreground text-sm animate-pulse">
          {t("common.loading", { defaultValue: "Đang tải..." })}
        </p>
      </div>
    );
  }

  /* ─── Error ──────────────────────────────────────── */
  if (error || !flashcard || !flashcard.cards || flashcard.cards.length < 4) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-background gap-4">
        <div className="size-20 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-red-400">psychology_alt</span>
        </div>
        <p className="text-muted-foreground text-center max-w-xs">
          {flashcard?.cards && flashcard.cards.length < 4
            ? t("flashcard.exercise.needMinCards", { defaultValue: "Cần ít nhất 4 thẻ để làm bài tập." })
            : t("flashcard.exercise.loadError", { defaultValue: "Không thể tải bộ flashcard." })}
        </p>
        <Link
          href={detailHref}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border text-foreground hover:bg-secondary transition-all font-medium"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          {t("common.goBack", { defaultValue: "Quay lại" })}
        </Link>
      </div>
    );
  }

  /* ─── Results Screen ─────────────────────────────── */
  if (showResults) {
    const pct = Math.round((correctCount / questions.length) * 100);
    const isPerfect = pct === 100;
    const isGood = pct >= 70;
    const wrongQuestions = questions.filter((q) => answers[q.id] && !answers[q.id].correct);

    return (
      <div className="flex-1 flex flex-col h-screen bg-background text-foreground overflow-y-auto">
        {/* Decorative bg */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px]" />
        </div>

        <header className="relative flex items-center gap-3 px-6 py-4 border-b border-border/40 bg-background/60 backdrop-blur-xl">
          <Link
            href={detailHref}
            className="flex items-center justify-center size-10 rounded-xl bg-card/60 hover:bg-card border border-border/40 text-muted-foreground hover:text-foreground transition-all"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold truncate">{flashcard.name}</h1>
        </header>

        <main className="relative flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-lg space-y-6 text-center">
            {/* Big emoji */}
            <div className={`mx-auto size-28 rounded-3xl flex items-center justify-center text-5xl transition-all duration-700 ${
              isPerfect ? "bg-yellow-500/10 shadow-lg shadow-yellow-500/10" :
              isGood ? "bg-emerald-500/10 shadow-lg shadow-emerald-500/10" :
              "bg-pink-500/10 shadow-lg shadow-pink-500/10"
            }`}>
              {isPerfect ? "🏆" : isGood ? "🎉" : "💪"}
            </div>

            <div>
              <h2 className="text-3xl font-black">
                {isPerfect
                  ? t("flashcard.exercise.perfect", { defaultValue: "Hoàn hảo!" })
                  : isGood
                    ? t("flashcard.exercise.greatJob", { defaultValue: "Làm tốt lắm!" })
                    : t("flashcard.exercise.keepTrying", { defaultValue: "Cố gắng thêm nhé!" })}
              </h2>
              <p className="text-muted-foreground mt-2">
                {t("flashcard.exercise.scoreDesc", {
                  correct: correctCount,
                  total: questions.length,
                  defaultValue: `Bạn trả lời đúng ${correctCount}/${questions.length} câu`,
                })}
              </p>
            </div>

            {/* Score ring */}
            <div className="relative mx-auto w-36 h-36">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" strokeWidth="8" className="stroke-border/40" />
                <circle
                  cx="60" cy="60" r="52" fill="none" strokeWidth="8" strokeLinecap="round"
                  className={isPerfect ? "stroke-yellow-400" : isGood ? "stroke-emerald-400" : "stroke-pink-400"}
                  strokeDasharray={`${(pct / 100) * 327} 327`}
                  style={{ transition: "stroke-dasharray 1s ease-out" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black">{pct}%</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">score</span>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center">
                <p className="text-3xl font-black text-emerald-400">{correctCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("flashcard.exercise.correct", { defaultValue: "Đúng" })}
                </p>
              </div>
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 text-center">
                <p className="text-3xl font-black text-red-400">{questions.length - correctCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("flashcard.exercise.incorrect", { defaultValue: "Sai" })}
                </p>
              </div>
            </div>

            {/* Wrong answers review */}
            {wrongQuestions.length > 0 && (
              <div className="text-left space-y-2">
                <p className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">rate_review</span>
                  {t("flashcard.exercise.wrongAnswers", { defaultValue: "Câu trả lời sai:" })}
                </p>
                {wrongQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="bg-card/60 border border-border/40 rounded-2xl p-4 flex items-start gap-3 hover:border-red-500/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-red-400 mt-0.5 shrink-0">close</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{q.question}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs">
                        <span className="text-muted-foreground">
                          {t("flashcard.exercise.yourAnswer", { defaultValue: "Bạn chọn" })}:{" "}
                          <span className="text-red-400 font-semibold">{answers[q.id]?.selected}</span>
                        </span>
                        <span className="text-muted-foreground">
                          {t("flashcard.exercise.correctAnswer", { defaultValue: "Đáp án" })}:{" "}
                          <span className="text-emerald-400 font-semibold">{q.answer}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <Button
                onClick={generateQuestions}
                className="px-5 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold rounded-xl shadow-lg shadow-pink-500/20 flex items-center gap-2 transition-all hover:scale-105"
              >
                <span className="material-symbols-outlined text-sm">replay</span>
                {t("flashcard.exercise.retry", { defaultValue: "Làm lại" })}
              </Button>
              <Link
                href={fillBlankHref}
                className="px-5 py-3 bg-card border border-border hover:bg-secondary text-foreground font-bold rounded-xl flex items-center gap-2 transition-all hover:scale-105"
              >
                <span className="material-symbols-outlined text-sm">edit_note</span>
                {t("flashcard.exercise.fillBlank", { defaultValue: "Điền từ" })}
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ─── Question Screen ─────────────────────────────── */
  const lastAnswer = currentQ ? answers[currentQ.id] : null;

  return (
    <div className="flex-1 flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-br from-pink-500/[0.04] via-purple-500/[0.04] to-cyan-500/[0.04] rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative flex items-center justify-between px-4 md:px-6 py-3 border-b border-border/30 bg-background/60 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <Link
            href={detailHref}
            className="flex items-center justify-center size-9 rounded-xl bg-card/60 hover:bg-card border border-border/40 text-muted-foreground hover:text-foreground transition-all"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </Link>
          <div className="hidden sm:block">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
              {t("flashcard.exercise.multipleChoice", { defaultValue: "Trắc nghiệm" })}
            </p>
            <p className="text-sm font-bold truncate max-w-[160px]">{flashcard.name}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex-1 max-w-[280px] mx-4">
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1.5">
            <span>{currentIndex + 1}/{questions.length}</span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-400" />
              {correctCount}
            </span>
          </div>
          <div className="w-full h-2 bg-muted/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Link
          href={fillBlankHref}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/60 hover:bg-card border border-border/40 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
        >
          <span className="material-symbols-outlined text-sm">edit_note</span>
          {t("flashcard.exercise.fillBlank", { defaultValue: "Điền từ" })}
        </Link>
      </header>

      {/* Main content */}
      <main className="relative flex-1 flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden z-10">
        <div className="w-full max-w-lg space-y-5">
          {/* Image + Question card */}
          <div className="relative">
            {/* Image */}
            <div className="relative mx-auto -mb-8 z-10">
              <div className="size-28 md:size-32 rounded-2xl overflow-hidden shadow-2xl border-3 border-white/10 mx-auto bg-gradient-to-br from-pink-500/10 to-purple-500/10">
                <img
                  alt=""
                  className="w-full h-full object-cover"
                  src={currentImage}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              {/* Floating particles decorator */}
              <div className="absolute -top-2 -right-2 size-6 rounded-full bg-pink-500/20 blur-sm animate-pulse" />
              <div className="absolute -bottom-1 -left-3 size-4 rounded-full bg-purple-500/20 blur-sm animate-pulse" style={{ animationDelay: "0.5s" }} />
            </div>

            {/* Question card */}
            <div className="relative bg-card/70 backdrop-blur-xl border border-border/40 rounded-3xl pt-16 pb-6 px-6 md:px-8 text-center shadow-2xl">
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500" />

              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">
                {currentQ?.type === "vocab_to_meaning"
                  ? t("flashcard.exercise.pickMeaning", { defaultValue: "Chọn nghĩa đúng của từ" })
                  : t("flashcard.exercise.pickVocab", { defaultValue: "Chọn từ vựng đúng cho nghĩa" })}
              </p>

              <h2 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">
                {currentQ?.question}
              </h2>

              {currentQ?.type === "vocab_to_meaning" && currentQ?.hint && (
                <p className="text-sm text-pink-400/80 font-medium font-mono">
                  {currentQ.hint}
                </p>
              )}
            </div>
          </div>

          {/* Options grid */}
          <div className="grid grid-cols-2 gap-3">
            {currentQ?.options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrectOption = option === currentQ.answer;
              const isWrongSelected = isSelected && !isCorrectOption;
              const isShaking = shakeOption === option;
              const color = ANSWER_COLORS[idx];

              let borderClass = "border-white/10 hover:border-white/20";
              let bgClass = "bg-card/60 hover:bg-card/90";
              let textClass = "text-foreground";
              let iconEl = null;
              let shadowClass = "";

              if (isAnswered) {
                if (isCorrectOption) {
                  borderClass = "border-emerald-500/50";
                  bgClass = "bg-emerald-500/10";
                  textClass = "text-emerald-300";
                  shadowClass = "shadow-lg shadow-emerald-500/10";
                  iconEl = (
                    <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
                  );
                } else if (isWrongSelected) {
                  borderClass = "border-red-500/50";
                  bgClass = "bg-red-500/10";
                  textClass = "text-red-300";
                  shadowClass = "shadow-lg shadow-red-500/10";
                  iconEl = (
                    <span className="material-symbols-outlined text-red-400 text-lg">cancel</span>
                  );
                } else {
                  bgClass = "bg-card/30";
                  textClass = "text-muted-foreground/50";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(option)}
                  disabled={isAnswered}
                  className={`group relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 ${borderClass} ${bgClass} ${shadowClass} transition-all duration-300 ${
                    !isAnswered ? "active:scale-95 hover:-translate-y-0.5 cursor-pointer" : ""
                  } ${isShaking ? "animate-[shake_0.5s_ease-out]" : ""}`}
                >
                  {/* Letter badge */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black transition-all duration-300 ${
                    isAnswered && isCorrectOption
                      ? "bg-emerald-500/20 text-emerald-400"
                      : isAnswered && isWrongSelected
                        ? "bg-red-500/20 text-red-400"
                        : `bg-gradient-to-br ${color.base} text-white shadow-lg ${color.shadow} group-hover:scale-110`
                  }`}>
                    {isAnswered && isCorrectOption ? iconEl : LABELS[idx]}
                  </div>

                  <span className={`text-sm font-bold leading-snug text-center ${textClass}`}>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Feedback bar */}
          {isAnswered && lastAnswer && (
            <div
              className={`flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-sm animate-[slideUp_0.3s_ease-out] ${
                lastAnswer.correct
                  ? "bg-emerald-500/5 border-emerald-500/30"
                  : "bg-red-500/5 border-red-500/30"
              }`}
            >
              <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                lastAnswer.correct ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
              }`}>
                <span className="material-symbols-outlined text-xl">
                  {lastAnswer.correct ? "celebration" : "lightbulb"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${lastAnswer.correct ? "text-emerald-400" : "text-red-400"}`}>
                  {lastAnswer.correct
                    ? t("flashcard.exercise.correctFeedback", { defaultValue: "Chính xác! 🎉" })
                    : t("flashcard.exercise.incorrectFeedback", { defaultValue: "Chưa đúng" })}
                </p>
                {!lastAnswer.correct && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {t("flashcard.exercise.answerIs", { defaultValue: "Đáp án" })}:{" "}
                    <span className="text-emerald-400 font-bold">{currentQ.answer}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative px-4 py-3 border-t border-border/30 bg-background/60 backdrop-blur-xl z-20">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          {/* Question dots */}
          <div className="flex gap-1.5 flex-wrap">
            {questions.map((q, idx) => {
              const a = answers[q.id];
              let dotClass = "bg-muted-foreground/20";
              if (a) dotClass = a.correct ? "bg-emerald-400 shadow-sm shadow-emerald-400/30" : "bg-red-400 shadow-sm shadow-red-400/30";
              if (idx === currentIndex) dotClass += " ring-2 ring-pink-500 ring-offset-2 ring-offset-background scale-125";
              return (
                <div
                  key={q.id}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${dotClass}`}
                />
              );
            })}
          </div>

          <Button
            onClick={handleNext}
            disabled={!isAnswered}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
              isAnswered
                ? "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 hover:scale-105"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {currentIndex === questions.length - 1
              ? t("flashcard.exercise.viewResults", { defaultValue: "Xem kết quả" })
              : t("flashcard.exercise.next", { defaultValue: "Tiếp theo" })}
            <span className="material-symbols-outlined text-base">
              {currentIndex === questions.length - 1 ? "assessment" : "arrow_forward"}
            </span>
          </Button>
        </div>
      </footer>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
