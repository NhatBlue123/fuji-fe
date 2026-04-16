import React from "react";

interface TopupPackageCardProps {
  price: number;
  flowers: number;
  isSelected?: boolean;
  isPopular?: boolean;
  onSelect: () => void;
}

export default function TopupPackageCard({
  price,
  flowers,
  isSelected,
  isPopular,
  onSelect,
}: TopupPackageCardProps) {
  const transferAmountVnd = price * 1000;

  return (
    <div
      onClick={onSelect}
      className={`relative bg-white dark:bg-card rounded-2xl p-6 border transition cursor-pointer flex flex-col items-center shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:shadow-none ${
        isSelected
          ? "border-pink-500 border-2 shadow-lg shadow-pink-500/20 dark:border-secondary dark:shadow-secondary/20"
          : "border-slate-200 dark:border-border hover:border-secondary/50"
      }`}
    >
      <div className="text-3xl font-bold text-slate-900 dark:text-foreground mb-1 flex items-center gap-1">
        {flowers.toLocaleString("vi-VN")}
        <span className="text-3xl">🌸</span>
      </div>

      <div className="text-sm font-semibold text-slate-600 dark:text-muted-foreground mb-3 text-center">
        Nạp {price.toLocaleString("vi-VN")} hoa
        <div className="text-xs mt-1">
          Chuyển khoản {transferAmountVnd.toLocaleString("vi-VN")}đ
        </div>
      </div>
    </div>
  );
}
