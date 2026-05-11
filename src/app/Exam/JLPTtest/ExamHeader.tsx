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
    <header className="header-jlpt h-16 shrink-0 z-50 flex items-center justify-between px-6">
      {/* Left: Logo & Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center size-9 rounded-sm bg-shun-nuri/10 border border-shun-nuri/20">
          <span
            className="material-symbols-outlined text-shun-nuri text-lg"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            school
          </span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-sm font-semibold tracking-wide text-washi-paper/90 font-jp">
            {testTitle || "JLPT模擬試験"}
          </h1>
          <span className="text-[10px] text-washi-paper/40 font-jp tracking-widest uppercase">
            Japanese Language Proficiency Test
          </span>
        </div>
      </div>

      {/* Center: Progress indicator */}
      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-sm bg-charcoal/50 border border-washi-paper/5">
          <span className="text-[10px] text-washi-paper/50 font-jp uppercase tracking-wider">
            解答済み
          </span>
          <span
            className={`font-mono text-sm font-semibold tracking-wider ${
              answeredCount === totalCount
                ? "text-emerald-400"
                : "text-washi-paper/70"
            }`}
          >
            {answeredCount}
            <span className="text-washi-paper/30 mx-1">/</span>
            {totalCount}
          </span>
        </div>
      </div>

      {/* Right: Timer & Submit */}
      <div className="flex items-center gap-5">
        {/* Timer */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-sm bg-charcoal/50 border border-washi-paper/5">
          <span
            className="material-symbols-outlined text-washi-paper/50"
            style={{
              fontVariationSettings: "'FILL' 1",
              fontSize: "1.125rem",
            }}
          >
            timer
          </span>
          <span
            className={`timer-jlpt ${isWarning ? "warning" : ""}`}
          >
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Submit button */}
        <button
          onClick={onSubmit}
          className="btn-submit-jlpt flex items-center gap-2"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "1.125rem" }}
          >
            send
          </span>
          <span>提出</span>
        </button>
      </div>
    </header>
  );
}
