"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export function LearningPathSection() {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <section className="px-6 md:px-12 lg:px-20 mt-20">
      <div className="mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white tracking-tight flex items-center gap-3">
            <span className="material-symbols-outlined text-blue-500">
              timeline
            </span>
            {isMounted ? t("home.learningPath.title") : t("home.learningPath.title", { lng: 'vi' })}
          </h2>
          <p className="text-muted-foreground dark:text-slate-400 mt-2">
            {isMounted ? t("home.learningPath.subtitle", { goal: "JLPT N3 12/2024" }) : t("home.learningPath.subtitle", { goal: "JLPT N3 12/2024", lng: 'vi' })}
          </p>
        </div>
        <div className="bg-card dark:bg-[#1E293B] border border-border dark:border-slate-700/50 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-4 z-10">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-muted dark:bg-slate-700 -z-10 transform -translate-y-1/2 rounded-full"></div>
            <div
              className="hidden md:block absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400 -z-10 transform -translate-y-1/2 rounded-full shadow-[0_0_15px_#3b82f6]"
              style={{ width: "40%" }}
            ></div>
            {/* Step 1 */}
            <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2 w-full md:w-auto">
              <div className="relative">
                <div className="size-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/50 z-20">
                  <span className="material-symbols-outlined text-sm">check</span>
                </div>
                <div className="md:hidden absolute top-10 left-1/2 w-0.5 h-full bg-blue-600 -ml-[1px]"></div>
              </div>
              <div className="text-left md:text-center">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-1">
                  {isMounted ? t("home.learningPath.completed") : t("home.learningPath.completed", { lng: 'vi' })}
                </p>
                <p className="text-foreground dark:text-white font-bold text-sm">
                  Bảng chữ cái &amp; Chào hỏi
                </p>
              </div>
            </div>
            {/* Step 2 */}
            <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2 w-full md:w-auto">
              <div className="relative">
                <div className="size-12 rounded-full bg-background dark:bg-[#1E293B] border-4 border-blue-500 flex items-center justify-center text-blue-500 dark:text-blue-400 shadow-[0_0_20px_#3b82f6] z-20">
                  <span className="material-symbols-outlined">play_arrow</span>
                </div>
                <div className="md:hidden absolute top-12 left-1/2 w-0.5 h-full bg-muted dark:bg-slate-700 -ml-[1px]"></div>
              </div>
              <div className="text-left md:text-center">
                <p className="text-xs text-secondary font-bold uppercase tracking-wider mb-1 animate-pulse">
                  {isMounted ? t("home.learningPath.learning") : t("home.learningPath.learning", { lng: 'vi' })}
                </p>
                <p className="text-foreground dark:text-white font-bold text-lg">
                  Ngữ pháp N5 - Bài 12
                </p>
                <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">
                  {isMounted ? t("home.learningPath.deadlineToday") : t("home.learningPath.deadlineToday", { lng: 'vi' })}
                </p>
              </div>
            </div>
            {/* Step 3 */}
            <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2 w-full md:w-auto opacity-60">
              <div className="relative">
                <div className="size-10 rounded-full bg-muted dark:bg-slate-800 border-2 border-border dark:border-slate-600 flex items-center justify-center text-muted-foreground dark:text-slate-400 z-20">
                  <span className="text-xs font-bold">3</span>
                </div>
                <div className="md:hidden absolute top-10 left-1/2 w-0.5 h-full bg-muted dark:bg-slate-700 -ml-[1px]"></div>
              </div>
              <div className="text-left md:text-center">
                <p className="text-xs text-muted-foreground dark:text-slate-500 font-bold uppercase tracking-wider mb-1">
                  {isMounted ? t("home.learningPath.next") : t("home.learningPath.next", { lng: 'vi' })}
                </p>
                <p className="text-foreground dark:text-slate-200 font-medium text-sm">
                  Kanji N5: Số đếm
                </p>
              </div>
            </div>
            {/* Step 4 */}
            <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2 w-full md:w-auto opacity-40">
              <div className="size-10 rounded-full bg-muted dark:bg-slate-800 border-2 border-border dark:border-slate-600 flex items-center justify-center text-muted-foreground dark:text-slate-400 z-20">
                <span className="text-xs font-bold">4</span>
              </div>
              <div className="text-left md:text-center">
                <p className="text-xs text-muted-foreground dark:text-slate-500 font-bold uppercase tracking-wider mb-1">
                  {isMounted ? t("home.learningPath.upcoming") : t("home.learningPath.upcoming", { lng: 'vi' })}
                </p>
                <p className="text-foreground dark:text-slate-200 font-medium text-sm">
                  Hội thoại tại nhà hàng
                </p>
              </div>
            </div>

        </div>
      </div>
    </section>
  );
}
