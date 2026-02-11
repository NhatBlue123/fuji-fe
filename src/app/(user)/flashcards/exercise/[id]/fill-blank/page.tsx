"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGetFlashCardByIdQuery, useSubmitExerciseResultMutation } from "@/store/services/flashcardApi";

interface ExerciseQuestion {
  id: number;
  type: "fill_vocab" | "fill_meaning"; // fill_vocab: điền từ vựng (nghĩa → từ), fill_meaning: điền nghĩa (từ → nghĩa)
  question: string; // The text to show (vocabulary or meaning)
  answer: string; // The expected answer
  hint: string; // Hint text (romanization or pronunciation)
  options?: string[]; // For multiple choice (not used in fill-blank)
}

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
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // Initialize questions from flashcards
  useEffect(() => {
    if (flashcard?.cards && flashcard.cards.length >= 4) {
      const cards = flashcard.cards;
      const shuffled = [...cards].sort(() => Math.random() - 0.5);
      const half = Math.ceil(shuffled.length / 2);

      // Split into 2 halves
      const vocabQuestions = shuffled.slice(0, half).map((card, idx) => ({
        id: idx,
        type: "fill_vocab" as const,
        question: card.meaning || "",
        answer: card.vocabulary || "",
        hint: card.pronunciation || "[pronunciation]",
      }));

      const meaningQuestions = shuffled.slice(half).map((card, idx) => ({
        id: idx + half,
        type: "fill_meaning" as const,
        question: card.vocabulary || "",
        answer: card.meaning || "",
        hint: card.pronunciation || "",
      }));

      // Combine and shuffle
      const allQuestions = [...vocabQuestions, ...meaningQuestions].sort(() => Math.random() - 0.5);
      setQuestions(allQuestions);
      setScore({ correct: 0, total: allQuestions.length });
    }
  }, [flashcard]);

  const handleAnswerChange = useCallback((questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    // Calculate score
    let correct = 0;
    questions.forEach((q) => {
      const userAnswer = (answers[q.id] || "").trim().toLowerCase();
      const correctAnswer = q.answer.trim().toLowerCase();
      if (userAnswer === correctAnswer) {
        correct++;
      }
    });

    setScore({ correct, total: questions.length });
    setShowResults(true);

    // Submit result to server
    try {
      await submitResult({
        flashcardId: id,
        exerciseType: "fill_blank",
        correctCount: correct,
        totalCount: questions.length,
      }).unwrap();
    } catch (err) {
      console.error("Failed to submit exercise result:", err);
    }
  }, [questions, answers, id, submitResult]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [questions.length, currentIndex]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Check if all questions answered
  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id]?.trim().length > 0);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-[#0B1120]">
        <span className="material-symbols-outlined text-5xl text-pink-400 animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (error || !flashcard || flashcard.cards.length < 4) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-[#0B1120] gap-4">
        <span className="material-symbols-outlined text-6xl text-red-400">error</span>
        <p className="text-slate-400">
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

  const currentQuestion = questions[currentIndex];
  const isCorrect = showResults && (answers[currentQuestion?.id] || "").trim().toLowerCase() === currentQuestion?.answer.trim().toLowerCase();

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#0B1120] text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0B1120]/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-4">
          <Link
            href={`/flashcards/detail/${id}`}
            className="flex items-center justify-center size-10 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/10"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </Link>
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Điền từ
            </span>
            <h1 className="text-lg font-bold text-white truncate max-w-[250px]">
              {flashcard.name}
            </h1>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-8 flex flex-col gap-1">
          <div className="flex justify-between text-xs font-medium text-slate-500">
            <span>{currentIndex + 1}/{questions.length}</span>
            <span>{Object.keys(answers).filter((k) => answers[parseInt(k)]?.trim()).length} đã trả lời</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/flashcards/exercise/${id}/multiple-choice`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all text-sm"
          >
            <span className="material-symbols-outlined text-lg">quiz</span>
            Trắc nghiệm
          </Link>
          <Link
            href={`/flashcards/learn/${id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-pink-400 transition-all text-sm"
          >
            <span className="material-symbols-outlined text-lg">school</span>
            Học thẻ
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
        {showResults ? (
          // Results View
          <div className="w-full max-w-2xl text-center">
            <div className="mb-8">
              <span className="material-symbols-outlined text-8xl text-pink-400 mb-4">
                {score.correct === score.total ? "emoji_events" : score.correct >= score.total / 2 ? "sentiment_satisfied" : "sentiment_dissatisfied"}
              </span>
              <h2 className="text-3xl font-bold text-white mb-2">
                {score.correct === score.total
                  ? "Xuất sắc!"
                  : score.correct >= score.total / 2
                  ? "Làm tốt lắm!"
                  : "Cần cố gắng hơn!"}
              </h2>
              <p className="text-slate-400">
                Bạn trả lời đúng <span className="text-pink-400 font-bold">{score.correct}</span>/
                <span className="font-bold">{score.total}</span> câu
              </p>
            </div>

            <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-6 mb-6">
              <div className="text-5xl font-black text-white mb-2">
                {Math.round((score.correct / score.total) * 100)}%
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${(score.correct / score.total) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setAnswers({});
                  setCurrentIndex(0);
                  setShowResults(false);
                  // Re-shuffle questions
                  if (flashcard?.cards) {
                    const cards = flashcard.cards;
                    const shuffled = [...cards].sort(() => Math.random() - 0.5);
                    const half = Math.ceil(shuffled.length / 2);

                    const vocabQuestions = shuffled.slice(0, half).map((card, idx) => ({
                      id: idx,
                      type: "fill_vocab" as const,
                      question: card.meaning || "",
                      answer: card.vocabulary || "",
                      hint: card.pronunciation || "[pronunciation]",
                    }));

                    const meaningQuestions = shuffled.slice(half).map((card, idx) => ({
                      id: idx + half,
                      type: "fill_meaning" as const,
                      question: card.vocabulary || "",
                      answer: card.meaning || "",
                      hint: card.pronunciation || "",
                    }));

                    const allQuestions = [...vocabQuestions, ...meaningQuestions].sort(() => Math.random() - 0.5);
                    setQuestions(allQuestions);
                    setScore({ correct: 0, total: allQuestions.length });
                  }
                }}
                className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl transition-all"
              >
                Làm lại
              </button>
              <Link
                href={`/flashcards/detail/${id}`}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-all"
              >
                Quay lại
              </Link>
            </div>
          </div>
        ) : (
          // Question View
          <div className="w-full max-w-4xl">
            {/* Question Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hint Column - Left */}
              <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-pink-400">lightbulb</span>
                  <span className="text-sm font-medium text-slate-400">GỢI Ý</span>
                </div>
                <p className="text-slate-300 text-sm mb-4">
                  {currentQuestion?.type === "fill_vocab"
                    ? "Điền từ vựng tiếng Nhật tương ứng với nghĩa sau:"
                    : "Điền nghĩa tiếng Việt của từ sau:"}
                </p>
                <div className="bg-[#0B1120] border border-white/10 rounded-xl p-4">
                  <p className="text-2xl font-bold text-white mb-2">
                    {currentQuestion?.question}
                  </p>
                  {currentQuestion?.hint && currentQuestion?.type === "fill_meaning" && (
                    <p className="text-sm text-pink-400">
                      {currentQuestion.hint}
                    </p>
                  )}
                </div>
              </div>

              {/* Answer Column - Right */}
              <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-green-400">edit</span>
                  <span className="text-sm font-medium text-slate-400">TRẢ LỜI</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={answers[currentQuestion?.id] || ""}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    placeholder={
                      currentQuestion?.type === "fill_vocab"
                        ? "Nhập từ vựng tiếng Nhật..."
                        : "Nhập nghĩa tiếng Việt..."
                    }
                    className="w-full bg-[#0B1120] border-2 border-white/10 rounded-xl px-4 py-4 text-xl text-white placeholder-slate-600 focus:border-pink-500 focus:outline-none transition-colors"
                    disabled={showResults}
                  />
                  {answers[currentQuestion?.id]?.trim() && (
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-green-400">
                      check_circle
                    </span>
                  )}
                </div>

                {/* Show answer for current question in results */}
                {showResults && (
                  <div className="mt-4 p-3 bg-[#0B1120] border border-white/10 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">Đáp án đúng:</p>
                    <p className="text-xl font-bold text-green-400">
                      {currentQuestion?.answer}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all ${
                  currentIndex === 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Trước
              </button>

              {/* Question Dots */}
              <div className="flex gap-1 max-w-xs flex-wrap justify-center">
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      idx === currentIndex
                        ? "bg-pink-500 text-white"
                        : answers[q.id]?.trim()
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-white/5 text-slate-500"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {currentIndex === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={!allAnswered}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                    allAnswered
                      ? "bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-500/30"
                      : "bg-white/5 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  Nộp bài
                  <span className="material-symbols-outlined">send</span>
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all"
                >
                  Tiếp
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-white/10 bg-[#0B1120]/80 backdrop-blur-md">
        <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
          <span>
            <span className="font-bold text-white">{questions.filter((q) => answers[q.id]?.trim()).length}</span>/
            <span className="font-bold">{questions.length}</span> câu đã trả lời
          </span>
        </div>
      </footer>
    </div>
  );
}
