"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";

interface PassageQuestion {
  id: number;
  questionIndex: number;
  questionText: string;
  optionsJson?: string | null;
}

interface SplitScreenViewProps {
  passageText: string;
  questions: PassageQuestion[];
  currentQuestionIndex: number;
  selectedAnswer: string;
  onAnswerSelect: (answer: string) => void;
  showResults?: boolean;
  revealedAnswers?: Map<number, string>;
  className?: string;
}

export function SplitScreenView({
  passageText,
  questions,
  currentQuestionIndex,
  selectedAnswer,
  onAnswerSelect,
  showResults = false,
  revealedAnswers,
  className = "",
}: SplitScreenViewProps) {
  const parseOptions = (json?: string | null): string[] => {
    if (!json) return [];
    try {
      const v = JSON.parse(json) as unknown;
      return Array.isArray(v) ? v.map(String) : [];
    } catch {
      return [];
    };
  };

  return (
    <div className={`flex gap-3 h-full ${className}`}>
      {/* Left Panel - Passage */}
      <div className="w-1/2 flex flex-col min-h-0 border border-white/[0.08] rounded-xl bg-[#1a1d27]">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.08] bg-[#252838]/50 rounded-t-xl shrink-0">
          <BookOpen className="h-4 w-4 text-[#6C63FF]" />
          <span className="text-xs font-medium text-[#F0F0F0]">Đoạn văn</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-sm text-[#E8E8F0] leading-relaxed whitespace-pre-wrap">
            {passageText}
          </p>
        </div>
      </div>

      {/* Right Panel - Questions */}
      <div className="w-1/2 flex flex-col min-h-0 border border-white/[0.08] rounded-xl bg-[#1a1d27]">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.08] bg-[#252838]/50 rounded-t-xl shrink-0">
          <span className="text-xs font-medium text-[#F0F0F0]">
            Câu hỏi {currentQuestionIndex + 1} / {questions.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {questions.map((q, idx) => {
            const isCurrentQuestion = idx === currentQuestionIndex;
            const options = parseOptions(q.optionsJson);
            const isCorrect = revealedAnswers?.get(q.id);
            const userAnswer = idx === currentQuestionIndex ? selectedAnswer : "";

            return (
              <div
                key={q.id}
                className={`p-3 rounded-lg border ${
                  isCurrentQuestion
                    ? "border-[#6C63FF]/50 bg-[#6C63FF]/5"
                    : "border-white/[0.08] bg-[#252838]/30"
                }`}
              >
                <p className="text-xs text-[#8B8FA8] mb-2">Câu {idx + 1}</p>
                <p className="text-sm text-[#F0F0F0] mb-3">{q.questionText}</p>

                {options.length > 0 && (
                  <div className="space-y-1.5">
                    {options.map((opt, optIdx) => {
                      const isSelected = isCurrentQuestion && userAnswer === opt;
                      const isRevealedCorrect = showResults && isCorrect === opt;
                      const isRevealedWrong = showResults && isSelected && !isCorrect;
                      const labels = ["A", "B", "C", "D", "E", "F", "G", "H"];

                      return (
                        <label
                          key={optIdx}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                            isSelected && !showResults
                              ? "bg-[#6C63FF]/20 border border-[#6C63FF]/50"
                              : isRevealedCorrect
                              ? "bg-emerald-500/20 border border-emerald-500/50"
                              : isRevealedWrong
                              ? "bg-red-500/20 border border-red-500/50"
                              : "bg-[#252838]/50 border border-white/[0.06] hover:border-white/[0.12]"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            className="accent-[#6C63FF]"
                            checked={isSelected}
                            onChange={() => isCurrentQuestion && onAnswerSelect(opt)}
                            disabled={showResults}
                          />
                          <span className="text-[#8B8FA8] font-medium w-5">{labels[optIdx]}.</span>
                          <span
                            className={
                              isRevealedCorrect
                                ? "text-emerald-400"
                                : isRevealedWrong
                                ? "text-red-400"
                                : "text-[#E8E8F0]"
                            }
                          >
                            {opt}
                          </span>
                          {isRevealedCorrect && (
                            <span className="ml-auto text-[10px] text-emerald-400">✓</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
