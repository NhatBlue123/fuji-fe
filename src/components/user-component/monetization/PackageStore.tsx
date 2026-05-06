"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Gift, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGetWalletQuery } from "@/store/services/walletApi";
import {
  useGetActiveSystemPackagesQuery,
  usePurchaseSystemPackageMutation,
  type PackageCouponRule,
  type PackageFeature,
  type SystemPackage,
} from "@/store/services/userMonetizationApi";

const FEATURE_LABEL_KEYS: Record<string, string> = {
  AI_CHAT_BASIC: "monetization.terms.aiChat",
  AI_CHAT_DEEP: "monetization.terms.advancedHelp",
  AI_SENSEI_SESSION: "monetization.terms.sensei",
  FLASHCARD_IMAGE_OPERATION: "monetization.terms.flashcardImage",
  PRIORITY_SUPPORT: "monetization.terms.prioritySupport",
  VIDEO_CALL_ENABLED: "monetization.terms.videoCall",
  FLASHCARD_CREATE_PUBLIC_DECK: "monetization.terms.publicFlashcardDeck",
};

function featureLabel(
  feature: PackageFeature,
  t: (key: string, options?: Record<string, unknown>) => string,
  locale: string,
) {
  const label = FEATURE_LABEL_KEYS[feature.featureKey]
    ? t(FEATURE_LABEL_KEYS[feature.featureKey])
    : feature.featureKey;
  if (feature.quotaAmount == null) return label;
  const period =
    feature.quotaPeriod === "DAILY"
      ? t("monetization.period.daily")
      : feature.quotaPeriod === "MONTHLY"
        ? t("monetization.period.monthly")
        : "";
  return `${label}: ${Number(feature.quotaAmount).toLocaleString(locale)}${period}`;
}

function couponLabel(
  rule: PackageCouponRule,
  t: (key: string, options?: Record<string, unknown>) => string,
  locale: string,
) {
  const scope =
    rule.couponScope === "BOOKING"
      ? t("monetization.terms.booking")
      : rule.couponScope === "COURSE"
        ? t("monetization.terms.course")
        : t("monetization.terms.bookingAndCourse");
  const discount =
    rule.discountType === "PERCENT"
      ? t("monetization.messages.discountPercent", {
          value: rule.discountValue,
        })
      : t("monetization.messages.discountBlossom", {
          value: Number(rule.discountValue || 0).toLocaleString(locale),
        });
  return t("monetization.couponBonusLine", {
    count: rule.generatedCouponCount,
    discount,
    scope,
    uses: rule.usageLimitPerCoupon,
  });
}

