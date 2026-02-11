"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGetFlashCardByIdQuery, useSubmitExerciseResultMutation } from "@/store/services/flashcardApi";

interface MultipleChoiceQuestion {
  id: number;
  type: "vocab_to_meaning" | "meaning_to_vocab"; // vocab_to_meaning: từ → nghĩa, meaning_to_vocab: nghĩa → từ
  question: string; // The vocabulary or meaning to show
  answer: string; // Correct answer
  options: string[]; // All options including correct answer
  hint: string; // Pronunciation/romanization hint
}

export default function MultipleChoiceExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: flashcard, isLoading, error } = useGetFlashCardByIdQuery(id);
  const [submitResult] = useSubmitExerciseResultMutation();

  const [questions, setQuestions] = useState<MultipleChoiceQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isAnswered, setIsAnswered] = useState(false);

  // Initialize questions from flashcards
  useEffect(() => {
    if (flashcard?.cards && flashcard.cards.length >= 4) {
      const cards = flashcard.cards;
      // Shuffle cards
      const shuffled = [...cards].sort(() => Math.random() - 0.5);
      // Take up to 10 questions
      const selectedCards = shuffled.slice(0, Math.min(10, shuffled.length));

      const generatedQuestions = selectedCards.map((card, idx) => {
        const isVocabToMeaning = Math.random() > 0.5;

        if (isVocabToMeaning) {
          // Question: vocabulary → choose meaning
          const wrongOptions = cards
            .filter((c) => c.meaning !== card.meaning)
            .map((c) => c.meaning)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

          const options = [card.meaning, ...wrongOptions].sort(() => Math.random() - 0.5);

          return {
            id: idx,
            type: "vocab_to_meaning" as const,
            question: card.vocabulary || "",
            answer: card.meaning || "",
            options,
            hint: card.pronunciation || "",
          };
        } else {
          // Question: meaning → choose vocabulary
          const wrongOptions = cards
            .filter((c) => c.vocabulary !== card.vocabulary)
            .map((c) => c.vocabulary)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

          const options = [card.vocabulary, ...wrongOptions].sort(() => Math.random() - 0.5);

          return {
            id: idx,
            type: "meaning_to_vocab" as const,
            question: card.meaning || "",
            answer: card.vocabulary || "",
            options,
            hint: card.pronunciation || "",
          };
        }
      });

      setQuestions(generatedQuestions);
      setScore({ correct: 0, total: generatedQuestions.length });
    }
  }, [flashcard]);

  const handleAnswerSelect = useCallback((option: string) => {
    if (isAnswered) return;

    setSelectedAnswer(questions[currentIndex].options.indexOf(option));
    setIsAnswered(true);

    const isCorrect = option === questions[currentIndex].answer;
    if (isCorrect) {
      setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
    }
  }, [currentIndex, questions, isAnswered]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      // Show final results
      setShowResults(true);

      // Submit result to server
      submitResult({
        flashcardId: id,
        exerciseType: "multiple_choice",
        correctCount: score.correct,
        totalCount: questions.length,
      }).catch(console.error);
    }
  }, [currentIndex, questions, score.correct, id, submitResult]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setShowResults(false);
    setScore({ correct: 0, total: questions.length });
    setSelectedAnswer(null);
    setIsAnswered(false);

    // Re-generate questions
    if (flashcard?.cards && flashcard.cards.length >= 4) {
      const cards = flashcard.cards;
      const shuffled = [...cards].sort(() => Math.random() - 0.5);
      const selectedCards = shuffled.slice(0, Math.min(10, shuffled.length));

      const generatedQuestions = selectedCards.map((card, idx) => {
        const isVocabToMeaning = Math.random() > 0.5;

        if (isVocabToMeaning) {
          const wrongOptions = cards
            .filter((c) => c.meaning !== card.meaning)
            .map((c) => c.meaning)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

          const options = [card.meaning, ...wrongOptions].sort(() => Math.random() - 0.5);

          return {
            id: idx,
            type: "vocab_to_meaning" as const,
            question: card.vocabulary || "",
            answer: card.meaning || "",
            options,
            hint: card.pronunciation || "",
          };
        } else {
          const wrongOptions = cards
            .filter((c) => c.vocabulary !== card.vocabulary)
            .map((c) => c.vocabulary)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

          const options = [card.vocabulary, ...wrongOptions].sort(() => Math.random() - 0.5);

          return {
            id: idx,
            type: "meaning_to_vocab" as const,
            question: card.meaning || "",
            answer: card.vocabulary || "",
            options,
            hint: card.pronunciation || "",
          };
        }
      });

      setQuestions(generatedQuestions);
    }
  }, [flashcard, questions.length]);

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
  const correctAnswerIndex = currentQuestion?.options.indexOf(currentQuestion?.answer || "");
  const isCorrect = isAnswered && selectedAnswer === correctAnswerIndex;

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
              Trắc nghiệm
            </span>
            <h1 className="text-lg font-bold text-white truncate max-w-[250px]">
              {flashcard.name}
            </h1>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-8 flex flex-col gap-1">
          <div className="flex justify-between text-xs font-medium text-slate-500">
            <span>{currentIndex + 1}/{questions.length}</span>
            <span>{score.correct} đúng</span>
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
            href={`/flashcards/exercise/${id}/fill-blank`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all text-sm"
          >
            <span className="material-symbols-outlined text-lg">edit_note</span>
            Điền từ
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
          // Final Results View
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
                onClick={handleRestart}
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
          <div className="w-full max-w-3xl">
            {/* Question */}
            <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-8 mb-6 text-center">
              <p className="text-sm text-slate-500 mb-2">
                {currentQuestion?.type === "vocab_to_meaning" ? "Chọn nghĩa đúng:" : "Chọn từ vựng đúng:"}
              </p>
              <p className="text-4xl font-black text-white mb-2">
                {currentQuestion?.question}
              </p>
              {currentQuestion?.type === "vocab_to_meaning" && currentQuestion?.hint && (
                <p className="text-lg text-pink-400">{currentQuestion.hint}</p>
              )}
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {currentQuestion?.options.map((option, idx) => {
                let buttonClass = "bg-[#1E293B] border-white/10 hover:bg-[#2A3A4F] ";

                if (isAnswered) {
                  if (idx === correctAnswerIndex) {
                    buttonClass = "bg-green-500/20 border-green-500 text-green-400";
                  } else if (idx === selectedAnswer) {
                    buttonClass = "bg-red-500/20 border-red-500 text-red-400";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={isAnswered}
                    className={`p-4 rounded-xl border-2 font-bold text-lg transition-all ${buttonClass} ${
                      !isAnswered ? "hover:scale-[1.02]" : ""
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span>{option}</span>
                      {isAnswered && idx === correctAnswerIndex && (
                        <span className="material-symbols-outlined">check_circle</span>
                      )}
                      {isAnswered && idx === selectedAnswer && idx !== correctAnswerIndex && (
                        <span className="material-symbols-outlined">cancel</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {isAnswered && (
              <div className={`p-4 rounded-xl text-center mb-6 ${
                isCorrect
                  ? "bg-green-500/10 border border-green-500/30"
                  : "bg-red-500/10 border border-red-500/30"
              }`}>
                <p className={`font-bold ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                  {isCorrect ? "Chính xác! 🎉" : `Sai rồi! Đáp án đúng: ${currentQuestion?.answer}`}
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4">
              {/* Question Dots */}
              <div className="flex gap-1 max-w-xs flex-wrap justify-center">
                {questions.map((q, idx) => {
                  let dotClass = "bg-white/20 ";
                  if (idx < currentIndex) {
                    // Previous questions
                    dotClass = "bg-green-500/50 ";
                  } else if (idx === currentIndex) {
                    dotClass = "bg-pink-500 ";
                  }
                  return (
                    <div
                      key={q.id}
                      className={`w-3 h-3 rounded-full ${dotClass}`}
                      title={`Câu ${idx + 1}`}
                    />
                  );
                })}
              </div>

              <button
                onClick={handleNext}
                disabled={!isAnswered}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  isAnswered
                    ? "bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-500/30"
                    : "bg-white/5 text-slate-500 cursor-not-allowed"
                }`}
              >
                {currentIndex === questions.length - 1 ? "Xem kết quả" : "Câu tiếp theo"}
                <span className="material-symbols-outlined">
                  {currentIndex === questions.length - 1 ? "result" : "arrow_forward"}
                </span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-white/10 bg-[#0B1120]/80 backdrop-blur-md">
        <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
          <span>
            <span className="font-bold text-white">{score.correct}</span>/<span className="font-bold">{questions.length}</span> câu đúng
          </span>
        </div>
      </footer>
    </div>
  );
}
