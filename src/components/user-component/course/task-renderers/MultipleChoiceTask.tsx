"use client";

import { useState, useCallback, useMemo } from "react";
import type { TaskDataEnvelope, MultipleChoiceItem } from "./types";

// ─── State ─────────────────────────────────────────────

interface MultipleChoiceState {
  selected: Record<string, string>;
  submitted: boolean;
}

function useMultipleChoiceState(items: MultipleChoiceItem[]) {
  const [state, setState] = useState<MultipleChoiceState>({
    selected: {},
    submitted: false,
  });

  const select = useCallback((questionId: string, optionKey: string) => {
    setState((prev) => {
      if (prev.submitted) return prev;
      return {
        ...prev,
        selected: { ...prev.selected, [questionId]: optionKey },
      };
    });
  }, []);

  const submit = useCallback(() => {
    setState((prev) => ({ ...prev, submitted: true }));
  }, []);

  const reset = useCallback(() => {
    setState({ selected: {}, submitted: false });
  }, []);

  // Derived state
  const score = useMemo(() => {
    if (!state.submitted) return 0;
    return items.filter((q) => state.selected[q.id] === q.answer).length;
  }, [state.submitted, state.selected, items]);

  const allAnswered =
    items.length > 0 && items.every((q) => state.selected[q.id]);

  return { ...state, select, submit, reset, score, allAnswered };
}

// ─── Component ─────────────────────────────────────────

export default function MultipleChoiceTask({
  data,
}: {
  data: TaskDataEnvelope;
}) {
  const items = data.items as MultipleChoiceItem[];
  const { selected, submitted, select, submit, reset, score, allAnswered } =
    useMultipleChoiceState(items);

  if (items.length === 0) {
    return <EmptyTask message="Chưa có câu hỏi trắc nghiệm nào." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <TaskHeader
        icon="checklist"
        label="Trắc nghiệm"
        instructions={data.instructions}
      />

      {/* Questions */}
      <div className="space-y-6">
        {items.map((q, idx) => {
          const userAnswer = selected[q.id];
          const isCorrect = submitted && userAnswer === q.answer;
          const isWrong =
            submitted && userAnswer !== q.answer && userAnswer !== undefined;

          return (
            <div
              key={q.id}
              className={`bg-card rounded-2xl border p-6 transition-colors ${
                submitted
                  ? isCorrect
                    ? "border-green-500/40 bg-green-500/5"
                    : isWrong
                      ? "border-red-500/40 bg-red-500/5"
                      : "border-border"
                  : "border-border"
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 size-8 rounded-lg bg-secondary/10 text-secondary text-sm font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <p className="text-foreground font-medium leading-relaxed pt-1">
                  {q.question}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-11">
                {q.options.map((opt) => {
                  const isSelected = userAnswer === opt.key;
                  const isAnswer = q.answer === opt.key;

                  let optionClass =
                    "border-border bg-muted/30 hover:bg-muted/60 hover:border-secondary/40 cursor-pointer";
                  if (isSelected && !submitted) {
                    optionClass =
                      "border-secondary bg-secondary/10 ring-1 ring-secondary/30 cursor-pointer";
                  }
                  if (submitted) {
                    if (isAnswer) {
                      optionClass =
                        "border-green-500 bg-green-500/10 cursor-default";
                    } else if (isSelected && !isAnswer) {
                      optionClass =
                        "border-red-500 bg-red-500/10 cursor-default";
                    } else {
                      optionClass =
                        "border-border bg-muted/20 opacity-50 cursor-default";
                    }
                  }

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={submitted}
                      onClick={() => select(q.id, opt.key)}
                      className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${optionClass}`}
                    >
                      <span
                        className={`flex-shrink-0 size-7 rounded-full border-2 text-xs font-bold flex items-center justify-center transition-colors ${
                          submitted && isAnswer
                            ? "bg-green-500 border-green-500 text-white"
                            : submitted && isSelected
                              ? "bg-red-500 border-red-500 text-white"
                              : isSelected
                                ? "bg-secondary border-secondary text-white"
                                : "border-border text-muted-foreground"
                        }`}
                      >
                        {opt.key}
                      </span>
                      <span className="text-sm text-foreground">
                        {opt.text}
                      </span>
                      {submitted && isAnswer && (
                        <span className="material-symbols-outlined text-green-500 text-lg ml-auto filled">
                          check_circle
                        </span>
                      )}
                      {submitted && isSelected && !isAnswer && (
                        <span className="material-symbols-outlined text-red-500 text-lg ml-auto filled">
                          cancel
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {submitted && q.explanation && (
                <div className="mt-4 ml-11 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm text-primary flex items-start gap-2">
                    <span className="material-symbols-outlined text-base mt-0.5 filled">
                      lightbulb
                    </span>
                    {q.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
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

// ─── Shared sub-components ─────────────────────────────

export function TaskHeader({
  icon,
  label,
  instructions,
}: {
  icon: string;
  label: string;
  instructions: string;
}) {
  return (
    <div className="space-y-4">
      {instructions && (
        <div className="p-4 bg-blue-500/5 border-l-4 border-blue-500 rounded-r-xl">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-400 text-lg flex-shrink-0 mt-0.5">
              info
            </span>
            <div>
              <h4 className="font-semibold text-blue-300 mb-1 text-sm">
                Hướng dẫn
              </h4>
              <p className="text-sm text-blue-200/80 leading-relaxed">
                {instructions}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function TaskActions({
  submitted,
  canSubmit,
  onSubmit,
  onReset,
  score,
  total,
}: {
  submitted: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
  onReset: () => void;
  score: number;
  total: number;
}) {
  if (submitted) {
    const percent = total > 0 ? Math.round((score / total) * 100) : 0;
    const isPass = percent >= 60;

    const bgGradient =
      percent >= 80
        ? "from-green-500 to-emerald-600"
        : percent >= 60
          ? "from-blue-500 to-cyan-600"
          : percent >= 40
            ? "from-yellow-500 to-orange-600"
            : "from-red-500 to-pink-600";

    const emoji =
      percent >= 80 ? "🎉" : percent >= 60 ? "👍" : percent >= 40 ? "💪" : "📚";
    const message =
      percent >= 80
        ? "Xuất sắc!"
        : percent >= 60
          ? "Tốt lắm!"
          : percent >= 40
            ? "Cố gắng thêm!"
            : "Hãy thử lại!";

    return (
      <div
        className={`p-6 md:p-8 rounded-2xl bg-gradient-to-br ${bgGradient} text-white text-center animate-in fade-in slide-in-from-top-4 duration-500`}
      >
        <div className="flex flex-col items-center gap-3 md:gap-4">
          <div className="text-4xl md:text-5xl">{emoji}</div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-1">{percent}%</h2>
            <p className="text-base md:text-lg font-medium opacity-90">
              {message}
            </p>
            <p className="text-sm opacity-75 mt-1">
              Đúng {score}/{total} câu
            </p>
          </div>
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onReset}
              className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Làm lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <button
        type="button"
        disabled={!canSubmit}
        onClick={onSubmit}
        className="px-6 py-3 bg-secondary hover:bg-secondary/80 disabled:bg-muted disabled:text-muted-foreground text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-secondary/20 disabled:shadow-none flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-lg">send</span>
        Nộp bài
      </button>
    </div>
  );
}

export function EmptyTask({ message }: { message: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-8 text-center">
      <span className="material-symbols-outlined text-4xl text-muted-foreground/40 mb-2 block">
        assignment
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
