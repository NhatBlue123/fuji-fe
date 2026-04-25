/**
 * [I18N COMPONENT - PRICING CARDS]
 * Thực hiện:
 * - Localize tất cả các gói dịch vụ (Basic, Pro, Premium).
 * - Định dạng tiền tệ động dựa trên ngôn ngữ (toLocaleString).
 * - Xử lý thông báo xác nhận nâng cấp gói với các key i18n.
 */
"use client";

import React, { useState, useMemo } from "react";
import { CheckCircle2, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  useGetPlansQuery,
  useSubscribeMutation,
  useLazyGetSubscriptionPreviewQuery,
} from "@/store/services/subscriptionApi";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import {
  SubscriptionTier,
  SubscriptionPreview,
  type SubscriptionPlan,
} from "@/types/subscription";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { tMsg } from "@/i18n";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type ApiError = {
  data?: {
    errorCode?: string;
    messageKey?: string;
  };
};

export default function PricingCards() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { planCode: currentTier, user } = useFeatureAccess();
  const { data: plans, isLoading: isPlansLoading } = useGetPlansQuery();
  const [subscribePremium, { isLoading: isSubscribing }] =
    useSubscribeMutation();
  const [getPreview, { isFetching: isPreviewLoading }] =
    useLazyGetSubscriptionPreviewQuery();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    name: string;
    price: number;
    tier: SubscriptionTier;
  } | null>(null);
  const [previewData, setPreviewData] = useState<SubscriptionPreview | null>(
    null,
  );

  // Fallback plans with localized features
  const fallbackPlans = useMemo<SubscriptionPlan[]>(() => [
    {
      id: "basic",
      tier: "BASIC",
      name: "BASIC",
      price: 0,
      features: [
        t("premium.features.basic.courses"),
        t("premium.features.basic.flashcard"),
        t("premium.features.basic.practice"),
        t("premium.features.basic.mockTest"),
        t("premium.features.basic.progress"),
      ],
      isPopular: false,
    },
    {
      id: "pro",
      tier: "PRO",
      name: "PRO",
      price: 199,
      features: [
        t("premium.features.pro.allBasic"),
        t("premium.features.pro.fullMock"),
        t("premium.features.pro.breakdown"),
        t("premium.features.pro.history"),
        t("premium.features.pro.videoCall"),
        t("premium.features.pro.aiSensei"),
      ],
      isPopular: true,
    },
    {
      id: "premium",
      tier: "PREMIUM",
      name: "PREMIUM",
      price: 399,
      features: [
        t("premium.features.premium.allPro"),
        t("premium.features.premium.fullCourses"),
        t("premium.features.premium.heatmap"),
        t("premium.features.premium.unlimitedAI"),
        t("premium.features.premium.aiPath"),
      ],
      isPopular: false,
    },
  ], [t]);

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    try {
      await subscribePremium({ tier: selectedPlan.tier }).unwrap();
      toast.success(t("premium.subscribeSuccess", { name: selectedPlan.name }));
      setIsOpen(false);
      router.push("/profile/subscription");
    } catch (err) {
      const apiError = err as ApiError;
      console.error("Lỗi khi nâng cấp:", err);
      const errorMsg = tMsg(apiError.data?.messageKey) || t("api.error");

      if (
        apiError.data?.errorCode === "INSUFFICIENT_BALANCE" ||
        apiError.data?.messageKey === "wallet.insufficientBalance"
      ) {
        toast.error(t("wallet.insufficientBalance"));
        setTimeout(() => {
          router.push("/profile/wallet");
        }, 1500);
      } else {
        toast.error(errorMsg);
      }
      setIsOpen(false);
    }
  };

  const openDialog = async (plan: SubscriptionPlan) => {
    if (!user) {
      toast.info(t("common.pleaseLogin"));
      router.push("/login?redirect=/premium");
      return;
    }

    setSelectedPlan({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      tier: plan.tier as SubscriptionTier,
    });
    try {
      const preview = await getPreview(plan.tier).unwrap();
      setPreviewData(preview);
      setIsOpen(true);
    } catch (err) {
      const apiError = err as ApiError;
      const errorMsg = tMsg(apiError.data?.messageKey) || t("api.error");
      toast.error(errorMsg);
    }
  };

  const displayPlans = plans && plans.length > 0 ? plans : fallbackPlans;

  const renderBadge = (plan: SubscriptionPlan) => {
    if (plan.tier === "PREMIUM") {
      return (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white px-5 py-1.5 rounded-full text-[11px] font-bold tracking-widest flex items-center gap-1.5 whitespace-nowrap shadow-lg shadow-pink-500/30">
          <Zap className="w-3.5 h-3.5 fill-current" />
          AI PLATFORM
        </div>
      );
    }
    return null;
  };

  const getCardStyle = (tier: string) => {
    if (tier === "PREMIUM") {
      return "bg-gradient-to-b from-purple-800 to-indigo-950 text-white rounded-[2rem] border border-purple-500/30 flex flex-col relative shadow-[0_10px_40px_rgba(168,85,247,0.2)]";
    }
    if (tier === "PRO") {
      return "bg-[#0A0F1E] text-slate-200 rounded-[2rem] border border-pink-500 flex flex-col relative shadow-[0_0_30px_rgba(236,72,153,0.15)]";
    }
    return "bg-[#0A0F1E] text-slate-300 rounded-[2rem] flex flex-col relative";
  };

  const renderButton = (plan: SubscriptionPlan) => {
    const isCurrentPlan = currentTier === plan.tier;

    if (plan.tier === "BASIC") {
      return (
        <button
          disabled
          className="w-full bg-[#0F172A] text-slate-400 font-semibold py-3.5 rounded-xl transition mb-8 text-sm"
        >
          {isCurrentPlan ? t("premium.inUse") : t("premium.default")}
        </button>
      );
    }

    if (isCurrentPlan) {
      return (
        <button
          onClick={() => router.push("/profile/subscription")}
          className="w-full bg-slate-800 border border-slate-700 font-bold py-3.5 text-sm rounded-xl transition mb-8"
        >
          {t("premium.managePackage")}
        </button>
      );
    }

    if (plan.tier === "PREMIUM") {
      return (
        <button
          onClick={() => openDialog(plan)}
          disabled={isPreviewLoading}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold py-3.5 text-sm rounded-xl transition mb-8 shadow-[0_0_20px_rgba(236,72,153,0.4)] flex justify-center items-center disabled:opacity-70"
        >
          {!user ? (
            t("premium.loginToUpgrade")
          ) : isPreviewLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            t("premium.upgradePremium")
          )}
        </button>
      );
    }

    return (
      <button
        onClick={() => openDialog(plan)}
        disabled={isPreviewLoading}
        className="w-full bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-400 hover:to-rose-300 text-white font-bold py-3.5 text-sm rounded-xl transition mb-8 shadow-[0_0_20px_rgba(244,63,94,0.4)] flex justify-center items-center disabled:opacity-70"
      >
        {!user ? (
          t("premium.loginToUpgrade")
        ) : isPreviewLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          t("premium.upgradePro")
        )}
      </button>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl">
      {isPlansLoading && (
        <div className="col-span-1 lg:col-span-3 text-center py-10 opacity-50 flex items-center justify-center gap-3 text-slate-300">
          <Loader2 className="animate-spin w-5 h-5" /> {t("premium.loadingPricing")}
        </div>
      )}

      {!isPlansLoading &&
        displayPlans.map((plan: SubscriptionPlan) => (
          <div
            key={plan.id || plan.tier}
            className={`p-8 lg:p-10 ${getCardStyle(plan.tier)}`}
          >
            {renderBadge(plan)}

            <p
              className={`${plan.tier === "PREMIUM" ? "text-purple-200" : plan.tier === "PRO" ? "text-pink-400" : "text-slate-400"} text-[11px] font-bold tracking-widest mb-3 uppercase`}
            >
              {plan.tier === "PREMIUM"
                ? t("premium.tiers.maximum")
                : plan.tier === "PRO"
                  ? t("premium.tiers.serious")
                  : t("premium.tiers.experience")}
            </p>

            <h3 className="text-[28px] font-bold mb-4 leading-tight flex items-center gap-2">
              {(plan.tier === "PRO" || plan.tier === "PREMIUM") && (
                <span className={cn("text-2xl", plan.tier === "PRO" ? "text-yellow-400" : "")}>{t("common.package")}</span>
              )}
              {plan.name}
            </h3>

            <div className="flex items-end mb-8">
              <span className="text-[40px] font-black leading-none">
                {plan.price === 0 ? "0" : plan.price.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : i18n.language === 'ja' ? 'ja-JP' : 'en-US')}
              </span>
              <span
                className={`${plan.tier === "PREMIUM" ? "text-purple-200" : "text-slate-400"} ml-2 mb-1.5 text-sm`}
              >
                {t("premium.currencyPerMonth")}
              </span>
            </div>

            {renderButton(plan)}

            <ul className="space-y-4 flex-1">
              {(plan.features || []).map((feat: string, idx: number) => {
                const isHighlight = feat.toLowerCase().startsWith("tất cả") || feat.toLowerCase().startsWith("all");
                return (
                  <li
                    key={idx}
                    className="flex items-start text-[13px] leading-relaxed"
                  >
                    <div
                      className={`mt-0.5 mr-3 shrink-0 rounded-full flex items-center justify-center size-4 border ${plan.tier === "PREMIUM" ? "border-pink-300 text-pink-300" : plan.tier === "PRO" ? "border-pink-500 text-pink-500" : "border-slate-500 text-slate-500"}`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                    <span
                      className={`${isHighlight ? "font-bold text-white" : ""}`}
                    >
                      {feat}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("premium.confirmUpgradeTitle")}</DialogTitle>
            <DialogDescription asChild>
              <div className="text-sm text-muted-foreground mt-2">
                {previewData?.isRenewal ? (
                  <div className="space-y-3">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>
                        {t("premium.currentPackageDesc")}{" "}
                        <strong className="text-primary">{currentTier}</strong>
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                       <span className="text-xl">👉</span>
                       <span>{t("premium.stackDesc")}</span>
                    </p>
                    <div className="bg-muted/50 p-3 rounded-lg mt-2 space-y-1">
                      {previewData.currentExpireAt && (
                        <p className="text-xs flex justify-between">
                          <span>{t("premium.currentExpiry")}</span>
                          <strong>
                            {new Date(
                              previewData.currentExpireAt,
                            ).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : i18n.language === 'ja' ? 'ja-JP' : 'en-US')}
                          </strong>
                        </p>
                      )}
                      <p className="text-xs flex justify-between">
                        <span>{t("premium.newExpiry")}</span>
                        <strong className="text-pink-500">
                          {new Date(previewData.newExpireAt).toLocaleDateString(
                            i18n.language === 'vi' ? 'vi-VN' : i18n.language === 'ja' ? 'ja-JP' : 'en-US',
                          )}
                        </strong>
                      </p>
                    </div>
                    <div className="pt-2 border-t mt-3 text-center">
                      {t("premium.deductDesc", { amount: (previewData.price || selectedPlan?.price || 0).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : i18n.language === 'ja' ? 'ja-JP' : 'en-US') })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p>
                      {t("premium.confirmQuestion", { name: selectedPlan?.name })}
                    </p>
                    <div className="pt-2 border-t mt-3 text-center">
                      {t("premium.deductDesc", { amount: (previewData?.price || selectedPlan?.price || 0).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : i18n.language === 'ja' ? 'ja-JP' : 'en-US') })}
                    </div>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubscribing}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSubscribe}
              disabled={isSubscribing}
              className="bg-primary hover:bg-primary/90 text-white flex items-center"
            >
              {isSubscribing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
