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
  const formattedPrice = price.toLocaleString("vi-VN");

  return (
    <div
      onClick={onSelect}
      className={`relative bg-card rounded-2xl p-6 border transition cursor-pointer flex flex-col items-center ${
        isSelected
          ? "border-secondary border-2 shadow-lg shadow-secondary/20"
          : "border-border hover:border-secondary/50"
      }`}
    >
      <div className="text-3xl font-bold text-foreground mb-1">
        {formattedPrice}đ
      </div>

      <div className="flex items-center text-xl font-semibold text-foreground mb-3 ml-5">
        <span className="text-3xl text-secondary">{flowers}</span>
        <span className="text-3xl ">🌸</span>
      </div>
      {bonus && (
        <div className="absolute -top-3 right-4 bg-green-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">
          +{bonus} Bonus
        </div>
      )}
    </div>
  );
}
