import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, isLocale, locales, toInternal, toLocalized, type Locale } from "@/i18n/config";

function preferredLocale(req: NextRequest): Locale {
  const cookie = req.cookies.get("ar_locale")?.value;
  if (isLocale(cookie)) return cookie;
  const accept = req.headers.get("accept-language") ?? "";
  for (const part of accept.split(",")) {
    const code = part.split(";")[0].trim().slice(0, 2).toLowerCase();
    if (isLocale(code)) return code;
  }
  return defaultLocale;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const segs = pathname.split("/").filter(Boolean);
  const first = segs[0];

  // No locale prefix -> redirect to preferred locale (keeps the rest of the path)
  if (!isLocale(first)) {
    const locale = preferredLocale(req);
    const rest = toLocalized(locale, segs).join("/");
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/${rest}${rest ? "/" : ""}`;
    return NextResponse.redirect(url, 307);
  }

  const locale = first;
  const localizedSegs = segs.slice(1);
  const internalSegs = toInternal(locale, localizedSegs);
  const canonicalLocalized = toLocalized(locale, internalSegs);

  // Internal/foreign slug used under this locale (e.g. /tr/cities/) -> 301 to localized slug
  if (canonicalLocalized.join("/") !== localizedSegs.join("/")) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/${canonicalLocalized.join("/")}${canonicalLocalized.length ? "/" : ""}`;
    return NextResponse.redirect(url, 301);
  }

  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname + search);
  headers.set("x-locale", locale);

  const internalPath = `/${locale}/${internalSegs.join("/")}${internalSegs.length ? "/" : ""}`;
  if (internalPath !== (pathname.endsWith("/") ? pathname : pathname + "/")) {
    const url = req.nextUrl.clone();
    url.pathname = internalPath;
    const res = NextResponse.rewrite(url, { request: { headers } });
    res.cookies.set("ar_locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  }
  const res = NextResponse.next({ request: { headers } });
  res.cookies.set("ar_locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return res;
}

export const config = {
  // Skip Next internals, static files, API, sitemap & robots
  matcher: ["/((?!_next|api|images|favicon|icon|apple-icon|sitemap|sitemaps|robots|manifest|.*\\.[a-zA-Z0-9]+$).*)"],
};

export const supportedLocales = locales;
