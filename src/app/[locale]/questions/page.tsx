import Link from "next/link";
import { LanguageNote } from "@/components/LanguageNote";
import Image from "next/image";
import { Suspense } from "react";
import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/config";
import { buildMetadata, breadcrumbLd } from "@/lib/seo";
import { getAllCities, getCategories, getGuides, getQuestions, getRoamers, questionFacets, siteStats } from "@/lib/queries";
import { num } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { Avatar, Breadcrumbs, CtaBand, JsonLd, PageHero, Pagination, SearchPill, StatStrip, Stars, EmptyState } from "@/components/ui";
import { QuestionRow } from "@/components/cards";
import { AutoFilterForm, SortSelect } from "@/components/client";
import { FilterAside, FilterGroup, arr, one, pageNum, type SP } from "@/components/filters";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<SP> };

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale, t } = await resolveLocale(params);
  const sp = await searchParams;
  return buildMetadata({ locale, path: "/questions", title: t.questions.metaTitle, description: t.questions.metaDescription, image: "/images/hero/questions.jpg", noindex: Object.keys(sp).some((k) => k !== "page") });
}

export default async function QuestionsPage({ params, searchParams }: Props) {
  const { locale, t } = await resolveLocale(params);
  const sp = await searchParams;
  const cities = arr(sp, "city");
  const categories = arr(sp, "category");
  const state = arr(sp, "state");
  const sort = one(sp, "sort") || "newest";
  const q = one(sp, "q");
  const [res, facets, allCities, cats, stats, active, guides] = await Promise.all([
    getQuestions(locale, { q: q || undefined, cities, categories, state, sort, page: pageNum(sp) }),
    questionFacets(),
    getAllCities(locale),
    getCategories(locale),
    siteStats(),
    getRoamers(locale, { pageSize: 3 }),
    getGuides(locale, { take: 1 }),
  ]);
  const guide = guides[0];
  const makeHref = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) for (const x of Array.isArray(v) ? v : v ? [v] : []) if (k !== "page") qs.append(k, x);
    if (p > 1) qs.set("page", String(p));
    return `${href(locale, "/questions")}${qs.toString() ? `?${qs}` : ""}`;
  };
  const askHref = href(locale, "/questions/ask", { city: cities[0], category: categories[0], title: q || undefined });
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: t.nav.home, url: href(locale) }, { name: t.nav.questions, url: href(locale, "/questions") }])} />
      <PageHero title={<>{t.questions.titleA} <em className="text-brand italic">{t.questions.titleB}</em></>} subtitle={t.questions.subtitle} image="/images/hero/questions.jpg">
        <SearchPill action={href(locale, "/questions")} placeholder={t.questions.searchPlaceholder} button={t.common.search} defaultValue={q} />
      </PageHero>
      <div className="container-x mt-4"><Breadcrumbs items={[{ name: t.nav.home, href: href(locale) }, { name: t.nav.questions }]} /></div>
      <StatStrip items={[
        { icon: "chatRound", title: num(stats.questions, locale), text: t.questions.stat1 },
        { icon: "users", title: `${num(stats.roamers, locale)} ${t.stats.roamers}`, text: t.questions.stat2 },
        { icon: "bolt", title: t.questions.stat3Title, text: t.questions.stat3Text },
        { icon: "shield", title: t.questions.stat4Title, text: t.questions.stat4Text },
      ]} />
      <LanguageNote locale={locale} t={t} items={res.items} city={cities[0]} category={categories[0]} />
      <div className="container-x mt-8 grid lg:grid-cols-[180px_1fr_260px] gap-6">
        <Suspense>
          <AutoFilterForm>
            <FilterAside title={t.common.filter} clearHref={href(locale, "/questions")} clearLabel={t.common.clearFilters}>
              {q && <input type="hidden" name="q" value={q} />}
              <FilterGroup title={t.questions.city} name="city" selected={cities} moreLabel={t.common.showMore} options={allCities.map((c) => ({ value: c.slug, label: c.name, count: facets.city.get(c.id) ?? 0 })).sort((a, b) => b.count - a.count)} />
              <FilterGroup title={t.questions.category} name="category" selected={categories} options={cats.map((c) => ({ value: c.slug, label: c.name, count: facets.cat.get(c.id) ?? 0 }))} />
              <FilterGroup title={t.questions.state} name="state" selected={state} options={[{ value: "answered", label: t.questions.answered, count: facets.answered }, { value: "unanswered", label: t.questions.unanswered, count: facets.unanswered }]} />
            </FilterAside>
          </AutoFilterForm>
        </Suspense>
        <section aria-labelledby="q-h" className="min-w-0">
          <div className="flex items-center justify-between mb-4 gap-4">
            <h2 id="q-h" className="text-[24px] md:text-[28px]">{t.questions.all} <span className="font-sans text-[18px] text-ink-2">({num(res.total, locale)})</span></h2>
            <Suspense><SortSelect label={t.common.sort} value={sort} options={[{ value: "newest", label: t.questions.sortNewest }, { value: "popular", label: t.questions.sortPopular }]} /></Suspense>
          </div>
          {res.items.length ? <div className="space-y-3">{res.items.map((qq) => <QuestionRow key={qq.id} q={qq} locale={locale} t={t} />)}</div> : <EmptyState text={t.common.noResults} cta={t.questions.askButton} href={askHref} />}
          <Pagination page={res.page} pages={res.pages} makeHref={makeHref} labels={t.common} />
        </section>
        <aside className="space-y-5">
          <div className="card p-5 bg-cream-2/60">
            <h2 className="text-[26px] flex items-center gap-2"><Icon name="chatRound" size={30} className="text-brand" />{t.questions.askCardTitle}</h2>
            <p className="text-[14px] text-ink-2 mt-2 leading-relaxed">{t.questions.askCardText}</p>
            <Link href={askHref} className="btn btn-primary w-full py-3 mt-4">{t.questions.askButton} <Icon name="arrowRight" size={18} /></Link>
          </div>
          <div className="card p-5">
            <h2 className="text-[22px] mb-3">{t.questions.activeRoamers}</h2>
            <ul className="space-y-3">
              {active.items.map((r) => (
                <li key={r.id}>
                  <Link href={href(locale, `/roamer/${r.slug}`)} className="flex items-center gap-3 hover:text-brand">
                    <Avatar src={r.avatarUrl} name={r.name} size={40} />
                    <span className="text-[13px] leading-tight flex-1"><b className="block text-ink text-[14px]">{r.name}</b><span className="text-ink-2">{r.cityName} · {r.yearsInCity} {t.common.years}</span></span>
                    {r.rating && <Stars value={r.rating.avg} />}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={href(locale, "/roamers")} className="link-orange text-[13px] mt-4 flex justify-end">{t.questions.seeRoamers} <Icon name="arrowRight" size={15} /></Link>
          </div>
          {guide && (
            <div className="card p-5">
              <h2 className="text-[22px] mb-3">{t.questions.popularGuide}</h2>
              <div className="flex gap-3">
                <div className="relative w-[96px] h-[120px] rounded-xl overflow-hidden flex-none"><Image src={guide.coverUrl} alt="" fill sizes="96px" className="object-cover" /></div>
                <div className="min-w-0">
                  <h3 className="text-[19px] leading-tight">{guide.title}</h3>
                  <p className="text-[12.5px] text-ink-2 mt-1 line-clamp-3">{guide.summary}</p>
                  {guide.rating && <Stars className="mt-1.5" value={guide.rating.avg} count={guide.rating.count} />}
                </div>
              </div>
              <Link href={href(locale, `/guides/${guide.slug}`)} className="btn btn-ghost-orange w-full py-2.5 mt-4 text-[14px]">{t.questions.viewGuide} <Icon name="arrowRight" size={16} /></Link>
            </div>
          )}
        </aside>
      </div>
      <CtaBand title={t.questions.bandTitle} text={t.questions.bandText} cta={t.questions.bandCta} href={href(locale, "/become-a-roamer")} image="/images/hero/cta-coast.jpg" />
    </>
  );
}
