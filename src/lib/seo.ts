import type { Metadata } from "next";
import { href, hreflangCodes, locales, ogLocales, type Locale } from "@/i18n/config";
import { SITE_INDEXABLE, SITE_URL } from "./constants";

type MetaInput = {
  locale: Locale;
  /** internal path, e.g. "/cities/bali" */
  path: string;
  title: string;
  description: string;
  image?: string;
  /** locales that have an equivalent published page (default: all) */
  alternateLocales?: readonly Locale[];
  noindex?: boolean;
  type?: "website" | "article" | "profile";
};

export const abs = (p: string) => (p.startsWith("http") ? p : `${SITE_URL}${p}`);

export function buildMetadata(m: MetaInput): Metadata {
  const alts = m.alternateLocales ?? locales;
  const languages: Record<string, string> = {};
  for (const l of alts) languages[hreflangCodes[l]] = abs(href(l, m.path));
  if (alts.includes("tr")) languages["x-default"] = abs(href("tr", m.path));
  else if (alts.length) languages["x-default"] = abs(href(alts[0], m.path));
  const index = SITE_INDEXABLE && !m.noindex;
  const image = abs(m.image ?? "/images/hero/home-hero.jpg");
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: abs(href(m.locale, m.path)), languages: alts.length > 1 ? languages : undefined },
    robots: index ? { index: true, follow: true } : { index: false, follow: !m.noindex },
    openGraph: {
      type: m.type ?? "website",
      siteName: "AskARoamer",
      title: m.title,
      description: m.description,
      url: abs(href(m.locale, m.path)),
      locale: ogLocales[m.locale],
      alternateLocale: alts.filter((l) => l !== m.locale).map((l) => ogLocales[l]),
      images: [{ url: image }],
    },
    twitter: { card: "summary_large_image", title: m.title, description: m.description, images: [image] },
  };
}

/** Private pages: never indexed */
export function privateMetadata(title: string): Metadata {
  return { title, robots: { index: false, follow: false } };
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.url) })),
  };
}

/** CollectionPage + ItemList for hub pages */
export function collectionLd(m: { name: string; description?: string; url: string; items: { name: string; url: string }[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: m.name,
    description: m.description,
    url: abs(m.url),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: m.items.length,
      itemListElement: m.items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: abs(it.url) })),
    },
  };
}
