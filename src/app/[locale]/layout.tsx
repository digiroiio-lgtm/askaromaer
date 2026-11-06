import "../globals.css";
import type { Metadata, Viewport } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/components/ui";
import { resolveLocale } from "@/i18n";
import { hreflangCodes, href } from "@/i18n/config";
import { SITE_URL } from "@/lib/constants";

export const viewport: Viewport = { themeColor: "#0e3d3b", width: "device-width", initialScale: 1 };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t.meta.homeTitle, template: "%s" },
    description: t.meta.homeDescription,
    applicationName: "AskARoamer",
    icons: { icon: "/icon.svg" },
  };
}

// Every page reads the session cookie (header, permissions), so render per request (SSR).
export const dynamic = "force-dynamic";

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  return (
    <html lang={hreflangCodes[locale]}>
      <body className="min-h-screen flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:left-4 focus:top-4 btn btn-primary px-4 py-2">Skip to content</a>
        <JsonLd
          data={[
            { "@context": "https://schema.org", "@type": "Organization", name: "AskARoamer", url: SITE_URL, logo: `${SITE_URL}/icon.svg`, slogan: "Know before you go." },
            { "@context": "https://schema.org", "@type": "WebSite", name: "AskARoamer", url: `${SITE_URL}${href(locale)}`, inLanguage: hreflangCodes[locale], potentialAction: { "@type": "SearchAction", target: `${SITE_URL}${href(locale, "/questions")}?q={search_term_string}`, "query-input": "required name=search_term_string" } },
          ]}
        />
        <Header locale={locale} t={t} />
        <main id="main" className="flex-1">{children}</main>
        <Footer locale={locale} t={t} />
      </body>
    </html>
  );
}
