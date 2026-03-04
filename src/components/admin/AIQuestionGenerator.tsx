"use client";

import { useState } from "react";
import { Loader2, Sparkles, AlertCircle, CheckCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AIGeneratedQuestion {
  contentText: string;
  options: string[];
  correctOption: number;
  explanation: string;
  passageText: string;
}

interface AIQuestionGeneratorProps {
  level: string;
  mondaiNumber: number;
  mondaiTitle?: string;
  section: "VOCABULARY" | "GRAMMAR" | "READING" | "LISTENING";
  /** Gọi khi user xác nhận → điền dữ liệu vào form cha */
  onConfirm: (q: AIGeneratedQuestion) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AIQuestionGenerator({
  level,
  mondaiNumber,
  mondaiTitle,
  section,
  onConfirm,
}: AIQuestionGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<AIGeneratedQuestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState("");

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setPreview(null);

    try {
      const res = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          section,
          count: 1,
          mondaiNumber,
          mondaiTitle,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Lỗi không xác định");
        return;
      }
      const first = (json.questions || [])[0];
      if (!first) {
        setError("AI không trả về câu hỏi. Thử lại.");
        return;
      }
      setPreview(first);
      setModel(json.model || "");
    } catch (e: any) {
      setError(e.message || "Không thể kết nối AI");
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirm = () => {
    if (!preview) return;
    onConfirm(preview);
    setPreview(null);
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/10 p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-purple-500 rounded-md">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-purple-800 dark:text-purple-200">
            AI Gợi ý câu hỏi
          </span>
          {model && (
            <span className="text-[10px] text-muted-foreground">({model})</span>
          )}
        </div>

        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={generating}
          className={`h-7 px-3 text-xs gap-1.5 ${
            preview
              ? "bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300"
              : "bg-purple-600 hover:bg-purple-700 text-white"
          }`}
          variant={preview ? "ghost" : "default"}
        >
          {generating ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Đang tạo...
            </>
          ) : preview ? (
            <>
              <RefreshCw className="h-3 w-3" />
              Tạo lại
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3" />
              Generate
            </>
          )}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-2.5 rounded-lg bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 p-3">
          {/* Passage (Reading/Listening) */}
          {preview.passageText && (
            <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 p-2.5 text-xs font-jp leading-relaxed text-blue-900 dark:text-blue-200 whitespace-pre-wrap">
              {preview.passageText}
            </div>
          )}

          {/* Question text */}
          <p className="text-sm font-jp leading-relaxed">{preview.contentText}</p>

          {/* Options grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {preview.options.map((opt, i) => (
              <div
                key={i}
                className={`rounded-md px-2.5 py-1.5 text-xs font-jp ${
                  i + 1 === preview.correctOption
                    ? "bg-green-100 dark:bg-green-950/50 border border-green-400 text-green-800 dark:text-green-300 font-semibold"
                    : "bg-muted border border-border"
                }`}
              >
                <span className="text-muted-foreground mr-1">{i + 1}.</span>
                {opt}
              </div>
            ))}
          </div>

          {/* Explanation */}
          {preview.explanation && (
            <p className="text-xs text-muted-foreground italic">
              💡 {preview.explanation}
            </p>
          )}

          {/* Confirm button */}
          <Button
            className="w-full h-8 gap-1.5 text-sm bg-green-600 hover:bg-green-700 text-white mt-1"
            onClick={handleConfirm}
          >
            <CheckCheck className="h-4 w-4" />
            Xác nhận — Điền vào form
          </Button>
        </div>
      )}

      {/* Placeholder */}
      {!preview && !generating && !error && (
        <p className="text-xs text-muted-foreground text-center py-1">
          Nhấn Generate để AI tạo gợi ý cho câu hỏi này
        </p>
      )}
    </div>
  );
}
