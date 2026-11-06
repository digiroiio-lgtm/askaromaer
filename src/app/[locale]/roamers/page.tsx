import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/config";
import { buildMetadata, breadcrumbLd } from "@/lib/seo";
import { siteStats } from "@/lib/queries";
import { num } from "@/lib/format";
import { PageHero, SearchPill, StatStrip, CtaBand, JsonLd } from "@/components/ui";
import { RoamerDirectory } from "@/components/RoamerDirectory";
import type { SP } from "@/components/filters";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<SP> };

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale, t } = await resolveLocale(params);
  const sp = await searchParams;
  const onlyPage = Object.keys(sp).every((k) => k === "page");
  return buildMetadata({ locale, path: "/roamers", title: t.roamers.metaTitle, description: t.roamers.metaDescription, image: "/images/hero/roamers.jpg", noindex: !onlyPage });
}

export default async function RoamersPage({ params, searchParams }: Props) {
  const { locale, t } = await resolveLocale(params);
  const sp = await searchParams;
  const stats = await siteStats();
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: t.nav.home, url: href(locale) }, { name: t.nav.roamers, url: href(locale, "/roamers") }])} />
      <PageHero title={<>{t.roamers.titleA} <em className="text-brand italic">{t.roamers.titleB}</em></>} subtitle={t.roamers.subtitle} image="/images/hero/roamers.jpg" imagePosition="40% center">
        <SearchPill action={href(locale, "/roamers")} placeholder={t.roamers.searchPlaceholder} button={t.common.search} defaultValue={typeof sp.q === "string" ? sp.q : ""} />
      </PageHero>
      <StatStrip items={[
        { icon: "users", title: num(stats.roamers, locale), text: t.roamers.stat1 },
        { icon: "calendar", title: t.roamers.stat2Title, text: t.roamers.stat2Text },
        { icon: "star", title: stats.avgRating ? `${stats.avgRating.toFixed(1)} / 5` : "—", text: t.roamers.stat3Text },
        { icon: "shield", title: t.roamers.stat4Title, text: t.roamers.stat4Text },
      ]} />
      <RoamerDirectory locale={locale} t={t} sp={sp} basePath="/roamers" />
      <CtaBand title={t.roamers.bandTitle} text={t.roamers.bandText} cta={t.roamers.bandCta} href={href(locale, "/become-a-roamer")} image="/images/hero/cta-coast.jpg" />
    </>
  );
}
