"use client";

import { Flame } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useGetStreakQuery } from "@/store/services/progressApi";

interface StreakCardProps {
  className?: string;
  hideMessage?: boolean;
}

export function StreakCard({ className, hideMessage = false }: StreakCardProps) {
  const { t } = useTranslation();
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
          <p className="text-sm">{t("profile.streak.loadError")}</p>
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
      return t("profile.streak.messages.loginToday");
    }
    if (streak.streakCount === 0) {
      return t("profile.streak.messages.start");
    }
    if (streak.streakCount === 1) {
      return t("profile.streak.messages.firstDay");
    }
    if (streak.streakCount < 7) {
      return t("profile.streak.messages.underWeek", { count: streak.streakCount });
    }
    if (streak.streakCount < 30) {
      return t("profile.streak.messages.underMonth", { count: streak.streakCount });
    }
    return t("profile.streak.messages.legendary", { count: streak.streakCount });
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
              <h3 className="text-sm font-semibold text-white">{t("profile.streak.title")}</h3>
              <p className="text-xs text-white/70">{t("profile.streak.subtitle")}</p>
            </div>
          </div>
        </div>

        {/* Streak Count */}
        <div className="text-center mb-4">
          <div className="inline-flex h-28 w-28 items-center justify-center rounded-full border border-white/20 bg-white/15 shadow-inner backdrop-blur-sm mb-2">
            <div className="text-center">
              <p className="text-[11px] font-semibold text-white/85">{t("profile.streak.current")}</p>
              <p className="mt-1 flex items-baseline justify-center gap-1.5 text-white">
                <span className="text-3xl font-extrabold leading-none">{streak.streakCount}</span>
                <span className="text-sm font-semibold leading-none text-white/90">{t("profile.streak.dayUnit")}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {!hideMessage && (
          <div className="text-center">
            <p className="text-sm text-white/90 font-medium">
              {getStreakMessage()}
            </p>
            {streak.loggedInToday && (
              <p className="text-xs text-white/60 mt-1">
                {t("profile.streak.loggedToday")}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
