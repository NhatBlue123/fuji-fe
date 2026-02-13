"use client";

import { useState, useCallback, useMemo } from "react";
import type { TaskDataEnvelope, FillBlankItem } from "./types";
import { TaskHeader, TaskActions, EmptyTask } from "./MultipleChoiceTask";

// ─── Helpers ───────────────────────────────────────────

/** Extract answer from sentence: 「まどを（あけて）ください」→ "あけて" */
function extractBlank(sentence: string): {
  before: string;
  after: string;
  answer: string;
} {
  const match = sentence.match(/（(.+?)）/);
  if (!match) return { before: sentence, after: "", answer: "" };
  const idx = sentence.indexOf(match[0]);
  return {
    before: sentence.slice(0, idx),
    after: sentence.slice(idx + match[0].length),
    answer: match[1],
  };
}

// ─── State ─────────────────────────────────────────────

function useFillBlankState(items: FillBlankItem[]) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const updateAnswer = useCallback((id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }, []);

  const submit = useCallback(() => setSubmitted(true), []);
  const reset = useCallback(() => {
    setAnswers({});
    setSubmitted(false);
  }, []);

  const score = useMemo(() => {
    if (!submitted) return 0;
    return items.filter((item) => {
      const userAnswer = (answers[item.id] ?? "").trim().toLowerCase();
      return userAnswer === item.answer.trim().toLowerCase();
    }).length;
  }, [submitted, answers, items]);

  const allAnswered =
    items.length > 0 &&
    items.every((item) => (answers[item.id] ?? "").trim().length > 0);

  return {
    answers,
    submitted,
    updateAnswer,
    submit,
    reset,
    score,
    allAnswered,
  };
}

// ─── Component ─────────────────────────────────────────

export default function FillBlankTask({ data }: { data: TaskDataEnvelope }) {
  const items = data.items as FillBlankItem[];
  const {
    answers,
    submitted,
    updateAnswer,
    submit,
    reset,
    score,
    allAnswered,
  } = useFillBlankState(items);

  if (items.length === 0) {
    return <EmptyTask message="Chưa có bài tập điền từ nào." />;
  }

  return (
    <div className="space-y-6">
      <TaskHeader
        icon="edit_note"
        label="Điền vào chỗ trống"
        instructions={data.instructions}
      />

      <div className="space-y-5">
        {items.map((item, idx) => {
          const { before, after } = extractBlank(item.sentence);
          const userAnswer = (answers[item.id] ?? "").trim();
          const isCorrect =
            submitted &&
            userAnswer.toLowerCase() === item.answer.trim().toLowerCase();
          const isWrong = submitted && !isCorrect && userAnswer.length > 0;

          return (
            <div
              key={item.id}
              className={`bg-card rounded-2xl border p-6 transition-colors ${
                submitted
                  ? isCorrect
                    ? "border-green-500/40 bg-green-500/5"
                    : isWrong
                      ? "border-red-500/40 bg-red-500/5"
                      : "border-amber-500/40 bg-amber-500/5"
                  : "border-border"
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 size-8 rounded-lg bg-secondary/10 text-secondary text-sm font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <div className="flex flex-wrap items-center gap-1 pt-1 text-foreground leading-relaxed">
                  <span>{before}</span>
                  <input
                    type="text"
                    value={answers[item.id] ?? ""}
                    onChange={(e) => updateAnswer(item.id, e.target.value)}
                    disabled={submitted}
                    placeholder="______"
                    className={`inline-block w-32 sm:w-40 px-3 py-1.5 rounded-lg border text-center font-bold text-sm transition-colors bg-transparent focus:outline-none focus:ring-2 focus:ring-secondary/40 ${
                      submitted
                        ? isCorrect
                          ? "border-green-500 text-green-400"
                          : "border-red-500 text-red-400"
                        : "border-border text-foreground"
                    }`}
                  />
                  <span>{after}</span>
                </div>
              </div>

              {/* Hints */}
              {!submitted && item.hints.length > 0 && (
                <div className="ml-11 flex flex-wrap gap-2">
                  {item.hints.map((hint, i) => (
                    <span
                      key={i}
                      className="text-xs bg-primary/5 text-primary border border-primary/20 px-2.5 py-1 rounded-full"
                    >
                      💡 {hint}
                    </span>
                  ))}
                </div>
              )}

              {/* Correct answer reveal */}
              {submitted && !isCorrect && (
                <div className="mt-3 ml-11 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                  <p className="text-sm text-green-400 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base filled">
                      check_circle
                    </span>
                    Đáp án đúng: <strong>{item.answer}</strong>
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <TaskActions
        submitted={submitted}
        canSubmit={allAnswered}
        onSubmit={submit}
        onReset={reset}
        score={score}
        total={items.length}
      />
    </div>
  );
}
