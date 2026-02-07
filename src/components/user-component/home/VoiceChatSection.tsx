"use client";

import { useState } from "react";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;

export function VoiceChatSection() {
  const [selectedLevel, setSelectedLevel] =
    useState<(typeof LEVELS)[number]>("N3");

  return (
    <section className="px-6 md:px-12 lg:px-20 mt-20 mb-16">
      <div className="relative w-full min-h-[560px] rounded-3xl overflow-hidden bg-slate-900 border border-slate-700/50 shadow-2xl flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-[#0B1120]">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-transparent to-purple-900/10"></div>
        </div>
        <div
          className="absolute top-12 left-12 w-6 h-6 bg-pink-400/20 sakura-petal animate-float"
          style={{ animationDelay: "0s" }}
        ></div>
        <div
          className="absolute bottom-24 right-16 w-5 h-5 bg-pink-400/20 sakura-petal animate-float"
          style={{ animationDelay: "1.5s" }}
        ></div>
        <div
          className="absolute top-1/4 right-1/3 w-4 h-4 bg-pink-400/10 sakura-petal animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-1/3 left-1/4 w-7 h-7 bg-pink-400/10 sakura-petal animate-float"
          style={{ animationDelay: "0.5s" }}
        ></div>
        <div className="absolute top-20 right-20 w-3 h-3 bg-pink-400/20 sakura-petal rotate-45"></div>
        <div className="relative z-10 flex flex-col items-center max-w-3xl w-full px-4 text-center">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">
              <span className="size-2 rounded-full bg-blue-500 animate-pulse"></span>
              Random Voice Chat
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2 drop-shadow-lg">
              Fuji Match - Kết nối &amp; Luyện nói
            </h2>
            <p className="text-xl text-slate-300 font-medium font-light">
              Tìm bạn luyện nói tiếng Nhật ngẫu nhiên
            </p>
          </div>
          <div className="w-full max-w-md mb-12">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">
              Chọn trình độ của bạn
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {LEVELS.map((level) => (
                <label key={level} className="cursor-pointer group">
                  <input
                    className="peer sr-only"
                    name="level"
                    type="radio"
                    checked={selectedLevel === level}
                    onChange={() => setSelectedLevel(level)}
                  />
                  <span className="block px-5 py-2 rounded-full bg-slate-800/50 border border-slate-600 text-slate-400 font-bold transition-all peer-checked:bg-blue-600 peer-checked:border-blue-500 peer-checked:text-white peer-checked:shadow-[0_0_15px_rgba(37,99,235,0.4)] group-hover:bg-slate-700">
                    {level}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <button className="group relative inline-flex items-center justify-center gap-3 bg-[#F472B6] hover:bg-pink-400 text-white text-lg font-bold px-10 py-5 rounded-2xl shadow-[0_0_30px_rgba(244,114,182,0.4)] hover:shadow-[0_0_50px_rgba(244,114,182,0.6)] transition-all transform hover:-translate-y-1">
            <span className="absolute -inset-1 rounded-2xl border border-pink-400 opacity-50 animate-ping"></span>
            <span className="material-symbols-outlined text-3xl">mic</span>
            <span>Bắt đầu ghép cặp</span>
          </button>
          <div className="mt-8 flex items-center gap-2 text-slate-500 text-sm">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>124 người đang online</span>
          </div>
        </div>
      </div>
    </section>
  );
}
