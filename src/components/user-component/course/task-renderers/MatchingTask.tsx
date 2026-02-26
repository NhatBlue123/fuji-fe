"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { TaskDataEnvelope, MatchingItem } from "./types";
import { TaskHeader, TaskActions, EmptyTask } from "./MultipleChoiceTask";

// ─── State ─────────────────────────────────────────────

function useMatchingState(items: MatchingItem[]) {
  const [pairs, setPairs] = useState<Record<number, number>>({});
  const [activeLeft, setActiveLeft] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const shuffledRight = useMemo(() => {
    const indices = items.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const selectLeft = useCallback(
    (leftIdx: number) => {
      if (submitted) return;
      if (leftIdx in pairs) {
        setPairs((prev) => {
          const next = { ...prev };
          delete next[leftIdx];
          return next;
        });
        setActiveLeft(null);
        return;
      }
      setActiveLeft((prev) => (prev === leftIdx ? null : leftIdx));
    },
    [submitted, pairs],
  );

  const selectRight = useCallback(
    (rightIdx: number) => {
      if (submitted || activeLeft === null) return;
      setPairs((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          if (next[Number(key)] === rightIdx) delete next[Number(key)];
        }
        next[activeLeft] = rightIdx;
        return next;
      });
      setActiveLeft(null);
    },
    [submitted, activeLeft],
  );

  const removePair = useCallback(
    (leftIdx: number) => {
      if (submitted) return;
      setPairs((prev) => {
        const next = { ...prev };
        delete next[leftIdx];
        return next;
      });
    },
    [submitted],
  );

  const submit = useCallback(() => setSubmitted(true), []);
  const reset = useCallback(() => {
    setPairs({});
    setActiveLeft(null);
    setSubmitted(false);
  }, []);

  const score = useMemo(() => {
    if (!submitted) return 0;
    return items.filter((_, i) => pairs[i] === i).length;
  }, [submitted, pairs, items]);

  const allMatched = items.length > 0 && items.every((_, i) => i in pairs);
  const usedRight = useMemo(() => new Set(Object.values(pairs)), [pairs]);

  return {
    pairs,
    activeLeft,
    shuffledRight,
    submitted,
    selectLeft,
    selectRight,
    removePair,
    submit,
    reset,
    score,
    allMatched,
    usedRight,
  };
}

// ─── SVG Connection Lines ──────────────────────────────

interface ConnectionLine {
  leftIdx: number;
  rightIdx: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isCorrect: boolean;
}

function ConnectionSVG({
  lines,
  submitted,
}: {
  lines: ConnectionLine[];
  submitted: boolean;
}) {
  if (lines.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      style={{ overflow: "visible" }}
    >
      {lines.map((line) => {
        const cx1 = line.x1 + (line.x2 - line.x1) * 0.35;
        const cx2 = line.x1 + (line.x2 - line.x1) * 0.65;
        const path = `M ${line.x1} ${line.y1} C ${cx1} ${line.y1}, ${cx2} ${line.y2}, ${line.x2} ${line.y2}`;

        const strokeColor = submitted
          ? line.isCorrect
            ? "rgb(34,197,94)"
            : "rgb(239,68,68)"
          : "rgb(251,146,60)";

        return (
          <path
            key={`${line.leftIdx}-${line.rightIdx}`}
            d={path}
            stroke={strokeColor}
            strokeWidth={submitted ? 3 : 2.5}
            fill="none"
            strokeDasharray={submitted && !line.isCorrect ? "6,4" : "0"}
            strokeLinecap="round"
            className="transition-all duration-300"
            style={{
              filter: submitted
                ? line.isCorrect
                  ? "drop-shadow(0 0 4px rgba(34,197,94,0.4))"
                  : "drop-shadow(0 0 4px rgba(239,68,68,0.4))"
                : "drop-shadow(0 0 3px rgba(251,146,60,0.3))",
            }}
          />
        );
      })}
    </svg>
  );
}

// ─── Component ─────────────────────────────────────────

export default function MatchingTask({ data }: { data: TaskDataEnvelope }) {
  const items = data.items as MatchingItem[];
  const {
    pairs,
    activeLeft,
    shuffledRight,
    submitted,
    selectLeft,
    selectRight,
    removePair,
    submit,
    reset,
    score,
    allMatched,
    usedRight,
  } = useMatchingState(items);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const rightRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [lines, setLines] = useState<ConnectionLine[]>([]);

  // Recalculate SVG lines when pairs change
  useEffect(() => {
    const updateLines = () => {
      if (!containerRef.current) return;
      const cr = containerRef.current.getBoundingClientRect();
      const newLines: ConnectionLine[] = [];

      for (const [leftKey, rightIdx] of Object.entries(pairs)) {
        const leftIdx = Number(leftKey);
        const leftEl = leftRefs.current[leftIdx];
        const rightEl = rightRefs.current[rightIdx];
        if (!leftEl || !rightEl) continue;

        const lr = leftEl.getBoundingClientRect();
        const rr = rightEl.getBoundingClientRect();

        newLines.push({
          leftIdx,
          rightIdx,
          x1: lr.right - cr.left,
          y1: lr.top + lr.height / 2 - cr.top,
          x2: rr.left - cr.left,
          y2: rr.top + rr.height / 2 - cr.top,
          isCorrect: leftIdx === rightIdx,
        });
      }

      setLines(newLines);
    };

    const timer = setTimeout(updateLines, 50);
    window.addEventListener("resize", updateLines);
    window.addEventListener("scroll", updateLines, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateLines);
      window.removeEventListener("scroll", updateLines, true);
    };
  }, [pairs]);

  if (items.length === 0) {
    return <EmptyTask message="Chưa có bài tập nối nào." />;
  }

  return (
    <div className="space-y-6">
      <TaskHeader
        icon="link"
        label="Nối cặp"
        instructions={
          data.instructions ||
          "Chọn một mục bên trái, sau đó chọn mục tương ứng bên phải để nối cặp."
        }
      />

      {/* Matching area with SVG overlay */}
      <div ref={containerRef} className="relative min-h-[200px]">
        <ConnectionSVG lines={lines} submitted={submitted} />

        <div className="grid grid-cols-2 gap-4 md:gap-6 lg:gap-8 relative z-20">
          {/* Left Column */}
          <div className="space-y-2.5 md:space-y-3">
            <p className="text-xs md:text-sm font-semibold text-center mb-3 text-secondary uppercase tracking-wider">
              Câu hỏi
            </p>
            {items.map((item, i) => {
              const isPaired = i in pairs;
              const isActive = activeLeft === i;

              let style =
                "border-border bg-card hover:bg-accent/5 cursor-pointer";
              if (submitted && isPaired) {
                style =
                  pairs[i] === i
                    ? "border-green-500 bg-green-500/10"
                    : "border-red-500 bg-red-500/10";
              } else if (isActive) {
                style =
                  "border-orange-400 bg-orange-500/10 ring-2 ring-orange-300/40 shadow-md";
              } else if (isPaired) {
                style = "border-secondary bg-secondary/5";
              }

              return (
                <div
                  key={`left-${i}`}
                  ref={(el) => {
                    leftRefs.current[i] = el;
                  }}
                  onClick={() =>
                    isPaired && !submitted ? removePair(i) : selectLeft(i)
                  }
                  className={`flex items-center gap-2.5 p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.98] ${style}`}
                >
                  <span className="flex-shrink-0 size-6 md:size-7 rounded-full bg-secondary text-white text-xs md:text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-xs md:text-sm font-medium text-foreground">
                    {item.left}
                  </span>
                  {isPaired && !submitted && (
                    <span className="flex-shrink-0 size-5 rounded-full bg-muted-foreground/20 text-muted-foreground flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-colors">
                      <span className="material-symbols-outlined text-[14px]">
                        close
                      </span>
                    </span>
                  )}
                  {submitted && isPaired && (
                    <span className="flex-shrink-0">
                      {pairs[i] === i ? (
                        <span className="material-symbols-outlined text-green-500 text-lg filled">
                          check_circle
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-red-500 text-lg filled">
                          cancel
                        </span>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column */}
          <div className="space-y-2.5 md:space-y-3">
            <p className="text-xs md:text-sm font-semibold text-center mb-3 text-purple-400 uppercase tracking-wider">
              Đáp án
            </p>
            {shuffledRight.map((origIdx, displayIdx) => {
              const item = items[origIdx];
              const isUsed = usedRight.has(origIdx);
              const pairedLeftEntry = Object.entries(pairs).find(
                ([, v]) => v === origIdx,
              );
              const pairedLeftIdx =
                pairedLeftEntry !== undefined
                  ? Number(pairedLeftEntry[0])
                  : null;

              let style =
                "border-border bg-card hover:bg-accent/5 cursor-pointer";
              if (submitted && isUsed && pairedLeftIdx !== null) {
                style =
                  pairs[pairedLeftIdx] === pairedLeftIdx
                    ? "border-green-500 bg-green-500/10"
                    : "border-red-500 bg-red-500/10";
              } else if (isUsed) {
                style = "border-purple-400/60 bg-purple-500/5";
              } else if (activeLeft !== null) {
                style =
                  "border-dashed border-orange-400/50 bg-orange-500/5 hover:bg-orange-500/10 hover:border-orange-400 cursor-pointer";
              }

              return (
                <div
                  key={`right-${origIdx}`}
                  ref={(el) => {
                    rightRefs.current[origIdx] = el;
                  }}
                  onClick={() => {
                    if (submitted) return;
                    if (isUsed && pairedLeftIdx !== null) {
                      removePair(pairedLeftIdx);
                    } else {
                      selectRight(origIdx);
                    }
                  }}
                  className={`flex items-center gap-2.5 p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.98] ${style}`}
                >
                  <span className="flex-shrink-0 size-6 md:size-7 rounded-full bg-purple-500 text-white text-xs md:text-sm font-bold flex items-center justify-center">
                    {String.fromCharCode(65 + displayIdx)}
                  </span>
                  <span className="flex-1 text-xs md:text-sm font-medium text-foreground">
                    {item.right}
                  </span>
                  {isUsed && !submitted && (
                    <span className="flex-shrink-0 size-5 rounded-full bg-muted-foreground/20 text-muted-foreground flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-colors">
                      <span className="material-symbols-outlined text-[14px]">
                        close
                      </span>
                    </span>
                  )}
                  {submitted && isUsed && pairedLeftIdx !== null && (
                    <span className="flex-shrink-0">
                      {pairs[pairedLeftIdx] === pairedLeftIdx ? (
                        <span className="material-symbols-outlined text-green-500 text-lg filled">
                          check_circle
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-red-500 text-lg filled">
                          cancel
                        </span>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <TaskActions
        submitted={submitted}
        canSubmit={allMatched}
        onSubmit={submit}
        onReset={reset}
        score={score}
        total={items.length}
      />
    </div>
  );
}
