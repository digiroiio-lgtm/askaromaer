import { href, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/tr";
export const accountNav = (l: Locale, t: Dictionary) => [
  { key: "overview", label: t.account.overview, href: href(l, "/account") },
  { key: "bookings", label: t.account.bookings, href: href(l, "/account/bookings") },
  { key: "guides", label: t.account.purchased, href: href(l, "/account/purchased-guides") },
];
export const panelNav = (l: Locale, t: Dictionary) => [
  { key: "overview", label: t.panel.overview, href: href(l, "/roamer-dashboard") },
  { key: "profile", label: t.panel.profile, href: href(l, "/roamer-dashboard/profile") },
  { key: "calendar", label: t.panel.calendar, href: href(l, "/roamer-dashboard/calendar") },
  { key: "earnings", label: t.panel.earnings, href: href(l, "/roamer-dashboard/earnings") },
  { key: "guides", label: t.panel.guides, href: href(l, "/roamer-dashboard/guides") },
];
