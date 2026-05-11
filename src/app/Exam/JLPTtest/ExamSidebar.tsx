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
    <aside style={{
      width: "18rem",
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      zIndex: 30,
      height: "100%",
      background: "linear-gradient(180deg, rgba(17, 25, 39, 0.98) 0%, rgba(15, 23, 42, 0.95) 100%)",
      borderRight: "1px solid rgba(245, 240, 232, 0.08)",
      backdropFilter: "blur(12px)"
    }} className="hidden xl:flex">
      {/* Header */}
      <div style={{
        padding: "1rem",
        borderBottom: "1px solid rgba(245, 240, 232, 0.05)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "rgba(30, 41, 59, 0.3)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span className="material-symbols-outlined" style={{ color: "rgba(165, 42, 42, 0.8)", fontSize: "1.125rem" }}>
            grid_view
          </span>
          <span style={{
            fontFamily: "'Noto Sans JP', sans-serif",
            fontSize: "0.75rem",
            fontWeight: 500,
            color: "rgba(245, 240, 232, 0.7)",
            letterSpacing: "0.05em",
            textTransform: "uppercase"
          }}>問題一覧</span>
        </div>
        <span style={{
          fontFamily: "monospace",
          fontSize: "0.75rem",
          backgroundColor: "rgba(30, 41, 59, 0.5)",
          color: "rgba(245, 240, 232, 0.6)",
          padding: "0.25rem 0.625rem",
          borderRadius: "4px",
          border: "1px solid rgba(245, 240, 232, 0.05)"
        }}>
          {answeredCount}/{totalCount}
        </span>
      </div>

      {/* Legend */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        margin: "1rem 1rem 0.5rem",
        padding: "0.625rem",
        borderRadius: "4px",
        backgroundColor: "rgba(30, 41, 59, 0.3)",
        border: "1px solid rgba(245, 240, 232, 0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "rgba(30, 41, 59, 0.6)", border: "1px solid rgba(245, 240, 232, 0.1)" }} />
          <span style={{ fontSize: "0.5625rem", color: "rgba(245, 240, 232, 0.4)", fontFamily: "'Noto Sans JP', sans-serif" }}>未回答</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "#A52A2A" }} />
          <span style={{ fontSize: "0.5625rem", color: "rgba(245, 240, 232, 0.4)", fontFamily: "'Noto Sans JP', sans-serif" }}>回答済</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", border: "1px solid rgba(245, 240, 232, 0.4)" }} />
          <span style={{ fontSize: "0.5625rem", color: "rgba(245, 240, 232, 0.4)", fontFamily: "'Noto Sans JP', sans-serif" }}>現在</span>
        </div>
      </div>

      {/* Section groups */}
      <div style={{ flex: 1, overflowY: "auto", paddingTop: "0.75rem" }} className="custom-scrollbar">
        {structure.map((section, si) => {
          const isOpen = !collapsed[si];
          return (
            <div key={si} style={{ marginBottom: "0.25rem" }}>
              {/* Section header */}
              <button
                onClick={() => setCollapsed((p) => ({ ...p, [si]: !p[si] }))}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.625rem 1rem",
                  textAlign: "left",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(245, 240, 232, 0.7)",
                  fontFamily: "'Noto Sans JP', sans-serif",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  transition: "background-color 0.15s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.3)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <span>{section.name}</span>
                {isOpen ? (
                  <ChevronDown style={{ width: "12px", height: "12px", color: "rgba(245, 240, 232, 0.3)" }} />
                ) : (
                  <ChevronRight style={{ width: "12px", height: "12px", color: "rgba(245, 240, 232, 0.3)" }} />
                )}
              </button>

              {isOpen && (
                <div style={{ padding: "0 0.75rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {section.mondai.map((mondai) => {
                    const mondaiQuestions = leafQuestions
                      .filter(q => q.mondaiNumber === mondai.number)
                      .sort((a,b) => a.questionOrder - b.questionOrder);

                    if (mondaiQuestions.length === 0) return null;

                    return (
                      <div key={mondai.number} style={{
                        backgroundColor: "rgba(30, 41, 59, 0.2)",
                        borderRadius: "4px",
                        padding: "0.75rem",
                        border: "1px solid rgba(245, 240, 232, 0.05)"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
                          <span style={{ fontSize: "0.625rem", color: "rgba(245, 240, 232, 0.5)", fontFamily: "'Noto Serif JP', serif" }}>
                            問題{mondai.number}
                          </span>
                          {mondai.requires_audio && (
                            <Volume2 style={{ width: "10px", height: "10px", color: "rgba(165, 42, 42, 0.6)" }} />
                          )}
                          {mondai.requires_passage && (
                            <FileText style={{ width: "10px", height: "10px", color: "rgba(96, 165, 250, 0.5)" }} />
                          )}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
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
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: "4px",
                                  fontFamily: "'Noto Sans JP', sans-serif",
                                  fontSize: "0.75rem",
                                  fontWeight: 500,
                                  cursor: "pointer",
                                  backgroundColor: isAnswered ? "#A52A2A" : "rgba(30, 41, 59, 0.6)",
                                  border: isAnswered 
                                    ? "1px solid rgba(165, 42, 42, 0.8)" 
                                    : "1px solid rgba(245, 240, 232, 0.15)",
                                  color: isAnswered ? "#F5F0E8" : "rgba(245, 240, 232, 0.6)",
                                  boxShadow: isCurrent 
                                    ? `0 0 0 2px rgba(245, 240, 232, 0.4), 0 0 12px rgba(165, 42, 42, ${isAnswered ? 0.6 : 0.3})`
                                    : isAnswered 
                                      ? "0 2px 8px rgba(165, 42, 42, 0.4)" 
                                      : "none",
                                  transform: isCurrent ? "scale(1.1)" : "scale(1)",
                                  zIndex: isCurrent ? 10 : 1,
                                  position: "relative",
                                  transition: "all 0.2s ease"
                                }}
                              >
                                {subLabel}
                                {isFlagged && (
                                  <span style={{ 
                                    position: 'absolute', 
                                    top: '-3px', 
                                    right: '-3px',
                                    width: '6px',
                                    height: '6px',
                                    backgroundColor: '#EAB308',
                                    borderRadius: '2px'
                                  }} />
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
      <div style={{
        height: "1px",
        margin: "0 1rem",
        background: "linear-gradient(90deg, transparent 0%, rgba(245, 240, 232, 0.15) 20%, rgba(245, 240, 232, 0.25) 50%, rgba(245, 240, 232, 0.15) 80%, transparent 100%)"
      }} />

      {/* Flag button */}
      <div style={{ padding: "1rem", backgroundColor: "rgba(30, 41, 59, 0.2)" }}>
        <button
          onClick={toggleFlag}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.625rem",
            padding: "0.625rem 1rem",
            borderRadius: "4px",
            border: `1px solid ${isCurrentFlagged ? "rgba(234, 179, 8, 0.5)" : "rgba(245, 240, 232, 0.08)"}`,
            backgroundColor: isCurrentFlagged ? "rgba(234, 179, 8, 0.08)" : "transparent",
            color: isCurrentFlagged ? "#EAB308" : "rgba(245, 240, 232, 0.5)",
            fontFamily: "'Noto Sans JP', sans-serif",
            fontSize: "0.875rem",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "1.125rem", fontVariationSettings: isCurrentFlagged ? "'FILL' 1" : "'FILL' 0" }}>
            flag
          </span>
          {isCurrentFlagged ? "フラグ解除" : "フラグを付ける"}
        </button>
      </div>
    </aside>
  );
}
