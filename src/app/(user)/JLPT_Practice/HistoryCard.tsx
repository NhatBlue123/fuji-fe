import React from "react";
import { TestAttemptResult } from "@/types/jlpt";
import Link from "next/link";

interface HistoryCardProps {
  attempts: TestAttemptResult[];
}

export default function HistoryCard({ attempts }: HistoryCardProps) {
  if (!attempts || attempts.length === 0) return null;

  // Show only top 3 recent attempts
  const recentAttempts = attempts.slice(0, 3);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return { day, month };
  };

  return (
    <article className="glass-card rounded-2xl p-5 md:p-6 col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 flex flex-col relative overflow-hidden group border-t-4 border-t-pink-500">
      <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500">
            <span className="material-symbols-outlined">history_edu</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Lịch sử làm bài</h3>
            <p className="text-xs text-slate-400 font-medium">Kết quả gần đây nhất</p>
          </div>
        </div>
        {attempts.length > 3 && (
          <button className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700">
            Xem tất cả
          </button>
        )}
      </div>
      
      <div className="flex-1 flex flex-col gap-3 relative z-10">
        {recentAttempts.map((attempt) => {
          const { day, month } = formatDate(attempt.startedAt);
          const durationMinutes = Math.floor(attempt.timeSpent / 60);

          return (
            <Link 
              key={attempt.id} 
              href={`/jlpt/result?attemptId=${attempt.id}`}
              className="group/item flex items-center gap-4 p-3 rounded-xl bg-slate-800/40 border border-white/5 hover:bg-slate-800/80 hover:border-white/10 transition-all cursor-pointer"
            >
              <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-slate-700/50 text-slate-300 font-bold text-xs border border-white/5">
                <span className="text-sm">{day}</span>
                <span className="text-[10px] uppercase opacity-60">Th{month}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                    attempt.isPassed 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}>
                    {attempt.totalScore}/{attempt.test?.maxScore || 180}
                  </span>
                  <h4 className="text-sm font-bold text-white truncate">{attempt.test?.title || `Bài thi #${attempt.testId}`}</h4>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="material-symbols-outlined text-[12px]">schedule</span>
                  <span>{durationMinutes} phút</span>
                  <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                  <span className={`font-medium ${attempt.isPassed ? "text-emerald-400" : "text-red-400"}`}>
                    {attempt.isPassed ? "Đã Đậu" : "Chưa Đậu"}
                  </span>
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="material-symbols-outlined text-slate-600 group-hover/item:text-white transition-colors">arrow_forward</span>
              </div>
            </Link>
          );
        })}
      </div>
    </article>
  );
}