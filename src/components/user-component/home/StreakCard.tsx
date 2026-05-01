"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetStreakQuery } from "@/store/services/progressApi";

interface StreakCardProps {
  className?: string;
}

export function StreakCard({ className }: StreakCardProps) {
  const { data: streak, isLoading, isError } = useGetStreakQuery();

  if (isLoading) {
    return (
      <div className={cn("rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 p-5 animate-pulse", className)}>
        <div className="h-20 bg-white/10 rounded-lg" />
      </div>
    );
  }

  if (isError || !streak) {
    return (
      <div className={cn("rounded-2xl bg-gradient-to-br from-gray-500/20 to-gray-600/20 border border-gray-500/30 p-5", className)}>
        <div className="text-center text-gray-400">
          <p className="text-sm">Không thể tải streak</p>
        </div>
      </div>
    );
  }

  const getStreakColor = () => {
    if (streak.streakCount >= 30) return "from-purple-500 to-pink-500";
    if (streak.streakCount >= 7) return "from-orange-500 to-red-500";
    if (streak.streakCount >= 3) return "from-yellow-500 to-orange-500";
    return "from-gray-500 to-gray-600";
  };

  const getStreakMessage = () => {
    if (!streak.loggedInToday) {
      return "Đăng nhập hôm nay để giữ streak!";
    }
    if (streak.streakCount === 0) {
      return "Bắt đầu streak của bạn!";
    }
    if (streak.streakCount === 1) {
      return "Khởi đầu tốt! Tiếp tục nhé!";
    }
    if (streak.streakCount < 7) {
      return `${streak.streakCount} ngày liên tiếp! Tuyệt vời!`;
    }
    if (streak.streakCount < 30) {
      return `${streak.streakCount} ngày! Bạn đang làm rất tốt!`;
    }
    return `${streak.streakCount} ngày! Bạn là huyền thoại! 🏆`;
  };

  return (
    <>
      <div
        className={cn(
          "rounded-2xl bg-gradient-to-br border p-5 transition-all duration-300",
          getStreakColor(),
          "border-orange-500/30",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Streak học tập</h3>
              <p className="text-xs text-white/70">Đăng nhập liên tiếp</p>
            </div>
          </div>
        </div>

        {/* Streak Count */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm mb-2">
            <div className="text-center">
              <p className="text-xs text-orange-400 font-medium">Streak hiện tại</p>
              <p className="text-2xl font-bold text-white">
                {streak.streakCount}
                <span className="text-sm text-orange-400 ml-1">ngày</span>
              </p>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className="text-center">
          <p className="text-sm text-white/90 font-medium">
            {getStreakMessage()}
          </p>
          {streak.loggedInToday && (
            <p className="text-xs text-white/60 mt-1">
              ✓ Đã đăng nhập hôm nay
            </p>
          )}
        </div>
      </div>
    </>
  );
}
