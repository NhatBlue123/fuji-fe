"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useGetStreakQuery, useGetWeeklyStatsQuery, useGetWeeklySummaryQuery, useGetTodayStatsQuery } from "@/store/services/progressApi";
import { cn } from "@/lib/utils";
import {
  Flame,
  Clock,
  BookOpen,
  Target,
  Brain,
  TrendingUp,
  TrendingDown,
  Calendar,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: streak, isLoading: streakLoading } = useGetStreakQuery(undefined, { skip: !mounted });
  const { data: weeklyStats, isLoading: statsLoading } = useGetWeeklyStatsQuery(undefined, { skip: !mounted });
  const { data: summary, isLoading: summaryLoading } = useGetWeeklySummaryQuery(undefined, { skip: !mounted });
  const { data: todayStats } = useGetTodayStatsQuery(undefined, { skip: !mounted });

  const isLoading = streakLoading || statsLoading || summaryLoading;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    return date.toISOString().split("T")[0];
  });

  const getDayData = (dateStr: string) => {
    return weeklyStats?.find((d) => d.date?.startsWith(dateStr));
  };

  const maxValue = Math.max(
    ...(weeklyStats || []).map((d) => Math.max(d.cardsReviewed, d.lessonsCompleted * 5, d.totalStudyTime / 2)),
    1
  );

  const formatDay = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return days[date.getDay()];
  };

  const progressTrend = summary?.progressComparedToLastWeek ?? 0;
  const isPositiveTrend = progressTrend >= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 px-4 md:px-8 lg:px-12 py-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            Dashboard
          </h1>
          <p className="text-slate-400">Theo dõi tiến bộ học tập của bạn</p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-slate-800/50 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Section 1: Streak Card */}
            <motion.div variants={fadeUp}>
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Streak</h2>
                    <p className="text-sm text-slate-400">Ngày học liên tiếp</p>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-400 to-rose-400 mb-2">
                    {streak?.currentStreak ?? 0}
                  </div>
                  <p className="text-lg text-slate-300">ngày liên tiếp</p>
                  {streak && streak.studiedToday && (
                    <div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Hôm nay đã học!
                    </div>
                  )}
                </div>

                {/* Last 7 days calendar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500 font-medium">7 ngày gần nhất</span>
                    <Award className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="flex gap-2">
                    {last7Days.map((dateStr, i) => {
                      const dayData = getDayData(dateStr);
                      const hasActivity = dayData && dayData.totalStudyTime > 0;
                      const isToday = i === 6;
                      return (
                        <div key={dateStr} className="flex-1 text-center">
                          <div className={cn(
                            "w-full aspect-square rounded-xl flex items-center justify-center mb-1 transition-all",
                            hasActivity
                              ? "bg-gradient-to-br from-orange-500 to-pink-500 shadow-lg shadow-orange-500/25"
                              : "bg-slate-700/50",
                            isToday && "ring-2 ring-pink-400 ring-offset-2 ring-offset-slate-900"
                          )}>
                            {hasActivity && <Flame className="w-4 h-4 text-white" />}
                          </div>
                          <span className={cn(
                            "text-[10px] font-medium",
                            isToday ? "text-pink-400" : "text-slate-500"
                          )}>
                            {formatDay(dateStr)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Kỷ lục cá nhân</span>
                    <span className="text-yellow-400 font-bold flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {streak?.longestStreak ?? 0} ngày
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Section 2: Weekly Progress Chart */}
            <motion.div variants={fadeUp}>
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Tiến bộ tuần này</h2>
                      <p className="text-sm text-slate-400">Thống kê hoạt động</p>
                    </div>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                    isPositiveTrend
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-red-500/20 text-red-400"
                  )}>
                    {isPositiveTrend ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {Math.abs(progressTrend).toFixed(0)}%
                  </div>
                </div>

                {/* Chart Area */}
                <div className="h-48 flex items-end gap-3 mb-6">
                  {last7Days.map((dateStr, i) => {
                    const dayData = getDayData(dateStr);
                    const value = dayData
                      ? Math.max(dayData.cardsReviewed, dayData.lessonsCompleted * 5, dayData.totalStudyTime / 2)
                      : 0;
                    const height = (value / maxValue) * 100;

                    return (
                      <div key={dateStr} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full h-full flex flex-col justify-end">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(height, 5)}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            className="w-full bg-gradient-to-t from-blue-500/70 to-cyan-500/30 rounded-t-lg transition-all hover:from-blue-500/90 hover:to-cyan-500/50"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">{formatDay(dateStr)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gradient-to-br from-blue-500 to-cyan-500" />
                    <span>Hoạt động</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Section 3: Daily Stats Summary */}
            <motion.div variants={fadeUp}>
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Hôm nay</h2>
                    <p className="text-sm text-slate-400">Thống kê trong ngày</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 rounded-2xl p-4 text-center">
                    <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-black text-white">
                      {todayStats?.totalStudyTime ?? summary?.totalStudyMinutes ?? 0}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Phút học</p>
                  </div>

                  <div className="bg-slate-900/50 rounded-2xl p-4 text-center">
                    <BookOpen className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                    <div className="text-2xl font-black text-white">
                      {todayStats?.cardsReviewed ?? summary?.totalCardsReviewed ?? 0}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Flashcards</p>
                  </div>

                  <div className="bg-slate-900/50 rounded-2xl p-4 text-center">
                    <Target className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                    <div className="text-2xl font-black text-white">
                      {todayStats?.lessonsCompleted ?? summary?.totalLessonsCompleted ?? 0}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Bài học</p>
                  </div>

                  <div className="bg-slate-900/50 rounded-2xl p-4 text-center">
                    <Award className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                    <div className="text-2xl font-black text-white">
                      {((todayStats?.correctRate ?? summary?.averageCorrectRate) ?? 0).toFixed(0)}%
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Độ chính xác</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Section 4: Learning Insight */}
            <motion.div variants={fadeUp}>
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">AI Insights</h2>
                    <p className="text-sm text-slate-400">Góc nhìn từ FUJI AI</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl p-5 border border-cyan-500/20 mb-6">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-200 leading-relaxed">
                      {summary?.encouragingMessage || "Tiếp tục cố gắng! Mỗi ngày học tập đều đưa bạn đến gần hơn với mục tiêu của mình."}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-white">{summary?.daysStudied ?? 0}/7</div>
                    <p className="text-[10px] text-slate-400">Ngày học trong tuần</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-white">
                      {isPositiveTrend ? "+" : ""}{progressTrend.toFixed(0)}%
                    </div>
                    <p className="text-[10px] text-slate-400">So với tuần trước</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Section 5: Quick Actions */}
            <motion.div variants={fadeUp} className="lg:col-span-2">
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6">
                <h2 className="text-xl font-bold text-white mb-4">Hành động nhanh</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link
                    href="/course"
                    className="group bg-slate-900/50 hover:bg-blue-500/20 border border-slate-700/50 hover:border-blue-500/30 rounded-2xl p-4 text-center transition-all hover:-translate-y-1"
                  >
                    <BookOpen className="w-8 h-8 text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-bold text-white">Học bài mới</p>
                    <p className="text-xs text-slate-400 mt-1">Khám phá khóa học</p>
                  </Link>

                  <Link
                    href="/flashcards"
                    className="group bg-slate-900/50 hover:bg-pink-500/20 border border-slate-700/50 hover:border-pink-500/30 rounded-2xl p-4 text-center transition-all hover:-translate-y-1"
                  >
                    <Target className="w-8 h-8 text-pink-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-bold text-white">Flashcards</p>
                    <p className="text-xs text-slate-400 mt-1">Luyện từ vựng</p>
                  </Link>

                  <Link
                    href="/JLPT_Practice"
                    className="group bg-slate-900/50 hover:bg-emerald-500/20 border border-slate-700/50 hover:border-emerald-500/30 rounded-2xl p-4 text-center transition-all hover:-translate-y-1"
                  >
                    <Award className="w-8 h-8 text-emerald-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-bold text-white">Luyện JLPT</p>
                    <p className="text-xs text-slate-400 mt-1">Thi thử N5-N1</p>
                  </Link>

                  <Link
                    href="/ai-chat"
                    className="group bg-slate-900/50 hover:bg-cyan-500/20 border border-slate-700/50 hover:border-cyan-500/30 rounded-2xl p-4 text-center transition-all hover:-translate-y-1"
                  >
                    <Brain className="w-8 h-8 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-bold text-white">AI Chat</p>
                    <p className="text-xs text-slate-400 mt-1">Trò chuyện với AI</p>
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
