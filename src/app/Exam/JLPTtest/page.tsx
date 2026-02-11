"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ExamHeader from "./ExamHeader";
import ExamSidebar from "./ExamSidebar";
import ExamContent from "./ExamContent";
import { useCountdown } from "@/hooks/useCountdown";

export default function JLPTtestPage() {
  const router = useRouter();

  const [currentQuestion, setCurrentQuestion] = useState(24);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // ===== AUTO SUBMIT =====
  const handleSubmit = useCallback(() => {
    console.log("⏱ Hết giờ – auto submit");
    router.push("/jlpt/result");
  }, [answers, router]);

  // ===== TIMER =====
  const { timeLeft } = useCountdown({
    duration: 6 * 60,
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

  return (
    <div
      className="h-screen flex flex-col overflow-hidden font-sans text-white"
      style={{ backgroundColor: "#0B1120" }}
    >
      <ExamHeader timeLeft={timeLeft} formatTime={formatTime} />

      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto">
            <ExamContent
              currentQ={currentQuestion}
              selectedAnswer={answers[currentQuestion]}
              onSelectOption={(opt) =>
                setAnswers((prev) => ({ ...prev, [currentQuestion]: opt }))
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
              onClick={() => setCurrentQuestion((q) => Math.max(1, q - 1))}
              disabled={currentQuestion === 1}
              className="px-6 py-2.5 rounded-lg disabled:opacity-50 hover:bg-slate-700"
            >
              ← Câu trước
            </button>

            <button
              onClick={() => setCurrentQuestion((q) => Math.min(77, q + 1))}
              className="px-6 py-2.5 rounded-lg font-bold bg-white text-slate-900"
            >
              Câu tiếp theo →
            </button>
          </div>
        </div>

        <ExamSidebar
          currentQ={currentQuestion}
          answers={answers}
          onSelect={setCurrentQuestion}
        />
      </main>
    </div>
  );
}
