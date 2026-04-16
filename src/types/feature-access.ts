// ═══════════════════════════════════════════════════════════════
// Feature Access Types — Dynamic Subscription System
// ═══════════════════════════════════════════════════════════════

export type SubscriptionTier = 'BASIC' | 'PRO' | 'PREMIUM';

export interface FeatureAccessData {
  planCode: SubscriptionTier;
  features: {
    courseAccess: string;        // "trial"
    flashcardMode: string;      // "basic" | "full"
    practiceEnabled: boolean;
    progressMode: string;       // "simple"
    videoCallEnabled: boolean;
    prioritySupportEnabled: boolean;

    // JLPT Quota
    jlptExamLimit: number;      // -1 = unlimited
    jlptRemaining: number;      // -1 = unlimited

    // AI Sensei Quota
    aiSenseiDailyLimit: number; // -1 = unlimited, 0 = disabled
    aiSenseiRemainingToday: number; // -1 = unlimited, 0 = disabled/exhausted
  };
}

export interface QuotaRemainingData {
  planCode: SubscriptionTier;
  remaining: number;           // -1 = unlimited
  unlimited: boolean;
  disabled?: boolean;          // only for AI Sensei
}

// Error codes returned by backend for feature/quota errors
export type SubscriptionErrorCode =
  | 'FEATURE_NOT_AVAILABLE'
  | 'QUOTA_EXCEEDED'
  | 'SUBSCRIPTION_EXPIRED'
  | 'PLAN_NOT_FOUND';
