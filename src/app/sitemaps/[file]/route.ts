import { isLocale } from "@/i18n/config";
import { renderUrlset, sitemapEntries } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const locale = file.replace(/\.xml$/, "");
  if (!isLocale(locale)) return new Response("Not found", { status: 404 });
  return new Response(renderUrlset(locale, await sitemapEntries(locale)), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
