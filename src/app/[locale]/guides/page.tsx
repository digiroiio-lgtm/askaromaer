import { Suspense } from "react";
import { resolveLocale } from "@/i18n";
import { href, locales } from "@/i18n/config";
import { buildMetadata, breadcrumbLd } from "@/lib/seo";
import { getAllCities, getCategories, getGuides, siteStats } from "@/lib/queries";
import { fmt, num } from "@/lib/format";
import { Breadcrumbs, CtaBand, JsonLd, PageHero, SearchPill, StatStrip, SectionHeader, EmptyState } from "@/components/ui";
import { GuideCardH, GuideTile } from "@/components/cards";
import { AutoFilterForm, SortSelect } from "@/components/client";
import { FilterAside, FilterGroup, arr, one, type SP } from "@/components/filters";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<SP> };

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale, t } = await resolveLocale(params);
  const sp = await searchParams;
  return buildMetadata({ locale, path: "/guides", title: t.guides.metaTitle, description: t.guides.metaDescription, image: "/images/guides/bali.jpg", noindex: Object.keys(sp).length > 0 });
}

export default async function GuidesPage({ params, searchParams }: Props) {
  const { locale, t } = await resolveLocale(params);
  const sp = await searchParams;
  const cities = arr(sp, "city");
  const categories = arr(sp, "category");
  const languages = arr(sp, "lang");
  const sort = one(sp, "sort") || "popular";
  const q = one(sp, "q");
  const filtered = !!(q || cities.length || categories.length || languages.length);
  const [guides, all, allCities, cats, stats] = await Promise.all([
    getGuides(locale, { q: q || undefined, cities, categories, languages, sort }),
    getGuides(locale, {}),
    getAllCities(locale),
    getCategories(locale),
    siteStats(),
  ]);
  const count = (pred: (g: (typeof all)[number]) => boolean) => all.filter(pred).length;
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: t.nav.home, url: href(locale) }, { name: t.guides.title, url: href(locale, "/guides") }])} />
      <PageHero title={t.guides.title} subtitle={t.guides.subtitle} image="/images/hero/cities.jpg">
        <SearchPill action={href(locale, "/guides")} placeholder={t.guides.searchPlaceholder} button={t.common.search} defaultValue={q} />
      </PageHero>
      <div className="container-x mt-4"><Breadcrumbs items={[{ name: t.nav.home, href: href(locale) }, { name: t.guides.title }]} /></div>
      <StatStrip items={[
        { icon: "book", title: `${num(stats.guides, locale)} ${t.stats.guides}`, text: t.stats.guidesText },
        { icon: "users", title: `${num(stats.roamers, locale)} ${t.stats.roamers}`, text: t.stats.roamersText },
        { icon: "pin", title: `${num(stats.cities, locale)} ${t.stats.cities}`, text: t.stats.citiesText },
        { icon: "shield", title: t.roamers.stat4Title, text: t.guides.oneTime },
      ]} />
      {!filtered && all.length > 0 && (
        <section className="container-x mt-8">
          <SectionHeader title={t.guides.featured} />
          <div className="scroll-x flex gap-3.5 md:grid md:grid-cols-2 lg:grid-cols-4">{all.slice(0, 4).map((g) => <GuideCardH key={g.id} g={g} locale={locale} t={t} />)}</div>
        </section>
      )}
      <div className="container-x mt-8 grid lg:grid-cols-[210px_1fr] gap-6">
        <Suspense>
          <AutoFilterForm>
            <FilterAside title={t.common.filter} clearHref={href(locale, "/guides")} clearLabel={t.common.clearFilters}>
              {q && <input type="hidden" name="q" value={q} />}
              <FilterGroup title={t.guides.city} name="city" selected={cities} moreLabel={t.common.showMore} options={allCities.map((c) => ({ value: c.slug, label: c.name, count: count((g) => g.citySlug === c.slug) })).filter((o) => o.count > 0)} />
              <FilterGroup title={t.guides.category} name="category" selected={categories} options={cats.map((c) => ({ value: c.slug, label: c.name, count: count((g) => g.categorySlug === c.slug) }))} />
              <FilterGroup title={t.guides.language} name="lang" selected={languages} options={locales.map((l) => ({ value: l, label: t.languages[l], count: count((g) => g.locale === l) })).filter((o) => o.count > 0)} />
            </FilterAside>
          </AutoFilterForm>
        </Suspense>
        <section aria-labelledby="g-h">
          <div className="flex items-center justify-between mb-4 gap-4">
            <h2 id="g-h" className="text-[24px] md:text-[28px]">{fmt(t.guides.count, { n: guides.length })}</h2>
            <Suspense><SortSelect label={t.common.sort} value={sort} options={[{ value: "popular", label: t.sorts.popular }, { value: "newest", label: t.sorts.newest }, { value: "rating", label: t.sorts.rating }, { value: "priceAsc", label: t.sorts.priceAsc }, { value: "priceDesc", label: t.sorts.priceDesc }]} /></Suspense>
          </div>
          {guides.length ? <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{guides.map((g) => <GuideTile key={g.id} g={g} locale={locale} t={t} />)}</div> : <EmptyState text={t.common.noResults} />}
        </section>
      </div>
      <CtaBand title={t.guides.bandTitle} text={t.guides.bandText} cta={t.guides.bandCta} href={href(locale, "/become-a-roamer")} image="/images/hero/cta-coast.jpg" />
    </>
  );
}
