import { Suspense } from "react";
import type { Locale } from "@/i18n/config";
import { href } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/tr";
import { getAllCities, getCategories, getRoamers, roamerFacets } from "@/lib/queries";
import { SPOKEN_LANGUAGES } from "@/lib/constants";
import { fmt } from "@/lib/format";
import { RoamerCard } from "./cards";
import { AutoFilterForm, SortSelect } from "./client";
import { FilterAside, FilterGroup, arr, one, pageNum, type SP } from "./filters";
import { Pagination, EmptyState } from "./ui";

export async function RoamerDirectory({ locale, t, sp, basePath, fixedCity }: { locale: Locale; t: Dictionary; sp: SP; basePath: string; fixedCity?: string }) {
  const cities = fixedCity ? [fixedCity] : arr(sp, "city");
  const expertise = arr(sp, "expertise");
  const languages = arr(sp, "lang");
  const flags = arr(sp, "only");
  const sort = one(sp, "sort") || "featured";
  const page = pageNum(sp);
  const [res, facets, allCities, cats] = await Promise.all([
    getRoamers(locale, { q: one(sp, "q") || undefined, cities, expertise, languages, verified: flags.includes("verified"), available: flags.includes("available"), sort, page }),
    roamerFacets(),
    getAllCities(locale),
    getCategories(locale),
  ]);
  const makeHref = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) for (const x of Array.isArray(v) ? v : v ? [v] : []) if (k !== "page") qs.append(k, x);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return `${href(locale, basePath)}${s ? `?${s}` : ""}`;
  };
  const cityOpts = allCities.map((c) => ({ value: c.slug, label: c.name, count: facets.city.get(c.slug) ?? 0 })).sort((a, b) => b.count - a.count);
  return (
    <div className="container-x mt-8 grid lg:grid-cols-[230px_1fr] gap-6">
      <Suspense>
        <AutoFilterForm>
          <FilterAside title={t.common.filter} clearHref={href(locale, basePath)} clearLabel={t.common.clearFilters}>
            {one(sp, "q") && <input type="hidden" name="q" value={one(sp, "q")} />}
            {!fixedCity && <FilterGroup title={t.roamers.city} name="city" selected={cities} options={cityOpts} moreLabel={t.common.showMore} />}
            <FilterGroup title={t.roamers.expertise} name="expertise" selected={expertise} options={cats.map((c) => ({ value: c.slug, label: c.name, count: facets.exp.get(c.slug) ?? 0 }))} />
            <FilterGroup title={t.roamers.language} name="lang" selected={languages} moreLabel={t.common.showMore} options={SPOKEN_LANGUAGES.map((l) => ({ value: l, label: t.languages[l], count: facets.lang.get(l) ?? 0 })).filter((o) => o.count > 0).sort((a, b) => b.count - a.count)} />
            <FilterGroup title={t.common.status} name="only" selected={flags} options={[{ value: "verified", label: t.roamers.verifiedOnly }, { value: "available", label: t.roamers.availableOnly }]} />
          </FilterAside>
        </AutoFilterForm>
      </Suspense>
      <section aria-labelledby="roamers-h">
        <div className="flex items-center justify-between mb-4 gap-4">
          <h2 id="roamers-h" className="text-[24px] md:text-[28px]">{fmt(t.roamers.count, { n: res.total })}</h2>
          <Suspense><SortSelect label={t.common.sort} value={sort} options={[{ value: "featured", label: t.sorts.featured }, { value: "rating", label: t.sorts.rating }, { value: "priceAsc", label: t.sorts.priceAsc }, { value: "priceDesc", label: t.sorts.priceDesc }]} /></Suspense>
        </div>
        {res.items.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{res.items.map((r) => <RoamerCard key={r.id} r={r} locale={locale} t={t} />)}</div>
        ) : <EmptyState text={fixedCity ? t.roamers.noRoamers : t.common.noResults} cta={t.roamers.bandCta} href={href(locale, "/become-a-roamer")} />}
        <Pagination page={res.page} pages={res.pages} makeHref={makeHref} labels={t.common} />
      </section>
    </div>
  );
}
