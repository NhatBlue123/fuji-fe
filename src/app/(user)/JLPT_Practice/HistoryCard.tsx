import React from "react";

export default function HistoryCard() {
  return (
    <article className="glass-card rounded-2xl p-5 md:p-6 col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 flex flex-col relative overflow-hidden group border-t-4 border-t-accent-pink">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent-pink/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-pink/10 rounded-lg text-accent-pink">
            <span className="material-symbols-outlined">history_edu</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Lịch sử làm bài</h3>
            <p className="text-xs text-slate-400 font-medium">Kết quả gần đây nhất</p>
          </div>
        </div>
        <button className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700">Xem tất cả</button>
      </div>
      
      {/* List item giả lập */}
      <div className="flex-1 flex flex-col gap-3 relative z-10">
        <div className="group/item flex items-center gap-4 p-3 rounded-xl bg-slate-800/40 border border-white/5 hover:bg-slate-800/80 hover:border-white/10 transition-all cursor-pointer">
          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-slate-700/50 text-slate-300 font-bold text-xs border border-white/5">
            <span className="text-sm">15</span><span className="text-[10px] uppercase opacity-60">Th10</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">145/180</span>
              <h4 className="text-sm font-bold text-white truncate">JLPT N3 - Đề 05</h4>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="material-symbols-outlined text-[12px]">schedule</span><span>140 phút</span>
              <span className="w-1 h-1 rounded-full bg-slate-600"></span><span className="text-emerald-400 font-medium">Đã Đậu</span>
            </div>
          </div>
          <div className="hidden sm:block"><span className="material-symbols-outlined text-slate-600">arrow_forward</span></div>
        </div>
      </div>
    </article>
  );
}