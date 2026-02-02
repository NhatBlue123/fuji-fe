// src/app/(exam)/JLPTtest/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import ExamHeader from "./ExamHeader";
import ExamSidebar from "./ExamSidebar";
import ExamContent from "./ExamContent";

export default function JLPTtestPage() {
  const [currentQuestion, setCurrentQuestion] = useState(24);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(90 * 60);

  // ===== TIMER =====
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  
  const DOT_SIZE = 8;     
  const GAP_SIZE = 16;   
  const STEP = DOT_SIZE + GAP_SIZE; 
  

  return (
    <div 
      className="h-screen flex flex-col overflow-hidden font-sans text-white"
      style={{ backgroundColor: '#0B1120' }}
    >
      <ExamHeader timeLeft={timeLeft} formatTime={formatTime} />

      <main className="flex flex-1 overflow-hidden">
        
        <div className="flex-1 flex flex-col min-w-0">
          
          <div className="flex-1 overflow-y-auto">
            <ExamContent
              currentQ={currentQuestion}
              selectedAnswer={answers[currentQuestion]}
              onSelectOption={(opt) =>
                setAnswers((prev) => ({ ...prev, [currentQuestion]: opt }))
              }
            />
          </div>

        
          <div 
            className="h-20 shrink-0 px-6 md:px-10 flex items-center justify-between z-20"
            style={{ 
              backgroundColor: '#161e31', 
              borderTop: '1px solid #334155' 
            }}
          >
            
            <button
              onClick={() => setCurrentQuestion((q) => Math.max(1, q - 1))}
              disabled={currentQuestion === 1}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg transition font-medium disabled:opacity-50 hover:bg-slate-700"
              style={{ border: '1px solid #475569', color: '#cbd5e1' }}
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span>Câu trước</span>
            </button>

           
            <div 
              className="flex items-center justify-center relative overflow-hidden h-10"
              style={{ width: '120px' }} 
            >
               <div className="absolute inset-y-0 left-0 w-8 z-10" style={{ background: 'linear-gradient(to right, #161e31, transparent)' }}></div>
               <div className="absolute inset-y-0 right-0 w-8 z-10" style={{ background: 'linear-gradient(to left, #161e31, transparent)' }}></div>

               <div 
                  className="flex items-center absolute transition-transform duration-300 ease-out will-change-transform"
                  style={{
                    gap: '14px', 
                    left: '50%', 
                    transform: `translateX(calc( -1 * ( ${(currentQuestion - 1) * 22}px + 4px ) ))`
                  }}
               >
                  {Array.from({ length: 50 }).map((_, index) => {
                    const qNum = index + 1;
                    const isActive = qNum === currentQuestion;
                    const distance = Math.abs(currentQuestion - qNum);
                    let opacity = 0.2;
                    if (distance === 0) opacity = 1;
                    else if (distance === 1) opacity = 0.5;
                    else if (distance > 4) opacity = 0;

                    return (
                      <div
                        key={qNum}
                        className={`rounded-full transition-all duration-300`}
                        style={{
                          width: '8px',
                          height: '8px',
                          transform: isActive ? 'scale(1.5)' : 'scale(1)',
                          backgroundColor: isActive ? '#ffffff' : '#94a3b8',
                          opacity: opacity,
                          flexShrink: 0
                        }}
                      />
                    );
                  })}
               </div>
            </div>

        
            <button
              onClick={() => setCurrentQuestion((q) => Math.min(50, q + 1))}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold shadow transition hover:brightness-90 active:scale-95"
              style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            >
              <span>Câu tiếp theo</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </div>

        <ExamSidebar
          currentQ={currentQuestion}
          answers={answers}
          onSelect={setCurrentQuestion}
        />
      </main>
    </div>
  );
}