export const locales = ["tr", "en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "tr";

export const hreflangCodes: Record<Locale, string> = {
  tr: "tr-TR",
  en: "en-GB",
  fr: "fr-FR",
};

export const localeLabels: Record<Locale, string> = {
  tr: "Türkçe",
  en: "English",
  fr: "Français",
};

export const ogLocales: Record<Locale, string> = { tr: "tr_TR", en: "en_GB", fr: "fr_FR" };

export function isLocale(v: string | undefined | null): v is Locale {
  return !!v && (locales as readonly string[]).includes(v);
}

/**
 * Internal (English) path segment -> localized segment.
 * Internal segments are the folder names under src/app/[locale]/.
 * Any segment not in this table (slugs, ids) is passed through unchanged.
 */
export const SEGMENTS: Record<string, Record<Locale, string>> = {
  cities: { tr: "sehirler", en: "cities", fr: "villes" },
  categories: { tr: "kategoriler", en: "categories", fr: "categories" },
  roamers: { tr: "roamerlar", en: "roamers", fr: "roamers" },
  roamer: { tr: "roamer", en: "roamer", fr: "roamer" },
  questions: { tr: "sorular", en: "questions", fr: "questions" },
  ask: { tr: "sor", en: "ask", fr: "poser" },
  "become-a-roamer": { tr: "roamer-ol", en: "become-a-roamer", fr: "devenir-roamer" },
  guides: { tr: "rehberler", en: "guides", fr: "guides" },
  read: { tr: "oku", en: "read", fr: "lire" },
  login: { tr: "giris", en: "login", fr: "connexion" },
  register: { tr: "kayit", en: "register", fr: "inscription" },
  account: { tr: "hesabim", en: "account", fr: "mon-compte" },
  bookings: { tr: "rezervasyonlar", en: "bookings", fr: "reservations" },
  "purchased-guides": { tr: "satin-aldigim-rehberler", en: "purchased-guides", fr: "guides-achetes" },
  checkout: { tr: "odeme", en: "checkout", fr: "paiement" },
  "roamer-dashboard": { tr: "roamer-paneli", en: "roamer-dashboard", fr: "espace-roamer" },
  calendar: { tr: "takvim", en: "calendar", fr: "calendrier" },
  earnings: { tr: "kazanc", en: "earnings", fr: "revenus" },
  profile: { tr: "profil", en: "profile", fr: "profil" },
  new: { tr: "yeni", en: "new", fr: "nouveau" },
  edit: { tr: "duzenle", en: "edit", fr: "modifier" },
  admin: { tr: "admin", en: "admin", fr: "admin" },
  blog: { tr: "blog", en: "blog", fr: "blog" },
};

const REVERSE: Record<Locale, Record<string, string>> = { tr: {}, en: {}, fr: {} };
for (const [internal, map] of Object.entries(SEGMENTS)) {
  for (const l of locales) REVERSE[l][map[l]] = internal;
}

/** "/cities/bali" -> "/tr/sehirler/bali/" */
export function href(locale: Locale, internalPath = "/", query?: Record<string, string | undefined>): string {
  const segs = internalPath.split("/").filter(Boolean);
  const localized = segs.map((s) => SEGMENTS[s]?.[locale] ?? s);
  let out = `/${locale}/${localized.join("/")}`;
  if (!out.endsWith("/")) out += "/";
  if (query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v) qs.set(k, v);
    const s = qs.toString();
    if (s) out += `?${s}`;
  }
  return out;
}

/** Localized segments (without locale) -> internal segments */
export function toInternal(locale: Locale, segs: string[]): string[] {
  return segs.map((s) => REVERSE[locale][s] ?? s);
}

/** Internal segments -> localized segments */
export function toLocalized(locale: Locale, segs: string[]): string[] {
  return segs.map((s) => SEGMENTS[s]?.[locale] ?? s);
}
