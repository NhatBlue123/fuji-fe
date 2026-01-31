import React from "react";
import { Mic } from "lucide-react";

const FujiMatch = () => {
  const levels = ["N5", "N4", "N3", "N2", "N1"];
  const currentLevel = "N3";

  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4 font-sans text-white">
      {/* Container chính */}
      <div className="relative w-full max-w-4xl bg-[#0f0e1c] rounded-[40px] border border-white/5 p-12 md:p-20 flex flex-col items-center overflow-hidden shadow-2xl">
        {/* Trang trí (các ô vuông nhỏ mờ) */}
        <div className="absolute top-10 left-10 w-6 h-6 bg-purple-500/10 rotate-12" />
        <div className="absolute bottom-20 right-10 w-8 h-8 bg-purple-500/10 -rotate-12" />

        {/* Tag Random Voice Chat */}
        <div className="flex items-center text-xl gap-2 px-4 py-1 bg-[#1a1b3b] border border-blue-500/30 rounded-full mb-8 mt-8">
          <span className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-xs uppercase tracking-widest font-bold text-blue-400">
            Random Voice Chat
          </span>
        </div>

        {/* Tiêu đề */}
        <h1 className="text-6xl md:text-6xl font-black mb-4 text-center tracking-tight">
          Fuji Match - Kết nối & Luyện nói
        </h1>
        <p className="text-gray-400 text-2xl mb-16 font-medium">
          Tìm bạn luyện nói tiếng Nhật ngẫu nhiên
        </p>

        {/* Chọn trình độ */}
        <div className="w-full max-w-md flex flex-col items-center gap-6 mb-12 mt-4">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-4">
            Chọn trình độ của bạn
          </span>
          <div className="flex flex-wrap justify-center gap-3">
            {levels.map((level) => (
              <button
                key={level}
                className={`w-11 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  currentLevel === level
                    ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)] scale-110"
                    : "bg-[#1a1b3b] text-gray-400 hover:bg-[#25264d]"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Button Bắt đầu */}
        <div className="relative group">
          {/* Border bao quanh mờ */}
          <div className="absolute -inset-8 border border-white/5 rounded-[30px] pointer-events-none" />

          <button className="relative flex items-center gap-3 px-10 py-5 bg-amber-100 from-[#ff7eb3] to-[#ff758c] rounded-2xl font-bold text-xl hover:scale-105 transition-transform shadow-[0_10px_40px_rgba(255,117,140,0.4)] active:scale-95">
            <Mic className="w-8 h-8 fill-white" />
            Bắt đầu ghép cặp
          </button>
         
        </div>

        {/* Online Status */}
        <div className="mt-12 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="text-gray-500 text-sm font-medium">
            124 người đang online
          </span>
        </div>
      </div>
    </div>
  );
};

export default FujiMatch;
