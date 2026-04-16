"use client";

import React, { useState } from "react";
import { X, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import PremiumPricingContent from "./PremiumPricingContent";
import TopupContent from "./TopupContent";
import { cn } from "@/lib/utils";

interface TopupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * TopupModal - Refactored to use Shadcn Dialog for Portal support.
 * - Sửa lỗi Header hiển thị đè lên Modal (bằng cách dùng Portal).
 * - Đồng bộ giao diện với UserSide (Pink/Secondary).
 */
export default function TopupModal({ isOpen, onClose }: TopupModalProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"premium" | "topup">("premium");

  const tabs = [
    { id: "premium", nameKey: "premium.modal.tabPremium", icon: Sparkles },
    { id: "topup", nameKey: "premium.modal.tabTopup", icon: Zap },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[92vh] overflow-y-auto p-0 rounded-[2.5rem] border-secondary/10 shadow-2xl bg-card transition-all duration-500">
        {/* Hidden but required for accessibility */}
        <DialogHeader className="sr-only">
          <DialogTitle>{t("premium.modal.title")}</DialogTitle>
          <DialogDescription>{t("premium.modal.description")}</DialogDescription>
        </DialogHeader>

        <div className="relative p-6 md:p-10">
          {/* Tabs Navigation */}
          <div className="flex flex-col items-center mb-10">
            <div className="inline-flex bg-muted/50 p-1.5 rounded-2xl border border-border/50">
              {tabs.map((tab) => {
                const isActive = tab.id === activeTab;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as "premium" | "topup")}
                    className={cn(
                      "flex items-center gap-3 px-8 py-3.5 rounded-xl font-bold text-sm tracking-tight transition-all duration-300 relative overflow-hidden",
                      isActive
                        ? "bg-secondary text-white shadow-xl shadow-secondary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4",
                        isActive ? "animate-pulse" : "opacity-50",
                      )}
                    />
                    {t(tab.nameKey)}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-white/10"
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === "premium" && <PremiumPricingContent />}
            {activeTab === "topup" && <TopupContent />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
