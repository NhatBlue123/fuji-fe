import { useTranslation } from "react-i18next";
"use client";

import type { TaskDataEnvelope } from "./types";
import { TaskHeader, EmptyTask } from "./MultipleChoiceTask";

// ─── Component ─────────────────────────────────────────

/**
 * SpeakingTask — placeholder UI for speaking exercises.
 * No data structure is defined yet on the backend, so this shows
 * the instructions + a practice prompt.
 */
export default function SpeakingTask({
  data,
}: {
  data: TaskDataEnvelope;
  onTaskSubmitted?: () => void;
}) {
  const hasContent = data.instructions || (data.items && data.items.length > 0);

  if (!hasContent) {
    return <EmptyTask message="Bài tập nói đang được phát triển." />;
  }

  return (
    <div className="space-y-6">
      <TaskHeader
        icon="mic"
        label="Luyện nói"
        instructions={data.instructions}
      />

      {/* Practice items */}
      {data.items.length > 0 && (
        <div className="space-y-4">
          {data.items.map((item, idx) => {
            const entry = item as {
              text?: string;
              prompt?: string;
              example?: string;
            };
            return (
              <div
                key={idx}
                className="bg-card rounded-2xl border border-border p-6"
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 size-8 rounded-lg bg-secondary/10 text-secondary text-sm font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div className="space-y-2">
                    <p className="text-foreground font-medium">
                      {entry.prompt || entry.text || JSON.stringify(item)}
                    </p>
                    {entry.example && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">
                          format_quote
                        </span>
                        Ví dụ: {entry.example}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mic prompt */}
      <div className="bg-card rounded-2xl border border-dashed border-secondary/30 p-8 flex flex-col items-center gap-4 text-center">
        <div className="size-16 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl filled">mic</span>
        </div>
        <div>
          <p className="font-semibold text-foreground">{t('auto.speakingtask_1')}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Đọc to các câu ở trên để luyện phát âm. Tính năng ghi âm sẽ được cập
            nhật sớm.
          </p>
        </div>
      </div>
    </div>
  );
}
