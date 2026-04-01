import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useGetMySubscriptionQuery } from "@/store/services/subscriptionApi";

export type SubscriptionTier = "BASIC" | "PRO" | "PREMIUM";

const tierLevels: Record<SubscriptionTier, number> = {
  BASIC: 0,
  PRO: 1,
  PREMIUM: 2,
};

export const useFeatureAccess = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Fetch real-time subscription status if user is logged in
  const { data: mySub, isLoading } = useGetMySubscriptionQuery(undefined, {
    skip: !user, 
  });

  const getTier = (): SubscriptionTier => {
    if (mySub) return mySub.tier;
    // Fallback to user auth data 
    if (user?.subscriptionTier) return user.subscriptionTier;
    return "BASIC"; // Default tier
  };

  const currentTier = getTier();

  const isPro = tierLevels[currentTier] >= tierLevels.PRO;
  const isPremium = tierLevels[currentTier] >= tierLevels.PREMIUM;

  const hasAccess = (requiredTier: SubscriptionTier) => {
    return tierLevels[currentTier] >= tierLevels[requiredTier];
  };

  return {
    currentTier,
    isPro,
    isPremium,
    hasAccess,
    isLoadingSub: isLoading,
    user,
  };
};
