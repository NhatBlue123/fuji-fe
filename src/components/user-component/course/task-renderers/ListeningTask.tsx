"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import type { TaskDataEnvelope, ListeningItem } from "./types";
import { TaskHeader, TaskActions, EmptyTask } from "./MultipleChoiceTask";

// ─── State ─────────────────────────────────────────────

function useListeningState(items: ListeningItem[]) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const select = useCallback((questionId: string, key: string) => {
    setSelected((prev) => ({ ...prev, [questionId]: key }));
  }, []);

  const submit = useCallback(() => setSubmitted(true), []);
  const reset = useCallback(() => {
    setSelected({});
    setSubmitted(false);
  }, []);

  const score = useMemo(() => {
    if (!submitted) return 0;
    return items.filter((item) => selected[item.id] === item.answer).length;
  }, [submitted, selected, items]);

  const allAnswered =
    items.length > 0 && items.every((item) => item.id in selected);

  return { selected, submitted, select, submit, reset, score, allAnswered };
}

// ─── Audio Player ──────────────────────────────────────

function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }, []);

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          className="flex-shrink-0 size-14 rounded-full bg-secondary/10 text-secondary flex items-center justify-center hover:bg-secondary/20 transition-colors"
        >
          <span className="material-symbols-outlined text-2xl filled">
            {playing ? "pause" : "play_arrow"}
          </span>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground mb-2">
            Nghe đoạn audio và trả lời câu hỏi
          </p>
          <audio
            ref={audioRef}
            src={src}
            onEnded={() => setPlaying(false)}
            className="w-full"
            controls
          />
        </div>
      </div>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────

export default function ListeningTask({
  data,
  onTaskSubmitted,
}: {
  data: TaskDataEnvelope;
  onTaskSubmitted?: () => void;
}) {
  const items = data.items as ListeningItem[];
  const { selected, submitted, select, submit, reset, score, allAnswered } =
    useListeningState(items);

  if (items.length === 0) {
    return <EmptyTask message="Chưa có bài tập nghe nào." />;
  }

  return (
    <div className="space-y-6">
      <TaskHeader
        icon="headphones"
        label="Nghe hiểu"
        instructions={data.instructions}
      />

      {/* Audio Player */}
      {data.audioUrl && <AudioPlayer src={data.audioUrl} />}

      {/* Questions */}
      <div className="space-y-5">
        {items.map((item, idx) => {
          const userAnswer = selected[item.id];
          const isCorrect = submitted && userAnswer === item.answer;
          const isWrong = submitted && userAnswer !== item.answer;

          return (
            <div
              key={item.id}
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
                <p className="text-foreground font-medium pt-1">
                  {item.question}
                </p>
              </div>

              <div className="grid gap-2.5 ml-11">
                {item.options.map((opt) => {
                  const isSelected = userAnswer === opt.key;
                  const isTheAnswer = opt.key === item.answer;

                  let optionStyle =
                    "border-border bg-background hover:bg-accent/5 hover:border-accent/30 cursor-pointer";

                  if (submitted) {
                    if (isTheAnswer) {
                      optionStyle =
                        "border-green-500/60 bg-green-500/10 text-green-400";
                    } else if (isSelected) {
                      optionStyle =
                        "border-red-500/60 bg-red-500/10 text-red-400";
                    } else {
                      optionStyle = "border-border/40 bg-card/50 opacity-60";
                    }
                  } else if (isSelected) {
                    optionStyle =
                      "border-secondary bg-secondary/10 text-secondary ring-1 ring-secondary/30";
                  }

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={submitted}
                      onClick={() => select(item.id, opt.key)}
                      className={`group flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${optionStyle}`}
                    >
                      <span className="flex-shrink-0 size-7 rounded-lg border text-xs font-bold flex items-center justify-center">
                        {opt.key}
                      </span>
                      <span className="text-sm">{opt.text}</span>
                      {submitted && isTheAnswer && (
                        <span className="ml-auto material-symbols-outlined text-green-400 text-base filled">
                          check_circle
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <TaskActions
        submitted={submitted}
        canSubmit={allAnswered}
        onSubmit={submit}
        onReset={reset}
        onSubmitted={onTaskSubmitted}
        score={score}
        total={items.length}
      />
    </div>
  );
}
