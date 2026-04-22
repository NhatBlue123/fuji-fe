"use client";

import { useState } from "react";
import { Flame, Calendar, Trophy, Target, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStreakProgress } from "@/hooks/useStreakProgress";
import { StreakNotification } from "./StreakNotification";

interface StreakCardProps {
  className?: string;
  enabled?: boolean;
  hideMessage?: boolean;
}

export function StreakCard({ className, enabled = true, hideMessage = false }: StreakCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const {
    progress,
    isLoading,
    isError,
    qualified,
    almostQualified,
    progressPercent,
    remainingMinutes,
    remainingCards,
    currentStreak,
    message,
    showNotification,
    dismissNotification,
    notification,
  } = useStreakProgress({
    enabled,
    pollingInterval: 15000,
    onQualified: () => {
      console.log("User just qualified for streak!");
    },
  });

  if (isLoading && !progress) {
    return (
      <div className={cn("rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 p-5 animate-pulse", className)}>
        <div className="h-20 bg-white/10 rounded-lg" />
      </div>
    );
  }

  if (isError || !progress) {
    return (
      <div className={cn("rounded-2xl bg-gradient-to-br from-gray-500/20 to-gray-600/20 border border-gray-500/30 p-5", className)}>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Streak hiện tại</p>
            <p className="text-2xl font-bold text-white">
              0
              <span className="text-sm text-gray-400 ml-1">ngày</span>
            </p>
          </div>
        </div>
        <div className="mt-4 text-center py-2 rounded-xl text-sm font-medium bg-gray-500/20 text-gray-400">
          Đang tải streak...
        </div>
      </div>
    );
  }

  const getStreakColor = () => {
    if (currentStreak >= 30) return "from-purple-500 to-pink-500";
    if (currentStreak >= 7) return "from-orange-500 to-red-500";
    if (currentStreak >= 3) return "from-yellow-500 to-orange-500";
    return "from-gray-500 to-gray-600";
  };

  const getMessageStyle = () => {
    if (qualified) return "bg-green-500/20 text-green-400 border border-green-500/30";
    if (almostQualified) return "bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse";
    return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
  };

  return (
    <>
      <div className={cn("rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 p-5", className)}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className={cn(
                "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center",
                qualified ? "from-green-500 to-emerald-500" : getStreakColor()
              )}>
                <Flame className={cn("w-5 h-5", qualified ? "text-white animate-pulse" : "text-white")} />
              </div>
              {/* Help Icon */}
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-600 border border-slate-500 flex items-center justify-center hover:bg-slate-500 transition-colors z-50"
              >
                <HelpCircle className="w-3 h-3 text-white/70" />
              </button>
              {/* Tooltip */}
              {showTooltip && (
                <div className="absolute right-full top-0 ml-2 z-[100] w-64 p-3 rounded-xl bg-slate-800 border border-slate-600 shadow-xl">
                  <p className="text-sm font-semibold text-white mb-2">Cách đạt Streak hàng ngày</p>
                  <ul className="text-xs text-gray-300 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-0.5">•</span>
                      <span>Học thẻ ghi nhớ (flashcards) mỗi ngày</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-0.5">•</span>
                      <span>Hoàn thành bài luyện tập JLPT</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-0.5">•</span>
                      <span>Đặt lịch hẹn với giáo viên</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-0.5">•</span>
                      <span>Học các khóa học trên hệ thống</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
            <div>
              <p className="text-xs text-orange-400 font-medium">Streak hiện tại</p>
              <p className="text-2xl font-bold text-white">
                {currentStreak}
                <span className="text-sm text-orange-400 ml-1">ngày</span>
              </p>
            </div>
          </div>

          {progressPercent > 0 && progressPercent < 100 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 border border-blue-500/40">
              <Target className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-blue-400 font-medium">{progressPercent}%</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {!qualified && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Tiến độ hôm nay</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  qualified ? "bg-green-500" : almostQualified ? "bg-orange-500 animate-pulse" : "bg-blue-500"
                )}
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
            {remainingMinutes > 0 && remainingCards > 0 && (
              <p className="text-[10px] text-gray-500 mt-1 text-center">
                Cần thêm {remainingMinutes > remainingCards ? `${remainingMinutes} phút` : `${remainingCards} thẻ`}
              </p>
            )}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 rounded-xl bg-white/5">
            <Trophy className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{currentStreak}</p>
            <p className="text-[10px] text-gray-400">Kỷ lục</p>
          </div>

          <div className="text-center p-2 rounded-xl bg-white/5">
            <Calendar className="w-4 h-4 text-green-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{currentStreak}</p>
            <p className="text-[10px] text-gray-400">Tổng ngày</p>
          </div>

          <div className="text-center p-2 rounded-xl bg-white/5">
            <div className={cn(
              "w-4 h-4 mx-auto mb-1 rounded-full flex items-center justify-center",
              qualified ? "bg-green-500 animate-pulse" : "bg-gray-500"
            )}>
              {qualified && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <p className="text-lg font-bold text-white">
              {qualified ? "OK" : "0"}
            </p>
            <p className="text-[10px] text-gray-400">Hôm nay</p>
          </div>
        </div>

        {/* Message */}
        {!hideMessage && (
          <div className={cn("text-center py-2 rounded-xl text-sm font-medium", getMessageStyle())}>
            {message || (qualified ? "Tuyệt vời! Bạn đã giữ streak hôm nay!" : "Học ngay để giữ streak!")}
          </div>
        )}
      </div>

      <StreakNotification
        message={notification?.message || message}
        type={notification?.type || (qualified ? "success" : almostQualified ? "warning" : "info")}
        show={showNotification}
        onDismiss={dismissNotification}
        progressPercent={progressPercent}
        qualified={qualified}
        almostQualified={almostQualified}
      />
    </>
  );
}
