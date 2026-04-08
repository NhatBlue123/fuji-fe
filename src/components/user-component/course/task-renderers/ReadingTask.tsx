"use client";

import type { TaskDataEnvelope } from "./types";
import { TaskHeader, EmptyTask } from "./MultipleChoiceTask";

// ─── Component ─────────────────────────────────────────

/**
 * ReadingTask — displays a reading passage with comprehension content.
 * No formal data structure yet — renders instructions and any items
 * as reading passages / questions.
 */
export default function ReadingTask({
  data,
}: {
  data: TaskDataEnvelope;
  onTaskSubmitted?: () => void;
}) {
  const hasContent = data.instructions || (data.items && data.items.length > 0);

  if (!hasContent) {
    return <EmptyTask message="Bài tập đọc hiểu đang được phát triển." />;
  }

  return (
    <div className="space-y-6">
      <TaskHeader
        icon="menu_book"
        label="Đọc hiểu"
        instructions={data.instructions}
      />

      {/* Reading passages / items */}
      {data.items.length > 0 && (
        <div className="space-y-4">
          {data.items.map((item, idx) => {
            const entry = item as {
              passage?: string;
              text?: string;
              title?: string;
              question?: string;
              answer?: string;
            };

            return (
              <div
                key={idx}
                className="bg-card rounded-2xl border border-border p-6"
              >
                {/* Title */}
                {entry.title && (
                  <p className="text-foreground font-semibold mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-lg">
                      article
                    </span>
                    {entry.title}
                  </p>
                )}

                {/* Passage / Text */}
                {(entry.passage || entry.text) && (
                  <div className="bg-background rounded-xl border border-border p-5 mb-4">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm">
                      {entry.passage || entry.text}
                    </p>
                  </div>
                )}

                {/* Question */}
                {entry.question && (
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 size-8 rounded-lg bg-secondary/10 text-secondary text-sm font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <p className="text-foreground font-medium pt-1">
                      {entry.question}
                    </p>
                  </div>
                )}

                {/* If no structured fields, show raw */}
                {!entry.passage &&
                  !entry.text &&
                  !entry.title &&
                  !entry.question && (
                    <p className="text-foreground text-sm">
                      {JSON.stringify(item)}
                    </p>
                  )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
