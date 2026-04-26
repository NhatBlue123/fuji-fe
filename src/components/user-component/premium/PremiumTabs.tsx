"use client";

import React from "react";
import { useTranslation } from "react-i18next";

interface PremiumTabsProps {
  activeTab: "premium" | "topup";
  onChangeTab: (tab: "premium" | "topup") => void;
}

export default function PremiumTabs({
  activeTab,
  onChangeTab,
}: PremiumTabsProps) {
  const { t } = useTranslation();

  const tabs = [
    { id: "premium" as const, label: t("premium.modal.tabPremium") },
    { id: "topup" as const, label: t("premium.modal.tabTopup") },
  ];

  return (
    <div className="border-b border-slate-200 dark:border-slate-800/40 flex justify-center mb-10 w-full">
      <div className="flex gap-2 rounded-[1.4rem] bg-white/90 border border-slate-200 px-2 py-2 shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:bg-[#0b1730] dark:border-slate-800/70 dark:shadow-[0_12px_30px_rgba(15,23,42,0.28)]">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className="relative group focus:outline-none"
            >
              <div
                className={`px-6 py-4 font-semibold text-lg transition-all duration-200 cursor-pointer whitespace-nowrap rounded-xl
                  ${
                    isActive
                      ? "bg-gradient-to-r from-pink-500 to-fuchsia-400 text-white shadow-[0_0_24px_rgba(236,72,153,0.35)]"
                      : "text-slate-500 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white"
                  }
                `}
              >
                {tab.label}
              </div>

              {isActive && (
                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-pink-300/80 rounded-full" />
              )}
              {!isActive && (
                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-pink-400/30 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
