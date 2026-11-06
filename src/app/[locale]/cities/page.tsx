import Link from "next/link";
import { Suspense } from "react";
import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/config";
import { buildMetadata, breadcrumbLd } from "@/lib/seo";
import { getAllCities, getCategories, getQuestions, getRoamers, siteStats } from "@/lib/queries";
import { REGIONS } from "@/lib/constants";
import { fmt, num } from "@/lib/format";
import { PageHero, SearchPill, StatStrip, CtaBand, JsonLd, SectionHeader, EmptyState } from "@/components/ui";
import { CityTile, QuestionRow, RoamerMini } from "@/components/cards";
import { AutoFilterForm, SortSelect } from "@/components/client";
import { FilterAside, FilterGroup, arr, one, type SP } from "@/components/filters";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<SP> };

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale, t } = await resolveLocale(params);
  const sp = await searchParams;
  const filtered = Object.keys(sp).length > 0;
  return buildMetadata({ locale, path: "/cities", title: t.cities.metaTitle, description: t.cities.metaDescription, image: "/images/hero/cities.jpg", noindex: filtered });
}

export default async function CitiesPage({ params, searchParams }: Props) {
  const { locale, t } = await resolveLocale(params);
  const sp = await searchParams;
  const q = one(sp, "q").trim().toLowerCase();
  const regions = arr(sp, "region");
  const themes = arr(sp, "theme");
  const sort = one(sp, "sort") || "popular";
  const [all, cats, stats, questions, roamers] = await Promise.all([getAllCities(locale), getCategories(locale), siteStats(), getQuestions(locale, { sort: "popular", pageSize: 4 }), getRoamers(locale, { pageSize: 3, sort: "rating" })]);

  let cities = all.filter((c) =>
    (!q || c.name.toLowerCase().includes(q) || c.slug.includes(q) || c.country.toLowerCase().includes(q)) &&
    (!regions.length || regions.includes(c.region)) &&
    (!themes.length || c.tags.some((tg) => themes.includes(tg.slug))),
  );
  cities = [...cities].sort((a, b) =>
    sort === "name" ? a.name.localeCompare(b.name, locale) : sort === "newest" ? 0 : b.questionCount + b.roamerCount * 3 - (a.questionCount + a.roamerCount * 3),
  );
  const topSlug = [...all].sort((a, b) => b.questionCount - a.questionCount)[0]?.slug;
  const filtered = q || regions.length || themes.length;
  const regionCount = (r: string) => all.filter((c) => c.region === r).length;
  const themeCount = (slug: string) => all.filter((c) => c.tags.some((tg) => tg.slug === slug)).length;

  return (
    <>
      <JsonLd data={[breadcrumbLd([{ name: t.nav.home, url: href(locale) }, { name: t.cities.title, url: href(locale, "/cities") }]), {
        "@context": "https://schema.org", "@type": "ItemList", name: t.cities.title,
        itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, url: `${href(locale, `/cities/${c.slug}`)}` })),
      }]} />
      <PageHero title={t.cities.title} subtitle={t.cities.subtitle} image="/images/hero/cities.jpg">
        <SearchPill action={href(locale, "/cities")} placeholder={t.cities.searchPlaceholder} defaultValue={one(sp, "q")} />
      </PageHero>
      <StatStrip items={[
        { icon: "pin", title: `${num(stats.cities, locale)} ${t.stats.cities}`, text: t.stats.citiesText },
        { icon: "users", title: `${num(stats.roamers, locale)} ${t.stats.roamers}`, text: t.stats.roamersText },
        { icon: "chatRound", title: `${num(stats.questions, locale)} ${t.stats.questions}`, text: t.stats.questionsText },
        { icon: "book", title: `${num(stats.guides, locale)} ${t.stats.guides}`, text: t.stats.guidesText },
      ]} />

      <div className="container-x mt-8 grid lg:grid-cols-[210px_1fr] gap-6">
        <Suspense>
          <AutoFilterForm>
            <FilterAside title={t.common.filter} clearHref={href(locale, "/cities")} clearLabel={t.common.clearFilters}>
              {one(sp, "q") && <input type="hidden" name="q" value={one(sp, "q")} />}
              <FilterGroup title={t.cities.region} name="region" selected={regions} limit={6} options={REGIONS.map((r) => ({ value: r, label: t.regions[r], count: regionCount(r) })).filter((o) => o.count > 0)} />
              <FilterGroup title={t.cities.theme} name="theme" selected={themes} options={cats.map((c) => ({ value: c.slug, label: c.name, count: themeCount(c.slug) }))} />
            </FilterAside>
          </AutoFilterForm>
        </Suspense>
        <section aria-labelledby="cities-h">
          <div className="flex items-center justify-between mb-4 gap-4">
            <h2 id="cities-h" className="text-[24px] md:text-[26px]">{fmt(filtered ? t.cities.countFiltered : t.cities.count, { n: cities.length })}</h2>
            <Suspense><SortSelect label={t.common.sort} value={sort} options={[{ value: "popular", label: t.sorts.popular }, { value: "name", label: t.sorts.name }]} /></Suspense>
          </div>
          {cities.length ? (
            <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {cities.map((c) => <CityTile key={c.id} c={c} locale={locale} t={t} popular={c.slug === topSlug} />)}
            </div>
          ) : <EmptyState text={t.common.noResults} />}
        </section>
      </div>

      <div className="container-x mt-12 grid lg:grid-cols-[1.4fr_1fr] gap-8">
        <section>
          <SectionHeader title={t.cities.popularQuestions} link={href(locale, "/questions")} linkLabel={t.home.allQuestions} />
          <div className="space-y-3">{questions.items.map((qq) => <QuestionRow key={qq.id} q={qq} locale={locale} t={t} />)}</div>
        </section>
        <section>
          <SectionHeader title={t.cities.roamerPreview} link={href(locale, "/roamers")} linkLabel={t.home.allRoamers} />
          <div className="grid gap-3">{roamers.items.map((r) => <RoamerMini key={r.id} r={r} locale={locale} t={t} />)}</div>
        </section>
      </div>

      <CtaBand title={t.cities.bandTitle} text={t.cities.bandText} cta={t.cities.bandCta} href={href(locale, "/questions/ask", { category: "relocation" })} image="/images/hero/cta-coast.jpg" />
      <p className="sr-only"><Link href={href(locale, "/roamers")}>{t.nav.roamers}</Link></p>
    </>
  );
}
