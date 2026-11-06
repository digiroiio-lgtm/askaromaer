import { locales } from "@/i18n/config";
import { SITE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export function GET() {
  const now = new Date().toISOString();
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locales.map((l) => `<sitemap><loc>${SITE_URL}/sitemaps/${l}.xml</loc><lastmod>${now}</lastmod></sitemap>`).join("")}</sitemapindex>`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
