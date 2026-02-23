"use client";
import { useState } from "react";
import type { JlptQuestion } from "@/types/jlpt";
import { getQuestionNumbers, type SectionConfig } from "@/lib/jlpt-structure";
import { Volume2, FileText, ChevronDown, ChevronRight } from "lucide-react";

interface SidebarProps {
  structure: SectionConfig[];   // pre-built (may use custom counts from admin config)
  currentQ: number;
  answers: Record<number, number>;
  questions: JlptQuestion[];
  onSelect: (n: number) => void;
}

export default function ExamSidebar({
  structure,
  currentQ,
  answers,
  questions,
  onSelect,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);

  const toggleFlag = () => {
    setFlaggedQuestions((prev) =>
      prev.includes(currentQ) ? prev.filter((q) => q !== currentQ) : [...prev, currentQ]
    );
  };

  const isCurrentFlagged = flaggedQuestions.includes(currentQ);

  // Flatten tree to get all answerable leaf questions (matching exam page logic)
  const leafQuestions = questions.flatMap((q) =>
    q.children && q.children.length > 0
      ? q.children
      : q.parentId == null ? [q] : []
  ).filter((q) => q.correctOption != null);

  // Build answered set keyed by questionOrder (same number shown in dot grid)
  const answeredSet = new Set(
    leafQuestions
      .filter((q) => answers[q.id] !== undefined)
      .map((q) => q.questionOrder)
  );
  const answeredCount = answeredSet.size;
  const totalCount = leafQuestions.length;

  return (
    <aside className="w-72 shrink-0 border-l border-slate-700 bg-[#1E293B] hidden xl:flex flex-col z-30 h-full shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex justify-between items-center text-white font-bold bg-[#162032]">
        <span className="flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-[#ee2b5b] text-lg">grid_view</span>
          Danh sách câu hỏi
        </span>
        <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-600">
          {answeredCount}/{totalCount}
        </span>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between gap-2 mx-4 mt-3 mb-1 text-[9px] font-medium text-slate-400 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
        <div className="flex items-center gap-1">
          <div className="size-2.5 rounded-full bg-[#334155]" />
          <span>Chưa làm</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="size-2.5 rounded-full bg-[#ee2b5b]" />
          <span>Đã làm</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="size-2.5 rounded-full border-2 border-[#3b82f6]" />
          <span>Hiện tại</span>
        </div>
      </div>

      {/* Section groups */}
      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {structure.map((section, si) => {
          const isOpen = !collapsed[si];
          return (
            <div key={si} className="mb-1">
              {/* Section header */}
              <button
                onClick={() => setCollapsed((p) => ({ ...p, [si]: !p[si] }))}
                className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-slate-700/30 transition-colors"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.name}
                </span>
                {isOpen ? (
                  <ChevronDown className="h-3 w-3 text-slate-500" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-slate-500" />
                )}
              </button>

              {isOpen && (
                <div className="px-3 pb-2 space-y-2">
                  {section.mondai.map((mondai) => {
                    const nums = getQuestionNumbers(mondai);
                    return (
                      <div key={mondai.number} className="bg-slate-800/40 rounded-lg p-2.5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] text-slate-400 font-medium">
                            問題{mondai.number}
                          </span>
                          {mondai.requires_audio && (
                            <Volume2 className="h-2.5 w-2.5 text-violet-400" />
                          )}
                          {mondai.requires_passage && (
                            <FileText className="h-2.5 w-2.5 text-blue-400" />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {nums.map((n) => {
                            const isCurrent = currentQ === n;
                            const isAnswered = answeredSet.has(n);
                            const isFlagged = flaggedQuestions.includes(n);
                            
                            // Retrieve exact label computed centrally in page.tsx
                            const leafQ = leafQuestions.find((q) => q.questionOrder === n);
                            const subLabel = (leafQ as any)?.subLabel ?? String(n);

                            return (
                              <button
                                key={n}
                                onClick={() => onSelect(n)}
                                className="h-7 rounded flex items-center justify-center text-[10px] font-medium transition-all relative"
                                style={{
                                  minWidth: subLabel.includes('.') ? "2.6rem" : "1.75rem",
                                  backgroundColor: isAnswered ? "#ee2b5b" : "#334155",
                                  border: isCurrent ? "2px solid #3b82f6" : "2px solid transparent",
                                  color: isCurrent || isAnswered ? "#fff" : "#94a3b8",
                                  transform: isCurrent ? "scale(1.1)" : "scale(1)",
                                  boxShadow: isCurrent ? "0 0 8px rgba(59,130,246,0.5)" : isAnswered ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
                                }}
                              >
                                {subLabel}
                                {isFlagged && (
                                  <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Flag button */}
      <div className="p-4 border-t border-slate-700 bg-[#162032]">
        <button
          onClick={toggleFlag}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all font-medium text-sm"
          style={{
            borderColor: isCurrentFlagged ? "#facc15" : "#475569",
            backgroundColor: isCurrentFlagged
              ? "rgba(250,204,21,0.1)"
              : "transparent",
            color: isCurrentFlagged ? "#facc15" : "#cbd5e1",
          }}
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{
              fontVariationSettings: isCurrentFlagged ? "'FILL' 1" : "'FILL' 0",
            }}
          >
            flag
          </span>
          {isCurrentFlagged ? "Bỏ đánh dấu" : "Đánh dấu câu hỏi"}
        </button>
      </div>
    </aside>
  );
}