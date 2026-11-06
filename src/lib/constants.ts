export const ROLES = ["TRAVELER", "ROAMER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ROAMER_STATUS = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"] as const;
export const BOOKING_STATUS = ["PENDING_PAYMENT", "CONFIRMED", "COMPLETED", "CANCELLED", "REFUNDED"] as const;
export const GUIDE_STATUS = ["DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED"] as const;
export const DURATIONS = [15, 30, 60] as const;
export const SPOKEN_LANGUAGES = ["tr", "en", "es", "pt", "de", "fr", "th", "ja", "id", "cs"] as const;
export const REGIONS = ["asia", "europe", "north-america", "south-america", "middle-east", "oceania"] as const;

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://askaroamer.com").replace(/\/$/, "");
export const SITE_INDEXABLE = process.env.SITE_INDEXABLE === "true";
export const PAGE_SIZE = 9;

export function platformFeePercent(): number {
  const n = Number(process.env.PLATFORM_FEE_PERCENT ?? "20");
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : 20;
}
