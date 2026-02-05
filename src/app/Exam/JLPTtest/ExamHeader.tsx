"use client";
import React from "react";

interface HeaderProps {
  timeLeft: number;
  formatTime: (s: number) => string;
}

export default function ExamHeader({ timeLeft, formatTime }: HeaderProps) {
  return (
    <header className="h-16 shrink-0 z-50 flex items-center justify-between border-b border-border bg-surface-dark px-6 shadow-sm">
      
      
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center size-8 rounded-lg bg-[#ee2b5b]/20 text-[#ee2b5b]">
          <span 
            className="material-symbols-outlined text-xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            school
          </span>
        </div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          Đề thi thử JLPT N3 - 2024
        </h1>
      </div>
      <div className="flex items-center gap-6">
      
        <div className="flex items-center gap-2 bg-background-dark/50 px-4 py-2 rounded-lg border border-border">
          <span 
            className="material-symbols-outlined"
            style={{ 
              color: timeLeft < 300 ? '#ee2b5b' : 'var(--color-muted-foreground)',
              fontVariationSettings: "'FILL' 1"
            }}
          >
            timer
          </span>
          <span 
            className={`font-mono text-xl font-bold tracking-widest ${timeLeft < 300 ? 'animate-pulse text-[#ee2b5b]' : 'text-foreground'}`}
          >
            {formatTime(timeLeft)}
          </span>
        </div>
        <button 
          className="text-white font-bold py-2 px-6 rounded-lg transition-opacity hover:opacity-90 flex items-center gap-2 shadow-lg shadow-red-900/20"
          style={{ backgroundColor: '#ee2b5b' }}
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
          <span>Nộp bài</span>
        </button>
      </div>
    </header>   
  );
}