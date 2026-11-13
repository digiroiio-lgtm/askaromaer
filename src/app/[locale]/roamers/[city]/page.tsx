import { notFound } from "next/navigation";
import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/config";
import { buildMetadata, breadcrumbLd } from "@/lib/seo";
import { getAllCities, getCity, getGuides, getQuestions } from "@/lib/queries";
import { fmt, num } from "@/lib/format";
import Link from "next/link";
import { PageHero, SearchPill, CtaBand, JsonLd, SectionHeader, Breadcrumbs, HubCta } from "@/components/ui";
import { GuideCardH, QuestionRow } from "@/components/cards";
import { RoamerDirectory } from "@/components/RoamerDirectory";
import type { SP } from "@/components/filters";

type Props = { params: Promise<{ locale: string; city: string }>; searchParams: Promise<SP> };

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale, t } = await resolveLocale(params);
  const { city: slug } = await params;
  const city = await getCity(locale, slug);
  if (!city) return {};
  const sp = await searchParams;
  const vars = { city: city.name, cityIn: city.locative, n: city.roamerCount };
  return buildMetadata({ locale, path: `/roamers/${slug}`, title: fmt(t.roamers.cityMetaTitle, vars), description: fmt(t.roamers.cityMetaDescription, vars), image: city.imageUrl, noindex: city.roamerCount === 0 || Object.keys(sp).length > 0 });
}

export default async function CityRoamersPage({ params, searchParams }: Props) {
  const { locale, t } = await resolveLocale(params);
  const { city: slug } = await params;
  const sp = await searchParams;
  const city = await getCity(locale, slug);
  if (!city) notFound();
  const vars = { city: city.name, cityIn: city.locative, n: num(city.roamerCount, locale) };
  const others = (await getAllCities(locale)).filter((c) => c.slug !== slug && c.roamerCount > 0).slice(0, 8);
  const [questions, guides] = await Promise.all([getQuestions(locale, { cities: [slug], pageSize: 3, sort: "popular" }), getGuides(locale, { cities: [slug], take: 4 })]);
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: t.nav.home, url: href(locale) }, { name: t.nav.roamers, url: href(locale, "/roamers") }, { name: city.name, url: href(locale, `/roamers/${slug}`) }])} />
      <PageHero title={fmt(t.roamers.cityTitle, vars)} subtitle={fmt(t.roamers.cityIntro, vars)} image={city.imageUrl}>
        <SearchPill action={href(locale, `/roamers/${slug}`)} placeholder={t.roamers.searchPlaceholder} button={t.common.search} />
      </PageHero>
      <div className="container-x mt-4"><Breadcrumbs items={[{ name: t.nav.home, href: href(locale) }, { name: t.nav.roamers, href: href(locale, "/roamers") }, { name: city.name }]} /></div>
      <RoamerDirectory locale={locale} t={t} sp={sp} basePath={`/roamers/${slug}`} fixedCity={slug} />
      <HubCta trackPage="city_roamers" title={fmt(t.cities.askAbout, vars)} primary={t.questions.askButton} primaryHref={href(locale, "/questions/ask", { city: slug })} />
      {questions.items.length > 0 && (
        <section className="container-x mt-12">
          <SectionHeader title={fmt(t.cities.cityQuestions, vars)} link={href(locale, "/questions", { city: slug })} linkLabel={t.common.seeAll} />
          <div className="space-y-3">{questions.items.map((q) => <QuestionRow key={q.id} q={q} locale={locale} t={t} />)}</div>
        </section>
      )}
      {guides.length > 0 && (
        <section className="container-x mt-10">
          <SectionHeader title={fmt(t.cities.cityGuides, vars)} link={href(locale, "/guides", { city: slug })} linkLabel={t.common.seeAll} />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3.5">{guides.map((g) => <GuideCardH key={g.id} g={g} locale={locale} t={t} />)}</div>
        </section>
      )}
      {others.length > 0 && (
        <section className="container-x mt-10">
          <SectionHeader title={t.common.otherCities} link={href(locale, `/cities/${slug}`)} linkLabel={city.name} />
          <div className="flex flex-wrap gap-2">{others.map((c) => <Link key={c.id} className="chip hover:bg-brand-50" href={href(locale, `/roamers/${c.slug}`)}>{c.name}</Link>)}</div>
        </section>
      )}
      <CtaBand title={t.roamers.bandTitle} text={t.roamers.bandText} cta={t.roamers.bandCta} href={href(locale, "/become-a-roamer")} image="/images/hero/cta-coast.jpg" />
    </>
  );
}
