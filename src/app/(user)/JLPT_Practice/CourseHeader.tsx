import React from "react";

export default function CourseHeader() {
  return (
    <header className="relative z-10 mb-8">
      <div className="absolute top-0 right-0 w-2/3 h-1/2 bg-blue-900/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-pink-900/10 blur-[120px] rounded-full pointer-events-none"></div>

      <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
        Danh sách bài thi JLPT
      </h1>
      <p className="text-slate-400 text-lg">
        Luyện thi JLPT với đề thi mô phỏng sát kỳ thi thật
      </p>
    </header>
  );
}