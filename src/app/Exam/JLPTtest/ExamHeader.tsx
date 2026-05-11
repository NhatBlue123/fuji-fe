"use client";
import React from "react";

interface HeaderProps {
  timeLeft: number;
  formatTime: (s: number) => string;
  testTitle?: string;
  answeredCount: number;
  totalCount: number;
  onSubmit: () => void;
}

export default function ExamHeader({
  timeLeft,
  formatTime,
  testTitle,
  answeredCount,
  totalCount,
  onSubmit,
}: HeaderProps) {
  const isWarning = timeLeft < 300;

  return (
    <header style={{
      height: "4rem",
      flexShrink: 0,
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 1.5rem",
      background: "linear-gradient(180deg, rgba(11, 17, 32, 0.98) 0%, rgba(11, 17, 32, 0.95) 100%)",
      borderBottom: "1px solid rgba(245, 240, 232, 0.08)",
      backdropFilter: "blur(12px)"
    }}>
      {/* Left: Logo & Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "2.25rem",
          height: "2.25rem",
          borderRadius: "4px",
          backgroundColor: "rgba(165, 42, 42, 0.1)",
          border: "1px solid rgba(165, 42, 42, 0.2)"
        }}>
          <span className="material-symbols-outlined" style={{ color: "#A52A2A", fontSize: "1.125rem", fontVariationSettings: "'FILL' 1" }}>
            school
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <h1 style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "rgba(245, 240, 232, 0.9)",
            fontFamily: "'Noto Sans JP', sans-serif",
            letterSpacing: "0.025em"
          }}>
            {testTitle || "JLPT模擬試験"}
          </h1>
          <span style={{
            fontSize: "0.625rem",
            color: "rgba(245, 240, 232, 0.4)",
            fontFamily: "'Noto Sans JP', sans-serif",
            letterSpacing: "0.1em",
            textTransform: "uppercase"
          }}>
            Japanese Language Proficiency Test
          </span>
        </div>
      </div>

      {/* Center: Progress indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.375rem 1rem",
          borderRadius: "4px",
          backgroundColor: "rgba(30, 41, 59, 0.5)",
          border: "1px solid rgba(245, 240, 232, 0.05)"
        }}>
          <span style={{
            fontSize: "0.625rem",
            color: "rgba(245, 240, 232, 0.5)",
            fontFamily: "'Noto Sans JP', sans-serif",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            解答済み
          </span>
          <span style={{
            fontFamily: "monospace",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: answeredCount === totalCount ? "#34D399" : "rgba(245, 240, 232, 0.7)"
          }}>
            {answeredCount}
            <span style={{ color: "rgba(245, 240, 232, 0.3)", margin: "0 0.25rem" }}>/</span>
            {totalCount}
          </span>
        </div>
      </div>

      {/* Right: Timer & Submit */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
        {/* Timer */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          padding: "0.5rem 1rem",
          borderRadius: "4px",
          backgroundColor: "rgba(30, 41, 59, 0.5)",
          border: "1px solid rgba(245, 240, 232, 0.05)"
        }}>
          <span className="material-symbols-outlined" style={{ color: "rgba(245, 240, 232, 0.5)", fontSize: "1.125rem", fontVariationSettings: "'FILL' 1" }}>
            timer
          </span>
          <span style={{
            fontFamily: "monospace",
            fontSize: "1.125rem",
            fontWeight: 600,
            color: isWarning ? "#EF4444" : "rgba(245, 240, 232, 0.9)",
            letterSpacing: "0.05em",
            animation: isWarning ? "timer-pulse 1s ease-in-out infinite" : "none"
          }}>
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Submit button */}
        <button
          onClick={onSubmit}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 1.25rem",
            background: "linear-gradient(135deg, #A52A2A 0%, #8B2525 100%)",
            border: "1px solid rgba(165, 42, 42, 0.6)",
            borderRadius: "6px",
            color: "#F5F0E8",
            fontFamily: "'Noto Sans JP', sans-serif",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(165, 42, 42, 0.3)",
            transition: "all 0.25s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, #8B2525 0%, #6B1D1D 100%)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(165, 42, 42, 0.4)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, #A52A2A 0%, #8B2525 100%)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(165, 42, 42, 0.3)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "1.125rem" }}>
            send
          </span>
          <span>提出</span>
        </button>
      </div>
    </header>
  );
}
