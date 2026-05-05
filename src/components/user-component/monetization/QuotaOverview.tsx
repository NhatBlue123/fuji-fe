"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ImagePlus, Loader2, Sparkles, Ticket, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMyMonetizationSummary } from "@/hooks/useMyMonetizationSummary";
import { useGetWalletQuery } from "@/store/services/walletApi";
import {
  useGetActiveFlashcardImagePacksQuery,
  usePurchaseFlashcardImagePackMutation,
  type FlashcardImagePack,
} from "@/store/services/userMonetizationApi";
import { cn } from "@/lib/utils";

function indicatorClass(status: "normal" | "warning" | "empty") {
  if (status === "empty") return "bg-red-500";
  if (status === "warning") return "bg-amber-500";
  return "bg-secondary";
}

function textClass(status: "normal" | "warning" | "empty") {
  if (status === "empty") return "text-red-500";
  if (status === "warning") return "text-amber-600 dark:text-amber-400";
  return "text-foreground";
}

export function QuotaOverview({ compact = false }: { compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const [packDialogOpen, setPackDialogOpen] = useState(false);
  const summary = useMyMonetizationSummary();
  const { data: wallet } = useGetWalletQuery();
  const { data: imagePacks = [], isFetching: isFetchingImagePacks } =
    useGetActiveFlashcardImagePacksQuery(undefined, {
      skip: !packDialogOpen,
    });
  const [purchaseImagePack, { isLoading: isPurchasingImagePack }] =
    usePurchaseFlashcardImagePackMutation();
  const currentPackage =
    summary.package?.packageName || summary.package?.packageCode || "BASIC";
  const expiresAt = summary.package?.expiresAt
    ? new Date(summary.package.expiresAt)
    : null;
  const canBuyImagePack = summary.flashcardQuota?.packEnabled !== false;
  const locale =
    i18n.language === "vi" ? "vi-VN" : i18n.language === "ja" ? "ja-JP" : "en-US";

  const handlePurchaseImagePack = async (pack: FlashcardImagePack) => {
    const availableHoa = Number(wallet?.balance ?? 0);
    if (wallet && availableHoa < Number(pack.priceHoa ?? 0)) {
      toast.error(t("monetization.messages.walletNotEnough"));
      return;
    }

    try {
      await purchaseImagePack(pack.id).unwrap();
      toast.success(t("monetization.messages.buyImageBundleSuccess"));
      summary.refetchAll();
      setPackDialogOpen(false);
    } catch {
      toast.error(t("monetization.messages.buyImageBundleFailed"));
    }
  };

  return (
    <>
      <Card className="rounded-[2rem] border-muted/60 bg-white/70 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/5 dark:bg-[#0B1120]/70">
        <CardHeader className={cn("border-b border-border/60", compact && "pb-4")}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                {t("monetization.terms.packageAndUsage")}
              </p>
              <CardTitle className="mt-1 text-2xl font-black uppercase tracking-tight">
                {currentPackage}
              </CardTitle>
              {expiresAt && (
                <p className="mt-1 text-xs font-bold text-muted-foreground">
                  {t("monetization.terms.expiresAt")}{" "}
                  {expiresAt.toLocaleDateString(locale)}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" className="rounded-xl">
                <Link href="/packages">
                  <Sparkles className="mr-2 size-4" />
                  {t("monetization.actions.managePackage")}
                </Link>
              </Button>
              {canBuyImagePack && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setPackDialogOpen(true)}
                >
                  <ImagePlus className="mr-2 size-4" />
                  {t("monetization.actions.buyImageBundle")}
                </Button>
              )}
              <Button asChild size="sm" variant="outline" className="rounded-xl">
                <Link href="/profile/coupons">
                  <Ticket className="mr-2 size-4" />
                  {t("monetization.actions.openDiscountWallet")}
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className={cn("space-y-5", compact ? "p-5" : "p-7")}>
          {summary.hasError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="size-4" />
              {t("monetization.messages.quotaLoadFailed")}
            </div>
          )}

          {summary.quotaLines.length === 0 && !summary.hasError ? (
            <div className="grid gap-3 md:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-24 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {summary.quotaLines.map((line) => (
                <div
                  key={line.featureKey}
                  className="rounded-2xl border border-border/70 bg-card/70 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-foreground">
                        {line.label}
                      </p>
                      <p className="text-[11px] font-medium text-muted-foreground">
                        {t("monetization.terms.todayUsage")}
                      </p>
                    </div>
                    <p className={cn("text-sm font-black", textClass(line.status))}>
                      {line.totalRemaining}/{line.quota}
                      {line.packRemaining > 0 ? ` +${line.packRemaining}` : ""}{" "}
                      {line.unit}
                    </p>
                  </div>
                  <Progress
                    value={line.percentRemaining}
                    className="h-2 bg-muted"
                    indicatorClassName={indicatorClass(line.status)}
                  />
                  {line.status === "empty" && (
                    <p className="mt-2 text-[11px] font-bold text-red-500">
                      {t("monetization.messages.usageEmptyToday")}
                    </p>
                  )}
                  {line.status === "warning" && (
                    <p className="mt-2 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      {t("monetization.messages.lowUsageWarning")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-2xl border border-secondary/20 bg-secondary/5 px-4 py-3">
              <div>
                <p className="text-sm font-black text-foreground">
                  {t("monetization.terms.availableDiscountCodes")}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t("monetization.messages.activeDiscountCodeDescription")}
                </p>
              </div>
              <p className="text-2xl font-black text-secondary">
                {summary.activeCoupons.length}
              </p>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border bg-card/70 px-4 py-3">
              <div>
                <p className="text-sm font-black text-foreground">
                  {t("monetization.terms.currentWallet")}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t("monetization.messages.walletDescription")}
                </p>
              </div>
              <div className="flex items-center gap-2 text-2xl font-black text-secondary">
                <Wallet className="size-5" />
                {Number(wallet?.balance ?? 0).toLocaleString(locale)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={packDialogOpen} onOpenChange={setPackDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("monetization.actions.buyImageBundle")}</DialogTitle>
            <DialogDescription>
              {t("monetization.messages.imageBundleDescription")}
            </DialogDescription>
          </DialogHeader>

          {isFetchingImagePacks ? (
            <div className="flex items-center justify-center rounded-2xl border border-border p-8 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              {t("monetization.messages.loadingImageUsage")}
            </div>
          ) : imagePacks.length === 0 ? (
            <div className="rounded-2xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
              {t("monetization.messages.imageBundleUnavailable")}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {imagePacks.map((pack) => (
                <div
                  key={pack.id}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <p className="text-base font-black text-foreground">
                    {pack.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("monetization.messages.remainingSingleUsage", {
                      remaining: Number(pack.operationAmount).toLocaleString(locale),
                    })}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-lg font-black text-secondary">
                      {Number(pack.priceHoa).toLocaleString(locale)}{" "}
                      {t("monetization.terms.blossom")}
                    </span>
                    <Button
                      size="sm"
                      className="rounded-xl"
                      disabled={isPurchasingImagePack}
                      onClick={() => handlePurchaseImagePack(pack)}
                    >
                      {isPurchasingImagePack && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      )}
                      {t("monetization.actions.buyImageBundle")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
