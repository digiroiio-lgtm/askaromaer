import "server-only";
import { db } from "./db";
import { getCityCategoryCounts } from "./queries";
import { href, hreflangCodes, locales, type Locale } from "@/i18n/config";
import { MIN_INDEX_ITEMS, SITE_URL } from "./constants";

type Entry = { path: string; lastmod?: Date; alternates?: readonly Locale[] };

/** Only pages with real content are listed (no empty/thin pages). */
export async function sitemapEntries(locale: Locale): Promise<Entry[]> {
  const [categories, cities, roamers, questions, guides] = await Promise.all([
    db.category.findMany({ select: { slug: true, _count: { select: { questions: { where: { status: "PUBLISHED" } }, guides: { where: { status: "PUBLISHED" } }, roamers: { where: { status: "APPROVED" } } } } } }),
    db.city.findMany({ include: { _count: { select: { questions: true, roamers: { where: { status: "APPROVED" } }, guides: { where: { status: "PUBLISHED" } } } } } }),
    db.roamerProfile.findMany({ where: { status: "APPROVED", user: { suspended: false } }, select: { slug: true, updatedAt: true } }),
    db.question.findMany({ where: { locale, status: "PUBLISHED", answers: { some: { status: "PUBLISHED" } } }, select: { slug: true, updatedAt: true } }),
    db.guide.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
  ]);
  const out: Entry[] = ["/", "/cities", "/categories", "/roamers", "/questions", "/guides", "/become-a-roamer"].map((path) => ({ path }));
  for (const c of categories) {
    if (c._count.questions + c._count.guides + c._count.roamers >= MIN_INDEX_ITEMS) out.push({ path: `/categories/${c.slug}` });
  }
  for (const c of cities) {
    if (c._count.questions + c._count.roamers + c._count.guides >= MIN_INDEX_ITEMS) out.push({ path: `/cities/${c.slug}` });
    if (c._count.roamers > 0) out.push({ path: `/roamers/${c.slug}` });
  }
  const counts = await getCityCategoryCounts();
  for (const [key, n] of counts) if (n >= MIN_INDEX_ITEMS) out.push({ path: `/cities/${key.split(":")[0]}/${key.split(":")[1]}` });
  for (const r of roamers) out.push({ path: `/roamer/${r.slug}`, lastmod: r.updatedAt });
  for (const g of guides) out.push({ path: `/guides/${g.slug}`, lastmod: g.updatedAt });
  for (const q of questions) out.push({ path: `/questions/${q.slug}`, lastmod: q.updatedAt, alternates: [locale] });
  return out;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export function renderUrlset(locale: Locale, entries: Entry[]) {
  const urls = entries.map((e) => {
    const alts = e.alternates ?? locales;
    const links = alts.length > 1
      ? [...alts.map((l) => `<xhtml:link rel="alternate" hreflang="${hreflangCodes[l]}" href="${esc(SITE_URL + href(l, e.path))}"/>`), `<xhtml:link rel="alternate" hreflang="x-default" href="${esc(SITE_URL + href("tr", e.path))}"/>`].join("")
      : "";
    return `<url><loc>${esc(SITE_URL + href(locale, e.path))}</loc>${e.lastmod ? `<lastmod>${e.lastmod.toISOString()}</lastmod>` : ""}${links}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join("\n")}</urlset>`;
}
