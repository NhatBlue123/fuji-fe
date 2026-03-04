import React from "react";
import Link from "next/link";

export default function CourseHeader() {
  return (
    <div className="relative w-full h-[320px] flex flex-col justify-center overflow-hidden rounded-b-[2.5rem] shadow-2xl shadow-secondary/10">
      {/* Background overlay */}
      <div className="absolute inset-0 z-0 opacity-60">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1600&q=80')",
          }}
        />
      </div>
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0B1120]/80 via-[#0B1120]/50 to-transparent" />

      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-20 -mt-10 text-center md:text-left">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">
              Luyện thi{" "}
              <span className="text-secondary text-glow">JLPT</span>
            </h1>
            <p className="text-white/80 text-lg md:text-xl font-medium max-w-xl leading-relaxed">
              Đề thi mô phỏng sát kỳ thi thật. Chinh phục JLPT từ N5 đến N1.
            </p>
          </div>

          {/* Nút Lịch sử thi — góc trên phải */}
          <Link
            href="/jlpt/history"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur border border-white/20 text-white text-sm font-semibold transition-all shadow-sm shrink-0 mt-1"
          >
            <span
              className="material-symbols-outlined text-[18px] text-pink-300"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              history_edu
            </span>
            Lịch sử thi
          </Link>
        </div>
      </div>
    </div>
  );
}