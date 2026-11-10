import Link from "next/link";
import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/config";
import { buildMetadata, breadcrumbLd } from "@/lib/seo";
import { getAllCities, siteStats } from "@/lib/queries";
import { num } from "@/lib/format";
import { Breadcrumbs, PageHero, SearchPill, StatStrip, CtaBand, JsonLd } from "@/components/ui";
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
  const [stats, cities] = await Promise.all([siteStats(), getAllCities(locale)]);
  const roamerCities = cities.filter((c) => c.roamerCount > 0);
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: t.nav.home, url: href(locale) }, { name: t.nav.roamers, url: href(locale, "/roamers") }])} />
      <PageHero title={<>{t.roamers.titleA} <em className="text-brand italic">{t.roamers.titleB}</em></>} subtitle={t.roamers.subtitle} image="/images/hero/roamers.jpg" imagePosition="40% center">
        <SearchPill action={href(locale, "/roamers")} placeholder={t.roamers.searchPlaceholder} button={t.common.search} defaultValue={typeof sp.q === "string" ? sp.q : ""} />
      </PageHero>
      <div className="container-x mt-4"><Breadcrumbs items={[{ name: t.nav.home, href: href(locale) }, { name: t.nav.roamers }]} /></div>
      <StatStrip items={[
        { icon: "users", title: num(stats.roamers, locale), text: t.roamers.stat1 },
        { icon: "calendar", title: t.roamers.stat2Title, text: t.roamers.stat2Text },
        { icon: "star", title: stats.avgRating ? `${stats.avgRating.toFixed(1)} / 5` : "—", text: t.roamers.stat3Text },
        { icon: "shield", title: t.roamers.stat4Title, text: t.roamers.stat4Text },
      ]} />
      <RoamerDirectory locale={locale} t={t} sp={sp} basePath="/roamers" />
      {roamerCities.length > 0 && (
        <section className="container-x mt-10">
          <h2 className="text-[26px] mb-3">{t.common.popularCities}</h2>
          <div className="flex flex-wrap gap-2">{roamerCities.map((c) => <Link key={c.id} className="chip hover:bg-brand-50" href={href(locale, `/roamers/${c.slug}`)}>{c.name}</Link>)}</div>
        </section>
      )}
      <CtaBand title={t.roamers.bandTitle} text={t.roamers.bandText} cta={t.roamers.bandCta} href={href(locale, "/become-a-roamer")} image="/images/hero/cta-coast.jpg" />
    </>
  );
}
