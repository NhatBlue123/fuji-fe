"use client";

import { useState } from "react";
import { Loader2, Sparkles, AlertCircle, CheckCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  mondaiStart: number;
  mondaiEnd: number;
  initialStart: number;
  section: "VOCABULARY" | "GRAMMAR" | "READING" | "LISTENING";
  /** Gọi khi user xác nhận → điền dữ liệu vào form cha. Truyền kèm vị trí bắt đầu dãy câu hỏi */
  onConfirm: (questions: AIGeneratedQuestion[], startFrom: number) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AIQuestionGenerator({
  level,
  mondaiNumber,
  mondaiTitle,
  mondaiStart,
  mondaiEnd,
  initialStart,
  section,
  onConfirm,
}: AIQuestionGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [previewList, setPreviewList] = useState<AIGeneratedQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState("");
  
  // Dải câu hỏi cần tạo
  const [startQ, setStartQ] = useState<number>(initialStart);
  // Default to 5 questions or end of mondai, whichever is smaller. Single for reading.
  const [endQ, setEndQ] = useState<number>(section === "READING" ? Math.min(initialStart + 2, mondaiEnd) : Math.min(initialStart + 4, mondaiEnd));

  // Auto clamps start/end
  const handleStartChange = (val: number) => {
    let start = val;
    if (start < mondaiStart) start = mondaiStart;
    if (start > mondaiEnd) start = mondaiEnd;
    setStartQ(start);
    if (endQ < start) setEndQ(start);
  };

  const handleEndChange = (val: number) => {
    let end = val;
    if (end < mondaiStart) end = mondaiStart;
    if (end > mondaiEnd) end = mondaiEnd;
    setEndQ(end);
    if (startQ > end) setStartQ(end);
  };

  const count = endQ - startQ + 1;

  const handleGenerate = async () => {
    if (count < 1 || count > 20) {
      setError("Số lượng câu hỏi phải từ 1 đến 20");
      return;
    }

    setGenerating(true);
    setError(null);
    setPreviewList([]);

    try {
      const res = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          section,
          count,
          mondaiNumber,
          mondaiTitle,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Lỗi không xác định");
        return;
      }
      
      const questionsData = json.questions || [];
      if (questionsData.length === 0) {
        setError("AI không trả về câu hỏi. Thử lại.");
        return;
      }
      
      setPreviewList(questionsData);
      setModel(json.model || "");
    } catch (e: any) {
      setError(e.message || "Không thể kết nối AI");
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirm = () => {
    if (previewList.length === 0) return;
    onConfirm(previewList, startQ);
    setPreviewList([]);
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/10 p-4 space-y-4 max-h-[600px] overflow-y-auto">
      {/* Header row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-purple-500 rounded-md shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-purple-800 dark:text-purple-200">
            AI Tạo {section === "READING" ? "đoạn văn & câu hỏi" : "danh sách câu hỏi"}
          </span>
          {model && (
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">({model})</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Range selection panel */}
          <div className="flex items-center items-stretch bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-md overflow-hidden h-8">
            <span className="text-xs text-muted-foreground px-2 flex items-center bg-purple-50 dark:bg-purple-950/30 border-r border-purple-100 dark:border-purple-800">
              Từ câu
            </span>
            <Input 
              type="number" 
              min={mondaiStart} 
              max={mondaiEnd}
              value={startQ}
              onChange={(e) => handleStartChange(Number(e.target.value))}
              disabled={generating}
              className="h-full w-14 border-0 rounded-none text-xs text-center focus-visible:ring-0 p-0"
              title={`Min: ${mondaiStart}, Max: ${mondaiEnd}`}
            />
            <span className="text-xs text-muted-foreground px-2 flex items-center border-l bg-purple-50 dark:bg-purple-950/30 border-r border-purple-100 dark:border-purple-800">
              Đến câu
            </span>
            <Input 
              type="number" 
              min={mondaiStart} 
              max={mondaiEnd}
              value={endQ}
              onChange={(e) => handleEndChange(Number(e.target.value))}
              disabled={generating}
              className="h-full w-14 border-0 rounded-none text-xs text-center focus-visible:ring-0 p-0"
              title={`Min: ${mondaiStart}, Max: ${mondaiEnd}`}
            />
          </div>

          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
            className={`h-8 px-3 text-xs gap-1.5 ${
              previewList.length > 0
                ? "bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
            variant={previewList.length > 0 ? "ghost" : "default"}
          >
            {generating ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Đang tạo...
              </>
            ) : previewList.length > 0 ? (
              <>
                <RefreshCw className="h-3 w-3" />
                Tạo lại ({count} câu)
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" />
                Generate ({count} câu)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Preview List */}
      {previewList.length > 0 && (
        <div className="space-y-4">
          {previewList.map((preview, idx) => (
            <div key={idx} className="space-y-2.5 rounded-lg bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 p-3 relative">
              
              <div className="absolute -top-2.5 -left-2.5 bg-purple-500 text-white text-[10px] font-bold h-6 min-w-6 px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 z-10">
                Câu {startQ + idx}
              </div>

              {/* Passage (Reading/Listening) */}
              {preview.passageText && (
                <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 p-2.5 text-xs font-jp leading-relaxed text-blue-900 dark:text-blue-200 whitespace-pre-wrap mt-2">
                  {preview.passageText}
                </div>
              )}

              {/* Question text */}
              <p className={`text-sm font-jp leading-relaxed pl-3 ${!preview.passageText ? 'mt-2' : ''}`}>{preview.contentText}</p>

              {/* Options grid */}
              <div className="grid grid-cols-2 gap-1.5 pl-3">
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
                <p className="text-xs text-muted-foreground italic pl-3 pt-1">
                  💡 {preview.explanation}
                </p>
              )}
            </div>
          ))}

          {/* Confirm Button */}
          <div className="sticky bottom-0 pt-2 pb-1 bg-gradient-to-t from-purple-50/90 dark:from-purple-950/90 to-transparent">
            <Button
              className="w-full h-10 gap-2 text-sm bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-900/20"
              onClick={handleConfirm}
            >
              <CheckCheck className="h-4 w-4" />
              Xác nhận — Điền {count} câu (từ Câu {startQ} → {startQ + count - 1})
            </Button>
          </div>
        </div>
      )}

      {/* Placeholder */}
      {previewList.length === 0 && !generating && !error && (
        <p className="text-xs text-muted-foreground text-center py-4 opacity-70">
          Nhập từ câu đến câu và nhấn Generate tự động tạo dữ liệu vào ô
        </p>
      )}
    </div>
  );
}


