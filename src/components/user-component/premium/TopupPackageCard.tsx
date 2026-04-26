import React from "react";
import { Sparkles } from "lucide-react";

interface TopupPackageCardProps {
  price: number;
  flowers: number;
  bonusFlowers?: number;
  isSelected?: boolean;
  isPopular?: boolean;
  onSelect: () => void;
}

export default function TopupPackageCard({
  price,
  flowers,
  bonusFlowers = 0,
  isSelected,
  isPopular,
  onSelect,
}: TopupPackageCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`relative flex cursor-pointer flex-col items-center rounded-2xl border bg-white p-6 text-center shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition dark:bg-[#12284a] dark:shadow-none ${
        isSelected
          ? "border-pink-500 border-2 shadow-lg shadow-pink-500/20 dark:border-secondary dark:shadow-secondary/20"
          : "border-slate-200 hover:border-secondary/50 dark:border-border"
      }`}
    >
      {isPopular && (
        <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-pink-100 px-2.5 py-1 text-[11px] font-bold text-pink-600 dark:bg-secondary/15 dark:text-secondary">
          <Sparkles className="h-3.5 w-3.5" /> Popular
        </div>
      )}

      <div className="mb-1 flex items-center gap-1 text-3xl font-bold text-slate-900 dark:text-foreground">
        {flowers.toLocaleString("vi-VN")}
        <span className="text-3xl">🌸</span>
      </div>

      <div className="mb-3 text-center text-sm font-semibold text-slate-600 dark:text-muted-foreground">
        Nạp {flowers.toLocaleString("vi-VN")} hoa
        <div className="mt-1 text-xs">
          Chuyển khoản {price.toLocaleString("vi-VN")}d
        </div>
      </div>

      {bonusFlowers > 0 && (
        <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
          Tặng thêm {bonusFlowers.toLocaleString("vi-VN")} hoa
        </div>
      )}
    </div>
  );
}
