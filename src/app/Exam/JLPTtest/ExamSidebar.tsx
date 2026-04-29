"use client";
import { useState } from "react";
import type { JlptQuestion } from "@/types/jlpt";
import { type SectionConfig } from "@/lib/jlpt-structure";
import { Volume2, FileText, ChevronDown, ChevronRight } from "lucide-react";

interface SidebarProps {
  structure: SectionConfig[];
  currentQ: number;
  answers: Record<number, number>;
  leafQuestions: JlptQuestion[];
  onSelect: (n: number) => void;
}

export default function ExamSidebar({
  structure,
  currentQ,
  answers,
  leafQuestions,
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

  const answeredSet = new Set(
    leafQuestions
      .filter((q) => answers[q.id] !== undefined)
      .map((q) => q.questionOrder)
  );
  const answeredCount = answeredSet.size;
  const totalCount = leafQuestions.length;

  return (
    <aside className="sidebar-jlpt w-72 shrink-0 hidden xl:flex flex-col z-30 h-full">
      {/* Header */}
      <div className="p-4 border-b border-washi-paper/5 flex justify-between items-center bg-charcoal/30">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-shun-nuri/80 text-lg">
            grid_view
          </span>
          <span className="sidebar-section-label">問題一覧</span>
        </div>
        <span className="font-mono text-xs bg-charcoal/50 text-washi-paper/60 px-2.5 py-1 rounded-sm border border-washi-paper/5">
          {answeredCount}/{totalCount}
        </span>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between gap-3 mx-4 mt-4 mb-2 p-2.5 rounded-sm bg-charcoal/30 border border-washi-paper/5">
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-sm bg-charcoal/60 border border-washi-paper/10" />
          <span className="text-[9px] text-washi-paper/40 font-jp">未回答</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-sm bg-shun-nuri" />
          <span className="text-[9px] text-washi-paper/40 font-jp">回答済</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-sm border border-washi-paper/40" />
          <span className="text-[9px] text-washi-paper/40 font-jp">現在</span>
        </div>
      </div>

      {/* Section groups */}
      <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
        {structure.map((section, si) => {
          const isOpen = !collapsed[si];
          return (
            <div key={si} className="mb-1">
              {/* Section header */}
              <button
                onClick={() => setCollapsed((p) => ({ ...p, [si]: !p[si] }))}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-charcoal/30 transition-colors"
              >
                <span className="sidebar-section-label">
                  {section.name}
                </span>
                {isOpen ? (
                  <ChevronDown className="h-3 w-3 text-washi-paper/30" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-washi-paper/30" />
                )}
              </button>

              {isOpen && (
                <div className="px-3 pb-3 space-y-2">
                  {section.mondai.map((mondai) => {
                    const mondaiQuestions = leafQuestions
                      .filter(q => q.mondaiNumber === mondai.number)
                      .sort((a,b) => a.questionOrder - b.questionOrder);

                    if (mondaiQuestions.length === 0) return null;

                    return (
                      <div key={mondai.number} className="bg-charcoal/20 rounded-sm p-3 border border-washi-paper/5">
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className="text-[10px] text-washi-paper/50 font-mincho">
                            問題{mondai.number}
                          </span>
                          {mondai.requires_audio && (
                            <Volume2 className="h-2.5 w-2.5 text-shun-nuri/60" />
                          )}
                          {mondai.requires_passage && (
                            <FileText className="h-2.5 w-2.5 text-blue-400/50" />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {mondaiQuestions.map((leafQ) => {
                            const qId = leafQ.id;
                            const n = leafQ.questionOrder;
                            const isCurrent = currentQ === n;
                            const isAnswered = answeredSet.has(n);
                            const isFlagged = flaggedQuestions.includes(n);

                            const subLabel = leafQ.subLabel ?? String(n);

                            return (
                              <button
                                key={qId}
                                onClick={() => onSelect(n)}
                                className={`question-dot ${
                                  isAnswered ? "answered" : "unanswered"
                                } ${isCurrent ? "current" : ""}`}
                              >
                                {subLabel}
                                {isFlagged && (
                                  <span className="absolute -top-0.5 -right-0.5 size-1.5 bg-yellow-500 rounded-sm" />
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

      {/* Divider */}
      <div className="divider-ma mx-4" />

      {/* Flag button */}
      <div className="p-4 bg-charcoal/20">
        <button
          onClick={toggleFlag}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-sm border transition-all font-jp text-sm"
          style={{
            borderColor: isCurrentFlagged ? "rgba(234, 179, 8, 0.5)" : "rgba(245, 240, 232, 0.08)",
            backgroundColor: isCurrentFlagged
              ? "rgba(234, 179, 8, 0.08)"
              : "transparent",
            color: isCurrentFlagged ? "#EAB308" : "rgba(245, 240, 232, 0.5)",
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
          {isCurrentFlagged ? "フラグ解除" : "フラグを付ける"}
        </button>
      </div>
    </aside>
  );
}