function PackageCard({
  pack,
  onBuy,
  t,
  locale,
}: {
  pack: SystemPackage;
  onBuy: (pack: SystemPackage) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  locale: string;
}) {
  const enabledFeatures = pack.features.filter((item) => item.enabled);
  const activeCoupons = pack.couponRules.filter((item) => item.active);

  return (
    <Card className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border-muted/60 bg-white/80 shadow-xl shadow-black/5 dark:border-white/5 dark:bg-[#0B1120]/80">
      {pack.popular && (
        <div className="absolute right-4 top-4">
          <Badge className="rounded-full bg-secondary text-white">
            {t("monetization.terms.popular")}
          </Badge>
        </div>
      )}
      <CardHeader>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          {pack.code}
        </p>
        <CardTitle className="text-2xl font-black tracking-tight">
          {pack.name}
        </CardTitle>
        {pack.description && (
          <p className="text-sm text-muted-foreground">{pack.description}</p>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        <div>
          <p className="text-4xl font-black tracking-tight text-secondary">
            {Number(pack.priceHoa || 0).toLocaleString(locale)}
            <span className="ml-2 text-sm text-muted-foreground">
              {t("monetization.terms.blossom")}
            </span>
          </p>
          <p className="text-xs font-bold text-muted-foreground">
            {t("monetization.messages.durationDays", {
              days: pack.durationDays,
            })}
          </p>
        </div>

        <div className="space-y-2">
          {enabledFeatures.slice(0, 6).map((feature) => (
            <div key={`${pack.id}-${feature.featureKey}`} className="flex gap-2 text-sm">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              <span>{featureLabel(feature, t, locale)}</span>
            </div>
          ))}
        </div>

        {activeCoupons.length > 0 && (
          <div className="rounded-2xl border border-secondary/20 bg-secondary/5 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-black text-secondary">
              <Gift className="size-4" />
              {t("monetization.couponBonus")}
            </div>
            <div className="space-y-1">
              {activeCoupons.map((rule) => (
                <p key={rule.id ?? couponLabel(rule, t, locale)} className="text-xs text-muted-foreground">
                  {couponLabel(rule, t, locale)}
                </p>
              ))}
            </div>
          </div>
        )}

        <Button
          type="button"
          className="mt-auto rounded-xl"
          onClick={() => onBuy(pack)}
        >
          <Sparkles className="mr-2 size-4" />
          {t("monetization.actions.buyPackage")}
        </Button>
      </CardContent>
    </Card>
  );
}

export function PackageStore() {
  const { t, i18n } = useTranslation();
  const { data: packages = [], isLoading } = useGetActiveSystemPackagesQuery();
  const { data: wallet } = useGetWalletQuery();
  const [purchasePackage, purchaseState] = usePurchaseSystemPackageMutation();
  const [selectedPackage, setSelectedPackage] = useState<SystemPackage | null>(null);
  const walletBalance = Number(wallet?.balance ?? 0);
  const walletAfter = selectedPackage
    ? walletBalance - Number(selectedPackage.priceHoa ?? 0)
    : walletBalance;
  const canPay = !selectedPackage || walletAfter >= 0;
  const locale =
    i18n.language === "vi" ? "vi-VN" : i18n.language === "ja" ? "ja-JP" : "en-US";

  const sortedPackages = useMemo(
    () => [...packages].sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 3),
    [packages],
  );

  const handleConfirmPurchase = async () => {
    if (!selectedPackage || !canPay) return;
    try {
      const result = await purchasePackage(selectedPackage.id).unwrap();
      toast.success(t("monetization.messages.packagePurchaseSuccess", {
        name: result.packageName,
      }));
      if (result.generatedCoupons?.length) {
        toast.success(t("monetization.messages.discountCodesReceived", {
          count: result.generatedCoupons.length,
        }));
      }
      if (result.status === "PENDING_SYNC") {
        toast.message(t("monetization.messages.aiSyncPending"));
      }
      setSelectedPackage(null);
    } catch {
      toast.error(t("monetization.messages.packagePurchaseFailed"));
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              {t("monetization.terms.systemPackages")}
            </p>
            <h1 className="text-3xl font-black tracking-tight">
              {t("monetization.actions.choosePackage")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("monetization.messages.systemPackageDescription")}
            </p>
          </div>
          <div className="rounded-2xl border border-secondary/20 bg-secondary/5 px-4 py-3 text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {t("monetization.terms.currentWallet")}
            </p>
            <p className="text-lg font-black text-secondary">
              {walletBalance.toLocaleString(locale)}{" "}
              {t("monetization.terms.blossom")}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-96 animate-pulse rounded-[2rem] bg-muted" />
            ))}
          </div>
        ) : sortedPackages.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-muted-foreground/30 py-20 text-center">
            <Sparkles className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="font-bold text-muted-foreground">
              {t("monetization.messages.adminNoPackage")}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            {sortedPackages.map((pack) => (
              <PackageCard
                key={pack.id}
                pack={pack}
                onBuy={setSelectedPackage}
                t={t}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={Boolean(selectedPackage)} onOpenChange={(open) => !open && setSelectedPackage(null)}>
        <DialogContent className="rounded-2xl">
          {selectedPackage && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {t("monetization.actions.buyPackage")} {selectedPackage.name}
                </DialogTitle>
                <DialogDescription>
                  {t("monetization.messages.reviewBeforeConfirm")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="rounded-2xl border border-border p-4">
                  <div className="flex justify-between text-sm">
                    <span>{t("monetization.messages.packagePrice")}</span>
                    <strong>
                      {selectedPackage.priceHoa.toLocaleString(locale)}{" "}
                      {t("monetization.terms.blossom")}
                    </strong>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span>{t("monetization.terms.currentWallet")}</span>
                    <strong>
                      {walletBalance.toLocaleString(locale)}{" "}
                      {t("monetization.terms.blossom")}
                    </strong>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span>{t("monetization.messages.walletAfterPayment")}</span>
                    <strong className={canPay ? "text-foreground" : "text-red-500"}>
                      {walletAfter.toLocaleString(locale)}{" "}
                      {t("monetization.terms.blossom")}
                    </strong>
                  </div>
                </div>
                <div className="rounded-2xl border border-secondary/20 bg-secondary/5 p-4">
                  <p className="mb-2 text-sm font-black text-secondary">
                    {t("monetization.messages.willReceive")}
                  </p>
                  <div className="space-y-1 text-sm">
                    {selectedPackage.features.filter((item) => item.enabled).slice(0, 5).map((feature) => (
                      <p key={feature.featureKey}>• {featureLabel(feature, t, locale)}</p>
                    ))}
                    {selectedPackage.couponRules.filter((item) => item.active).map((rule) => (
                      <p key={rule.id ?? couponLabel(rule, t, locale)}>• {couponLabel(rule, t, locale)}</p>
                    ))}
                  </div>
                </div>
                {!canPay && (
                  <p className="text-sm font-bold text-red-500">
                    {t("monetization.messages.notEnoughForPackage")}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedPackage(null)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="button"
                  disabled={!canPay || purchaseState.isLoading}
                  onClick={handleConfirmPurchase}
                >
                  {t("monetization.actions.confirmPurchase")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
