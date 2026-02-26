"use client";
import React, { useState } from "react";

interface CourseFilterProps {
  search: string;
  onSearchChange: (val: string) => void;
  activeLevel: string;
  onLevelChange: (val: string) => void;
}

export default function CourseFilter({
  search,
  onSearchChange,
  activeLevel,
  onLevelChange,
}: CourseFilterProps) {
  const levels = ["Tất cả", "N5", "N4", "N3", "N2", "N1"];
  const types = ["Đề full", "Từ vựng", "Ngữ pháp", "Đọc hiểu", "Nghe hiểu"];
  const [activeType, setActiveType] = useState("Đề full");

  return (
    <section className="relative z-10 mb-12">
      <div className="bg-slate-800/30 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-6">
        
        {/* PHẦN LỌC DROPDOWN */}
        <div className="flex items-center gap-3">
          {/* Lọc cấp độ */}
          <div className="relative">
            <select
              value={activeLevel}
              onChange={(e) => onLevelChange(e.target.value)}
              className="appearance-none h-10 pl-4 pr-10 bg-slate-800/80 text-slate-200 border border-slate-700/50 hover:bg-slate-700 rounded-full text-sm font-semibold focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all cursor-pointer shadow-sm"
            >
              {levels.map((level) => (
                <option key={level} value={level} className="bg-slate-800 text-slate-200 font-medium">
                  {level === "Tất cả" ? "Tất cả cấp độ" : level}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>

          {/* Lọc loại đề */}
          <div className="relative">
            <select
              value={activeType}
              onChange={(e) => setActiveType(e.target.value)}
              className="appearance-none h-10 pl-4 pr-10 bg-slate-800/80 text-slate-200 border border-slate-700/50 hover:bg-slate-700 rounded-full text-sm font-semibold focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all cursor-pointer shadow-sm"
            >
              {types.map((type) => (
                <option key={type} value={type} className="bg-slate-800 text-slate-200 font-medium">
                  {type}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
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
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm đề thi..."
            className="w-full h-10 bg-slate-900/50 text-white border border-slate-700/50 rounded-full pl-10 pr-4 text-sm
            focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 placeholder:text-slate-500 transition-all"
          />
        </div>
      </div>
    </section>
  );
}