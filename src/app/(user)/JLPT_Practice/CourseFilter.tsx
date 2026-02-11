"use client";
import React, { useState } from "react";

export default function CourseFilter() {
  const levels = ["Tất cả", "N5", "N4", "N3", "N2", "N1"];
  const types = ["Đề full", "Từ vựng", "Ngữ pháp", "Đọc hiểu", "Nghe hiểu"];
  const [activeLevel, setActiveLevel] = useState("Tất cả");
  const [activeType, setActiveType] = useState("Đề full");

  return (
    <section className="relative z-10 mb-12">
      <div className="bg-slate-800/30 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-6">
        
        {/*PHẦN THANH TRƯỢT*/}
        <div 
            className="flex items-center gap-4 overflow-x-auto scrollbar-hide whitespace-nowrap h-10 max-w-[550px]"
            style={{ maskImage: 'linear-gradient(to right, black 85%, transparent 100%)' }}
        >
            
          <div className="flex gap-2">
            {levels.map((level) => {
              const isActive = activeLevel === level;
              return (
                <button
                  key={level}
                  onClick={() => setActiveLevel(level)}
                  className={`
                    h-10 px-4 rounded-full text-sm font-semibold transition-all
                    ${isActive
                      ? "bg-pink-400 text-white shadow-[0_0_16px_rgba(244,114,182,0.55)]"
                      : "bg-slate-800/60 text-slate-300 border border-slate-700/50 hover:bg-slate-700"
                    }
                  `}
                >
                  {level}
                </button>
              );
            })}
          </div>

          <div className="w-px h-6 bg-white/10 shrink-0" />
          <div className="flex gap-2">
            {types.map((type) => {
              const isActive = activeType === type;

              return (
                <button
                  key={type}
                  onClick={() => setActiveType(type)} 
                  className={`
                    h-10 px-4 rounded-full text-sm font-semibold transition-all
                    ${isActive
                      ? "bg-pink-400 text-white shadow-[0_0_16px_rgba(244,114,182,0.55)]"
                      : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                    }
                  `}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/*  PHẦN TÌM KIẾM  */}
        <div className="relative flex-1 min-w-[280px] h-10 shrink-0 group">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className="material-symbols-outlined text-slate-500 text-[20px] group-focus-within:text-pink-400 transition">
              search
            </span>
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm đề thi..."
            className="w-full h-10 bg-slate-900/50 text-white border border-slate-700/50 rounded-full pl-10 pr-4 text-sm
            focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 placeholder:text-slate-500 transition-all"
          />
        </div>
      </div>
    </section>
  );
}