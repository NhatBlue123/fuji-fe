"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useGetMyAiQuotaQuery } from "@/store/services/aiQuotaApi";
import {
  useGetFlashcardImageQuotaQuery,
  useGetMyCouponsQuery,
  useGetMySystemPackageQuery,
} from "@/store/services/userMonetizationApi";

export const USER_QUOTA_FEATURES = {
  AI_CHAT_BASIC: "AI_CHAT_BASIC",
  AI_CHAT_DEEP: "AI_CHAT_DEEP",
  AI_SENSEI_SESSION: "AI_SENSEI_SESSION",
  FLASHCARD_IMAGE_OPERATION: "FLASHCARD_IMAGE_OPERATION",
} as const;

export type UserQuotaLine = {
  featureKey: string;
  label: string;
  used: number;
  quota: number;
  remaining: number;
  packRemaining: number;
  totalRemaining: number;
  unit: string;
  percentRemaining: number;
  status: "normal" | "warning" | "empty";
};

const FEATURE_LABEL_KEYS: Record<string, { labelKey: string; unitKey: string }> = {
  AI_CHAT_BASIC: {
    labelKey: "monetization.terms.aiChat",
    unitKey: "monetization.terms.usage",
  },
  AI_CHAT_DEEP: {
    labelKey: "monetization.terms.advancedHelp",
    unitKey: "monetization.terms.usage",
  },
  AI_SENSEI_SESSION: {
    labelKey: "monetization.terms.sensei",
    unitKey: "monetization.terms.session",
  },
  FLASHCARD_IMAGE_OPERATION: {
    labelKey: "monetization.terms.flashcardImage",
    unitKey: "monetization.terms.usage",
  },
};

function statusFor(remaining: number, quota: number): UserQuotaLine["status"] {
  if (remaining <= 0) return "empty";
  if (quota > 0 && remaining / quota <= 0.2) return "warning";
  return "normal";
}

function percentRemaining(remaining: number, quota: number) {
  if (quota <= 0) return remaining > 0 ? 100 : 0;
  return Math.max(0, Math.min(100, Math.round((remaining / quota) * 100)));
}

export function useMyMonetizationSummary(options?: { skip?: boolean }) {
  const { t } = useTranslation();
  const skip = options?.skip ?? false;
  const packageQuery = useGetMySystemPackageQuery(undefined, { skip });
  const couponsQuery = useGetMyCouponsQuery(undefined, { skip });
  const flashcardQuotaQuery = useGetFlashcardImageQuotaQuery(undefined, { skip });
  const aiQuotaQuery = useGetMyAiQuotaQuery(undefined, { skip });

  const quotaLines = useMemo<UserQuotaLine[]>(() => {
    const aiLines = (aiQuotaQuery.data ?? []).map((quota) => {
      const meta = FEATURE_LABEL_KEYS[quota.featureKey] ?? {
        labelKey: quota.featureKey,
        unitKey: "monetization.terms.usage",
      };
      const totalRemaining = Number(quota.totalRemaining ?? 0);
      const dailyQuota = Number(quota.dailyQuota ?? 0);
      return {
        featureKey: quota.featureKey,
        label: t(meta.labelKey, { defaultValue: quota.featureKey }),
        used: Number(quota.dailyUsed ?? 0),
        quota: dailyQuota,
        remaining: Number(quota.dailyRemaining ?? 0),
        packRemaining: Number(quota.packRemaining ?? 0),
        totalRemaining,
        unit: t(meta.unitKey),
        percentRemaining: percentRemaining(totalRemaining, dailyQuota),
        status: statusFor(totalRemaining, dailyQuota),
      };
    });

    const flashcardQuota = flashcardQuotaQuery.data;
    const flashcardLine: UserQuotaLine | null = flashcardQuota
      ? {
          featureKey: USER_QUOTA_FEATURES.FLASHCARD_IMAGE_OPERATION,
          label: t(FEATURE_LABEL_KEYS.FLASHCARD_IMAGE_OPERATION.labelKey),
          used: Number(flashcardQuota.dailyUsed ?? 0),
          quota: Number(flashcardQuota.dailyQuota ?? 0),
          remaining: Number(flashcardQuota.dailyRemaining ?? 0),
          packRemaining: Number(flashcardQuota.packRemaining ?? 0),
          totalRemaining: Number(flashcardQuota.totalRemaining ?? 0),
          unit: t(FEATURE_LABEL_KEYS.FLASHCARD_IMAGE_OPERATION.unitKey),
          percentRemaining: percentRemaining(
            Number(flashcardQuota.totalRemaining ?? 0),
            Number(flashcardQuota.dailyQuota ?? 0),
          ),
          status: statusFor(
            Number(flashcardQuota.totalRemaining ?? 0),
            Number(flashcardQuota.dailyQuota ?? 0),
          ),
        }
      : null;

    const byFeature = new Map<string, UserQuotaLine>();
    for (const line of aiLines) byFeature.set(line.featureKey, line);
    if (flashcardLine) byFeature.set(flashcardLine.featureKey, flashcardLine);

    return [
      USER_QUOTA_FEATURES.AI_CHAT_BASIC,
      USER_QUOTA_FEATURES.AI_CHAT_DEEP,
      USER_QUOTA_FEATURES.AI_SENSEI_SESSION,
      USER_QUOTA_FEATURES.FLASHCARD_IMAGE_OPERATION,
    ]
      .map((key) => byFeature.get(key))
      .filter((line): line is UserQuotaLine => Boolean(line));
  }, [aiQuotaQuery.data, flashcardQuotaQuery.data, t]);

  const activeCoupons = useMemo(
    () =>
      (couponsQuery.data ?? []).filter(
        (coupon) =>
          coupon.status === "ACTIVE" &&
          Number(coupon.usageRemaining ?? 0) > 0,
      ),
    [couponsQuery.data],
  );

  return {
    package: packageQuery.data ?? null,
    coupons: couponsQuery.data ?? [],
    activeCoupons,
    flashcardQuota: flashcardQuotaQuery.data,
    aiQuota: aiQuotaQuery.data ?? [],
    quotaLines,
    isLoading:
      packageQuery.isLoading ||
      couponsQuery.isLoading ||
      flashcardQuotaQuery.isLoading ||
      aiQuotaQuery.isLoading,
    isFetching:
      packageQuery.isFetching ||
      couponsQuery.isFetching ||
      flashcardQuotaQuery.isFetching ||
      aiQuotaQuery.isFetching,
    hasError:
      packageQuery.isError ||
      couponsQuery.isError ||
      flashcardQuotaQuery.isError ||
      aiQuotaQuery.isError,
    refetchAll: () => {
      packageQuery.refetch();
      couponsQuery.refetch();
      flashcardQuotaQuery.refetch();
      aiQuotaQuery.refetch();
    },
  };
}
