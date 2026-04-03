export type SubscriptionTier = 'BASIC' | 'PRO' | 'PREMIUM';

export interface SubscriptionPlan {
  id: string; // e.g. "basic", "pro", "premium"
  name: string;
  tier: SubscriptionTier;
  price: number;
  features: string[];
  isPopular?: boolean;
}

export interface SubscriptionMyStatus {
  tier: SubscriptionTier;
  expireAt: string;
  daysRemaining: number;
  autoRenew: boolean;
  activeFeatures: string[];
}

export interface SubscriptionHistory {
  id: string;
  tier: SubscriptionTier;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  price: number;
}

export interface SubscriptionPreview {
  isRenewal: boolean;
  tier: SubscriptionTier;
  price: number;
  currentExpireAt?: string;
  newExpireAt: string;
}
