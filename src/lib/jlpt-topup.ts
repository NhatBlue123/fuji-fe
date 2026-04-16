import type { SubscriptionTier } from "@/types/feature-access";

export function getJlptTopupPath(
  topupType?: string | null,
  recommendedPlan?: SubscriptionTier | null,
) {
  const tab = topupType?.toUpperCase().includes("TOPUP") ? "topup" : "premium";
  const params = new URLSearchParams({ tab });

  if (recommendedPlan) {
    params.set("recommendedPlan", recommendedPlan);
  }

  return `/premium?${params.toString()}`;
}
