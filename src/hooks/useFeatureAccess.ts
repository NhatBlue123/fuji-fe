import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useGetFeatureAccessQuery } from "@/store/services/subscriptionApi";
import { SubscriptionTier } from "@/types/feature-access";

const tierLevels: Record<SubscriptionTier, number> = {
  BASIC: 0,
  PRO: 1,
  PREMIUM: 2,
};

export const useFeatureAccess = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  
  const { data: featureAccess, isLoading } = useGetFeatureAccessQuery(undefined, {
    skip: !user,
  });

  const planCode = featureAccess?.planCode || (user?.subscriptionTier as SubscriptionTier) || "BASIC";
  const features = featureAccess?.features;

  const isPro = tierLevels[planCode] >= tierLevels.PRO;
  const isPremium = tierLevels[planCode] >= tierLevels.PREMIUM;

  const hasAccess = (requiredTier: SubscriptionTier) => {
    return tierLevels[planCode] >= tierLevels[requiredTier];
  };

  return {
    // Plan info
    planCode,
    isPro,
    isPremium,
    isLoading,
    hasAccess,
    user,

    // Feature booleans
    canUseVideoCall: features?.videoCallEnabled ?? false,
    canUseAiSensei: (features?.aiSenseiDailyLimit ?? 0) !== 0,
    hasPrioritySupport: features?.prioritySupportEnabled ?? false,
    flashcardMode: features?.flashcardMode ?? "basic",

    // Quota
    jlptRemaining: features?.jlptRemaining ?? 0,
    jlptLimit: features?.jlptExamLimit ?? 5,
    jlptUnlimited: features?.jlptExamLimit === -1,

    aiSenseiRemaining: features?.aiSenseiRemainingToday ?? 0,
    aiSenseiDailyLimit: features?.aiSenseiDailyLimit ?? 0,
    aiSenseiUnlimited: features?.aiSenseiDailyLimit === -1,

    // Raw data
    features,
  };
};
