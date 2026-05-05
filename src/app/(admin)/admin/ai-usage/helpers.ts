export const AI_FEATURE_OPTIONS = [
  { value: "AI_CHAT_BASIC", label: "Trò chuyện AI" },
  { value: "AI_CHAT_DEEP", label: "Suy luận" },
  { value: "AI_SENSEI_SESSION", label: "Buổi Sensei" },
] as const;

export const QUOTA_SOURCE_OPTIONS = [
  { value: "DAILY", label: "Quota ngày" },
  { value: "PACK", label: "Gói mua thêm" },
  { value: "CACHE", label: "Dùng cache" },
  { value: "FREE_TRIAL", label: "Dùng thử" },
] as const;

export const featureLabel = (featureKey: string) =>
  AI_FEATURE_OPTIONS.find((item) => item.value === featureKey)?.label ?? featureKey;

export const quotaSourceLabel = (source: string) =>
  QUOTA_SOURCE_OPTIONS.find((item) => item.value === source)?.label ?? source;

export const tierLabel = (tier: string) => {
  if (tier === "BASIC") return "BASIC";
  if (tier === "PRO") return "PRO";
  if (tier === "PREMIUM") return "PREMIUM";
  return tier;
};

export const isEnabled = (value: boolean | number | undefined | null) =>
  value === true || value === 1;

export const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString("vi-VN") : "-";

export const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "-";
