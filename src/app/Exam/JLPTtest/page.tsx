"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ExamHeader from "./ExamHeader";
import ExamSidebar from "./ExamSidebar";
import ExamContent from "./ExamContent";
import { useCountdown } from "@/hooks/useCountdown";
import { useGetTestByIdQuery, useSubmitTestMutation } from "@/store/services/jlptApi";
import type { UserAnswer } from "@/types/jlpt";

export default function JLPTtestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = searchParams.get("testId");

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch test data
  const { data: testData, isLoading, error } = useGetTestByIdQuery(
    Number(testId),
    { skip: !testId }
  );

  const [submitTest] = useSubmitTestMutation();

  const questions = testData?.questions || [];
  const totalQuestions = questions.length;
  const duration = testData?.duration || 140; // minutes

  // ===== AUTO SUBMIT =====
  const handleSubmit = useCallback(async () => {
    if (!testId) return;

    console.log("⏱ Submitting test...");
    setIsSubmitting(true);

    try {
      // Convert answers to API format
      const userAnswers: UserAnswer[] = Object.entries(answers).map(
        ([questionId, selected]) => ({
          questionId: Number(questionId),
          selected,
        })
      );

      const result = await submitTest({
        testId: Number(testId),
        answers: userAnswers,
      }).unwrap();

      console.log("✅ Test submitted successfully:", result);

      // Navigate to results page with attempt ID
      router.push(`/jlpt/result?attemptId=${result.id}`);
    } catch (error) {
      console.error("❌ Failed to submit test:", error);
      alert("Không thể nộp bài. Vui lòng thử lại!");
      setIsSubmitting(false);
    }
  }, [testId, answers, submitTest, router]);

  // ===== TIMER =====
  const { timeLeft } = useCountdown({
    duration: duration * 60, // convert to seconds
    onFiveMinutesLeft: () => {
      alert("⚠️ Còn 5 phút cuối!");
    },
    onTimeUp: handleSubmit,
  });

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0B1120]">
        <div className="text-center text-white">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-400 mb-4"></div>
          <p className="text-lg">Đang tải đề thi...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !testData) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0B1120]">
        <div className="text-center text-white">
          <span className="material-symbols-outlined text-6xl text-red-400 mb-4">
            error
          </span>
          <p className="text-lg font-semibold">Không thể tải đề thi</p>
          <p className="text-sm text-slate-400 mt-2">
            Vui lòng kiểm tra lại hoặc chọn đề thi khác
          </p>
          <button
            onClick={() => router.push("/JLPT_Practice")}
            className="mt-6 px-6 py-3 bg-pink-400 rounded-lg font-semibold hover:bg-pink-500 transition"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  // Submitting state
  if (isSubmitting) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0B1120]">
        <div className="text-center text-white">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-400 mb-4"></div>
          <p className="text-lg">Đang nộp bài...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden font-sans text-white"
      style={{ backgroundColor: "#0B1120" }}
    >
      <ExamHeader 
        timeLeft={timeLeft} 
        formatTime={formatTime}
        testTitle={testData.title}
      />

      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto">
            <ExamContent
              currentQ={currentQuestion}
              question={questions[currentQuestion]}
              selectedAnswer={answers[questions[currentQuestion]?.id]}
              onSelectOption={(opt) =>
                setAnswers((prev) => ({
                  ...prev,
                  [questions[currentQuestion].id]: opt,
                }))
              }
            />
          </div>

          {/* FOOTER */}
          <div
            className="h-20 shrink-0 px-6 md:px-10 flex items-center justify-between z-20"
            style={{
              backgroundColor: "#161e31",
              borderTop: "1px solid #334155",
            }}
          >
            <button
              onClick={() => setCurrentQuestion((q) => Math.max(0, q - 1))}
              disabled={currentQuestion === 0}
              className="px-6 py-2.5 rounded-lg disabled:opacity-50 hover:bg-slate-700"
            >
              ← Câu trước
            </button>

            {currentQuestion === totalQuestions - 1 ? (
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-lg font-bold bg-green-500 text-white hover:bg-green-600"
              >
                Nộp bài
              </button>
            ) : (
              <button
                onClick={() =>
                  setCurrentQuestion((q) => Math.min(totalQuestions - 1, q + 1))
                }
                className="px-6 py-2.5 rounded-lg font-bold bg-white text-slate-900"
              >
                Câu tiếp theo →
              </button>
            )}
          </div>
        </div>

        <ExamSidebar
          currentQ={currentQuestion}
          totalQuestions={totalQuestions}
          answers={answers}
          questions={questions}
          onSelect={setCurrentQuestion}
        />
      </main>
    </div>
  );
}
