import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { href, locales } from "@/i18n/config";

export default function robots(): MetadataRoute.Robots {
  const privatePaths = ["/account", "/roamer-dashboard", "/admin", "/login"].flatMap((p) => locales.map((l) => href(l, p)));
  return { rules: [{ userAgent: "*", allow: "/", disallow: [...new Set(privatePaths), "/api/"] }], sitemap: `${SITE_URL}/sitemap.xml`, host: SITE_URL };
}
