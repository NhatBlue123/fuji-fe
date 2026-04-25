"use client";

import { useGetWeeklyStatsQuery, useGetWeeklySummaryQuery } from "@/store/services/progressApi";
import { TrendingUp, TrendingDown, Clock, BookOpen, Target, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressChartProps {
  className?: string;
}

export function ProgressChart({ className }: ProgressChartProps) {
  const { data: weeklyStats, isLoading: statsLoading } = useGetWeeklyStatsQuery();
  const { data: summary, isLoading: summaryLoading } = useGetWeeklySummaryQuery();

  const isLoading = statsLoading || summaryLoading;

  if (isLoading) {
    return (
      <div className={cn("rounded-2xl bg-[#1a1d27] border border-white/10 p-5", className)}>
        <div className="h-6 w-32 bg-white/10 rounded mb-4 animate-pulse" />
        <div className="h-40 bg-white/5 rounded-lg animate-pulse" />
      </div>
    );
  }

  const chartData = weeklyStats || [];
  const maxValue = Math.max(
    ...chartData.map(d => Math.max(d.cardsReviewed, d.lessonsCompleted * 5, d.totalStudyTime / 2)),
    1
  );

  const getBarHeight = (value: number) => {
    return `${(value / maxValue) * 100}%`;
  };

  const formatDay = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[date.getDay()];
  };

  const progressTrend = summary?.progressComparedToLastWeek ?? 0;
  const isPositiveTrend = progressTrend >= 0;

  return (
    <div className={cn("rounded-2xl bg-[#1a1d27] border border-white/10 p-5", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Tiến bộ tuần này</h3>
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
          isPositiveTrend ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
        )}>
          {isPositiveTrend ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {Math.abs(progressTrend).toFixed(0)}%
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-40 flex items-end gap-2 mb-4">
        {Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - 6 + i);
          const dateStr = date.toISOString().split('T')[0];
          const dayData = chartData.find(d => d.date?.startsWith(dateStr));

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full h-full flex flex-col justify-end">
                <div
                  className="w-full bg-gradient-to-t from-purple-500/50 to-purple-500/20 rounded-t-sm transition-all duration-300 hover:from-purple-500/70 hover:to-purple-500/40 min-h-[4px]"
                  style={{ height: dayData ? getBarHeight(Math.max(dayData.cardsReviewed, dayData.lessonsCompleted * 5, dayData.totalStudyTime / 2)) : '4px' }}
                />
              </div>
              <span className="text-[10px] text-gray-500">{formatDay(dateStr)}</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mb-4 text-[10px] text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-purple-500" />
          <span>Hoạt động</span>
        </div>
      </div>

      {/* AI Insight Message */}
      {summary?.encouragingMessage && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-3 mb-4">
          <div className="flex items-start gap-2">
            <Brain className="w-4 h-4 text-blue-400 mt-0.5" />
            <p className="text-xs text-gray-300 leading-relaxed">{summary.encouragingMessage}</p>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
          <Clock className="w-4 h-4 text-blue-400" />
          <div>
            <p className="text-lg font-bold text-white">{summary?.totalStudyMinutes ?? 0}</p>
            <p className="text-[10px] text-gray-400">Phút học</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
          <BookOpen className="w-4 h-4 text-green-400" />
          <div>
            <p className="text-lg font-bold text-white">{summary?.totalCardsReviewed ?? 0}</p>
            <p className="text-[10px] text-gray-400">Thẻ học</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
          <Target className="w-4 h-4 text-yellow-400" />
          <div>
            <p className="text-lg font-bold text-white">{summary?.averageCorrectRate?.toFixed(0) ?? 0}%</p>
            <p className="text-[10px] text-gray-400">Đúng</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
          <div className="w-4 h-4 flex items-center justify-center rounded-full bg-pink-500/20">
            <span className="text-pink-400 text-[10px] font-bold">{summary?.daysStudied ?? 0}</span>
          </div>
          <div>
            <p className="text-lg font-bold text-white">{summary?.daysStudied ?? 0}/7</p>
            <p className="text-[10px] text-gray-400">Ngày học</p>
          </div>
        </div>
      </div>
    </div>
  );
}
