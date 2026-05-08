import React from "react";
import { CheckCircle2, Gift, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const VND_PER_FLOWER = 1000;

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
  const { t } = useTranslation();
  const transferAmountVnd = price * VND_PER_FLOWER;
  const totalFlowers = flowers + bonusFlowers;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex min-h-[210px] w-full flex-col rounded-2xl border bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-secondary/35 dark:bg-[#0B1120]/80",
        isSelected
          ? "border-secondary shadow-secondary/15 ring-2 ring-secondary/20"
          : "border-border hover:border-secondary/45",
        isPopular && "pt-12",
      )}
    >
      {isPopular && (
        <div className="absolute left-5 top-5 inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-bold text-secondary">
          <Sparkles className="h-3.5 w-3.5" />
          {t("monetization.terms.popular")}
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-muted-foreground">
            {t("premium.topup.packageBase")}
          </p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-4xl font-black text-foreground">
              {flowers.toLocaleString("vi-VN")}
            </span>
            <span className="pb-1 text-2xl">🌸</span>
          </div>
        </div>

        <div
          className={cn(
            "grid size-9 place-items-center rounded-full border transition",
            isSelected
              ? "border-secondary bg-secondary text-secondary-foreground"
              : "border-border bg-muted text-muted-foreground group-hover:border-secondary/40 group-hover:text-secondary",
          )}
        >
          <CheckCircle2 className="size-5" />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-sm">
          <span className="font-medium text-muted-foreground">
            {t("premium.topup.transferAmount")}
          </span>
          <strong className="text-foreground">
            {transferAmountVnd.toLocaleString("vi-VN")}đ
          </strong>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-secondary/5 px-3 py-2 text-sm">
          <span className="font-medium text-muted-foreground">
            {t("premium.topup.totalReceive")}
          </span>
          <strong className="text-secondary">
            {totalFlowers.toLocaleString("vi-VN")} 🌸
          </strong>
        </div>
      </div>

      {bonusFlowers > 0 && (
        <div className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <Gift className="size-3.5" />
          {t("premium.topup.bonusFlowers", {
            count: bonusFlowers.toLocaleString("vi-VN"),
          })}
        </div>
      )}
    </button>
  );
}
