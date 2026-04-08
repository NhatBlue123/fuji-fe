import React from "react";

interface TopupPackageCardProps {
  price: number;
  flowers: number;
  bonus?: number;
  isSelected?: boolean;
  isPopular?: boolean;
  onSelect: () => void;
}

export default function TopupPackageCard({
  price,
  flowers,
  bonus,
  isSelected,
  isPopular,
  onSelect,
}: TopupPackageCardProps) {
  const transferAmountVnd = price * 1000;
  const totalFlowers = flowers + (bonus ?? 0);

  return (
    <div
      onClick={onSelect}
      className={`relative bg-card rounded-2xl p-6 border transition cursor-pointer flex flex-col items-center ${
        isSelected
          ? "border-secondary border-2 shadow-lg shadow-secondary/20"
          : "border-border hover:border-secondary/50"
      }`}
    >
      <div className="text-3xl font-bold text-foreground mb-1 flex items-center gap-1">
        {totalFlowers.toLocaleString("vi-VN")}
        <span className="text-3xl">🌸</span>
      </div>

      <div className="text-sm font-semibold text-muted-foreground mb-3 text-center">
        Nạp {price.toLocaleString("vi-VN")} hoa
        <div className="text-xs mt-1">
          Chuyển khoản {transferAmountVnd.toLocaleString("vi-VN")}đ
        </div>
      </div>
      {bonus && (
        <div className="absolute -top-3 right-4 bg-green-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">
          +{bonus} Bonus
        </div>
      )}
    </div>
  );
}
