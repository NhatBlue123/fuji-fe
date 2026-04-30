"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const STAT_STYLES = {
  blue: "bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/20",
  pink: "bg-pink-500/20 text-pink-600 dark:text-pink-300 border-pink-500/20",
  emerald:
    "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/20",
  purple:
    "bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/20",
} as const;

type StatColor = keyof typeof STAT_STYLES;

interface Stat {
  icon: string;
  value: string;
  label: string;
  color: StatColor;
}

export function StatsSection() {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const STATS: Stat[] = [
    { 
      icon: "groups", 
      value: "10K+", 
      label: isMounted ? t("home.stats.students") : t("home.stats.students", { lng: 'vi' }), 
      color: "blue" 
    },
    { 
      icon: "school", 
      value: "500+", 
      label: isMounted ? t("home.stats.courses") : t("home.stats.courses", { lng: 'vi' }), 
      color: "pink" 
    },
    {
      icon: "verified",
      value: "95%",
      label: isMounted ? t("home.stats.jlptPassRate") : t("home.stats.jlptPassRate", { lng: 'vi' }),
      color: "emerald",
    },
    {
      icon: "cast_for_education",
      value: "50+",
      label: isMounted ? t("home.stats.teachers") : t("home.stats.teachers", { lng: 'vi' }),
      color: "purple",
    },
  ];

  return (
    <div className="space-y-4 px-3 sm:px-4 md:px-6 lg:px-12 xl:px-20 -mt-12 sm:-mt-14 md:-mt-16 relative z-20">
      {/* Stats Row - 4 ô nhỏ 1 hàng ngang */}
      <div className="grid grid-cols-4 gap-2 sm:gap-2.5 md:gap-3 lg:gap-4">
        {STATS.map((stat, index) => (
          <div
            key={index}
            className="glass-card p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 rounded-lg sm:rounded-xl md:rounded-2xl flex flex-col items-center text-center gap-1.5 sm:gap-2 md:gap-3 hover:bg-slate-100 hover:dark:bg-slate-800/60 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <div
              className={cn(
                "size-8 sm:size-10 md:size-11 lg:size-12 rounded-full flex items-center justify-center border shrink-0",
                STAT_STYLES[stat.color],
              )}
            >
              <span className="material-symbols-outlined text-base sm:text-lg md:text-xl lg:text-2xl">{stat.icon}</span>
            </div>
            <div>
              <p className="text-base sm:text-xl md:text-2xl lg:text-3xl font-black text-slate-800 dark:text-white leading-none">
                {stat.value}
              </p>
              <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 leading-tight">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
