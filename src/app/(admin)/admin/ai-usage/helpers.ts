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

export const AI_TIER_OPTIONS = [
  { value: "BASIC", label: "BASIC" },
  { value: "PRO", label: "PRO" },
  { value: "PREMIUM", label: "PREMIUM" },
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

export const formatNumber = (value?: number | string | null) =>
  Number(value || 0).toLocaleString("vi-VN");

export const formatUsd = (value?: number | string | null) =>
  `$${Number(value || 0).toLocaleString("vi-VN", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  })}`;

export const userDisplayName = (user?: {
  fullName?: string | null;
  username?: string | null;
  email?: string | null;
  userId?: number;
}) => user?.fullName || user?.username || user?.email || (user?.userId ? `#${user.userId}` : "Người dùng");

export const userInitial = (user?: {
  fullName?: string | null;
  username?: string | null;
  email?: string | null;
  userId?: number;
}) => userDisplayName(user).charAt(0).toUpperCase();
