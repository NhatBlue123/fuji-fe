export type AvatarFrame = {
  id: string;
  name: string;
  src: string;
  isDefault: boolean;
};

export const AVATAR_FRAME_DIR = "/images/khung_avatar_new";
export const DEFAULT_AVATAR_FRAME_LIMIT = 5;

export function isAvatarFramePath(value?: string | null): value is string {
  return Boolean(
    value &&
      value.startsWith(`${AVATAR_FRAME_DIR}/`) &&
      /\.(png|webp)$/i.test(value),
  );
}

export function normalizeAvatarFramePath(value?: string | null) {
  if (!value) return "";
  const trimmed = value.trim();
  return isAvatarFramePath(trimmed) ? trimmed : "";
}

export function getAvailableAvatarFrames(
  frames: AvatarFrame[],
  hasAnyPackage: boolean,
) {
  return hasAnyPackage ? frames : frames.filter((frame) => frame.isDefault);
}

export function canUseAvatarFrame(
  frameSrc: string | null | undefined,
  frames: AvatarFrame[],
  hasAnyPackage: boolean,
) {
  const normalized = normalizeAvatarFramePath(frameSrc);
  if (!normalized) return true;

  return getAvailableAvatarFrames(frames, hasAnyPackage).some(
    (frame) => frame.src === normalized,
  );
}

export function changeAvatarFrame(
  currentFrameSrc: string | null | undefined,
  nextFrameSrc: string | null | undefined,
  frames: AvatarFrame[],
  hasAnyPackage: boolean,
) {
  const normalizedNext = normalizeAvatarFramePath(nextFrameSrc);
  if (!normalizedNext) return "";

  if (canUseAvatarFrame(normalizedNext, frames, hasAnyPackage)) {
    return normalizedNext;
  }

  return normalizeAvatarFramePath(currentFrameSrc);
}

export function getUsableAvatarFrame(
  frameSrc: string | null | undefined,
  frames: AvatarFrame[],
  hasAnyPackage: boolean,
) {
  const normalized = normalizeAvatarFramePath(frameSrc);
  if (!normalized) return "";
  if (frames.length === 0) return normalized;

  return canUseAvatarFrame(normalized, frames, hasAnyPackage) ? normalized : "";
}

export function hasAnyAvatarFramePackage(
  userPackage?: {
    status?: string | null;
    startsAt?: string | null;
    expiresAt?: string | null;
  } | null,
  subscriptionTier?: string | null,
) {
  const status = userPackage?.status?.toUpperCase();
  const startsAt = userPackage?.startsAt ? Date.parse(userPackage.startsAt) : NaN;
  const expiresAt = userPackage?.expiresAt ? Date.parse(userPackage.expiresAt) : NaN;
  const now = Date.now();
  const packageHasStarted = !Number.isFinite(startsAt) || startsAt <= now;
  const packageNotExpired = !Number.isFinite(expiresAt) || expiresAt > now;
  const hasActivePackage =
    Boolean(userPackage) &&
    (!status || ["ACTIVE", "PENDING_SYNC"].includes(status)) &&
    packageHasStarted &&
    packageNotExpired;

  return hasActivePackage || Boolean(subscriptionTier && subscriptionTier !== "BASIC");
}
