"use client";
import React from "react";

interface SidebarProps {
  currentQ: number;
  answers: Record<number, string>;
  onSelect: (n: number) => void;
}

export default function ExamSidebar({ currentQ, answers, onSelect }: SidebarProps) {
  
  const renderGrid = (start: number, end: number, title: string) => (
    <div className="mb-3">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{title}</p>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: end - start + 1 }, (_, i) => {
          const n = start + i;
          const isCurrent = currentQ === n;
          const isAnswered = !!answers[n];
          
          return (
            <button
              key={n}
              onClick={() => onSelect(n)}
              className={`aspect-square rounded flex items-center justify-center text-sm font-medium transition-all duration-200
                ${isCurrent ? 'font-bold text-white scale-105 z-10' : 'text-slate-300 hover:opacity-90'}`}
              style={{
                // 1. Logic Nền: Đã làm -> Đỏ, Chưa làm -> Xám tối (#334155)
                backgroundColor: isAnswered ? '#ee2b5b' : '#334155',
                
                // 2. Logic Viền: Đang chọn -> Viền Xanh (#3b82f6), Không chọn -> Không viền
                border: isCurrent ? '2px solid #3b82f6' : '2px solid transparent',
                
                // 3. Shadow nhẹ cho nút đã làm
                boxShadow: isAnswered ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="w-80 shrink-0 border-l border-slate-700 bg-[#1E293B] hidden xl:flex flex-col z-30 h-full">
      
      {/* Header Sidebar */}
      <div className="p-5 border-b border-slate-700 flex justify-between items-center text-white font-bold">
        <span className="flex items-center gap-2">
          <span 
            className="material-symbols-outlined text-[#ee2b5b]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            grid_view
          </span>
          Danh sách câu hỏi
        </span>
        <span className="text-xs font-mono bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
          {Object.keys(answers).length}/50
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
         {/* Chú thích màu sắc */}
         <div className="flex items-center gap-4 mb-6 text-xs text-slate-400">
           <div className="flex items-center gap-1.5"><div className="size-3 rounded-full bg-[#334155]"></div><span>Chưa làm</span></div>
           <div className="flex items-center gap-1.5"><div className="size-3 rounded-full bg-[#ee2b5b]"></div><span>Đã làm</span></div>
           <div className="flex items-center gap-1.5"><div className="size-3 rounded-full border-2 border-primary"></div><span>Hiện tại</span></div>
        </div>

        {renderGrid(1, 15, "Vocabulary (1-15)")}
        {renderGrid(16, 30, "Grammar (16-30)")}
        {renderGrid(31, 50, "Reading (31-50)")}
      </div>
       <div className="p-4 border-t border-slate-700">
        <button 
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors font-medium"
          style={{
            borderColor: '#475569',    
            backgroundColor: 'transparent', 
            color: '#cbd5e1',          
          }}
          
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#334155'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
            <span 
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              flag
            </span>
            <span>Review Flagged</span>
        </button>
        </div>
    </aside>
  );
}