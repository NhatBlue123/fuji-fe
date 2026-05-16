const VIETNAM_OFFSET = "+07:00";
const HAS_EXPLICIT_TIME_ZONE = /(?:z|[+-]\d{2}:?\d{2})$/i;

export function parseVietnamDateTime(value: string | null | undefined): Date {
  if (!value) return new Date(Number.NaN);

  const normalized = value.trim();
  if (!normalized) return new Date(Number.NaN);

  if (HAS_EXPLICIT_TIME_ZONE.test(normalized)) {
    return new Date(normalized);
  }

  return new Date(`${normalized}${VIETNAM_OFFSET}`);
}
