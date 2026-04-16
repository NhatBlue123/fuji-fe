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
    <div className="border-b border-border flex justify-center mb-10 w-full">
      <div className="flex gap-2">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className="relative group focus:outline-none"
            >
              <div
                className={`px-6 py-4 font-semibold text-lg transition-colors duration-200 cursor-pointer whitespace-nowrap
                  ${
                    isActive
                      ? "text-secondary"
                      : "text-muted-foreground group-hover:text-foreground"
                  }
                `}
              >
                {tab.label}
              </div>

              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />
              )}
              {!isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary/30 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
