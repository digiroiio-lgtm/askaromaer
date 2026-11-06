import type { Locale } from "@/i18n/config";
import { hreflangCodes } from "@/i18n/config";

/** Replace {key} placeholders */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function money(cents: number, currency: string, locale: Locale): string {
  return new Intl.NumberFormat(hreflangCodes[locale], {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function num(n: number, locale: Locale): string {
  return new Intl.NumberFormat(hreflangCodes[locale]).format(n);
}

export function date(d: Date, locale: Locale, withTime = false): string {
  return new Intl.DateTimeFormat(hreflangCodes[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" } : {}),
  }).format(d);
}

export function timeAgo(d: Date, t: { justNow: string; minutes: string; hours: string; days: string; months: string; years: string }, now = new Date()): string {
  const s = Math.max(0, (now.getTime() - d.getTime()) / 1000);
  if (s < 60) return t.justNow;
  if (s < 3600) return fmt(t.minutes, { n: Math.floor(s / 60) });
  if (s < 86400) return fmt(t.hours, { n: Math.floor(s / 3600) });
  if (s < 86400 * 30) return fmt(t.days, { n: Math.floor(s / 86400) });
  if (s < 86400 * 365) return fmt(t.months, { n: Math.floor(s / (86400 * 30)) });
  return fmt(t.years, { n: Math.floor(s / (86400 * 365)) });
}

export function slugify(input: string): string {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u", é: "e", è: "e", ê: "e", à: "a", â: "a", ô: "o", û: "u", ù: "u", î: "i", ï: "i", œ: "oe", ã: "a", õ: "o", ñ: "n" };
  return input
    .toLowerCase()
    .replace(/[çğıİöşüéèêàâôûùîïœãõñ]/g, (c) => map[c] ?? c)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function excerpt(text: string, len = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > len ? clean.slice(0, len - 1).trimEnd() + "…" : clean;
}
