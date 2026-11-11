import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/config";
import { buildMetadata, breadcrumbLd, collectionLd } from "@/lib/seo";
import { MIN_INDEX_ITEMS } from "@/lib/constants";
import { getCategories, getCity, getGuides, getQuestions, getRoamers } from "@/lib/queries";
import { fmt } from "@/lib/format";
import { Breadcrumbs, HubCta, JsonLd, SectionHeader, CtaBand, EmptyState } from "@/components/ui";
import { GuideTile, QuestionRow, RoamerCard } from "@/components/cards";

type Props = { params: Promise<{ locale: string; city: string; category: string }> };

async function load(locale: Parameters<typeof getCity>[0], citySlug: string, catSlug: string) {
  const [city, cats] = await Promise.all([getCity(locale, citySlug), getCategories(locale)]);
  const cat = cats.find((c) => c.slug === catSlug);
  if (!city || !cat) return null;
  const [questions, guides, roamers] = await Promise.all([
    getQuestions(locale, { cities: [citySlug], categories: [catSlug], pageSize: 8, sort: "popular" }),
    getGuides(locale, { cities: [citySlug], categories: [catSlug], take: 3 }),
    getRoamers(locale, { cities: [citySlug], expertise: [catSlug], pageSize: 3, sort: "rating" }),
  ]);
  return { city, cat, cats, questions, guides, roamers, total: questions.total + guides.length + roamers.total };
}

export async function generateMetadata({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const { city: c, category: k } = await params;
  const d = await load(locale, c, k);
  if (!d) return {};
  const vars = { city: d.city.name, cityIn: d.city.locative, category: d.cat.name };
  return buildMetadata({ locale, path: `/cities/${c}/${k}`, title: fmt(t.cityCategory.metaTitle, vars), description: fmt(t.cityCategory.intro, vars), image: d.city.imageUrl, noindex: d.total < MIN_INDEX_ITEMS });
}

export default async function CityCategoryPage({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const { city: c, category: k } = await params;
  const d = await load(locale, c, k);
  if (!d) notFound();
  const { city, cat, cats, questions, guides, roamers } = d;
  const vars = { city: city.name, cityIn: city.locative, category: cat.name };
  const title = fmt(t.cityCategory.title, vars);
  const url = href(locale, `/cities/${c}/${k}`);
  return (
    <>
      <JsonLd data={[
        breadcrumbLd([{ name: t.nav.home, url: href(locale) }, { name: t.cities.title, url: href(locale, "/cities") }, { name: city.name, url: href(locale, `/cities/${c}`) }, { name: cat.name, url }]),
        collectionLd({ name: title, description: fmt(t.cityCategory.intro, vars), url, items: questions.items.map((q) => ({ name: q.title, url: href(locale, `/questions/${q.slug}`) })) }),
      ]} />
      <section className="relative -mt-[72px] pt-[72px] overflow-hidden">
        <div className="absolute inset-0"><Image src={city.imageUrl} alt="" fill priority sizes="100vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-teal-950/90 via-teal-950/60 to-teal-950/10" /></div>
        <div className="relative container-x py-12 text-white">
          <div className="[&_*]:!text-white/85"><Breadcrumbs items={[{ name: t.nav.home, href: href(locale) }, { name: t.cities.title, href: href(locale, "/cities") }, { name: city.name, href: href(locale, `/cities/${c}`) }, { name: cat.name }]} /></div>
          <h1 className="text-white text-[40px] md:text-[52px] mt-3 leading-tight">{title}</h1>
          <p className="mt-4 max-w-[640px] text-[16px] md:text-[17px] leading-relaxed text-white/95">{fmt(t.cityCategory.intro, vars)}</p>
        </div>
      </section>

      <HubCta trackPage="city_category" title={fmt(t.cities.askAbout, vars)} primary={t.questions.askButton} primaryHref={href(locale, "/questions/ask", { city: c, category: k })} secondary={t.cities.exploreRoamers} secondaryHref={href(locale, `/roamers/${c}`)} />

      <section className="container-x mt-10">
        <SectionHeader title={t.nav.questions} link={href(locale, "/questions", { city: c, category: k })} linkLabel={t.common.seeAll} />
        {questions.items.length ? <div className="space-y-3">{questions.items.map((q) => <QuestionRow key={q.id} q={q} locale={locale} t={t} />)}</div> : <EmptyState text={t.questions.noAnswers} cta={t.questions.askButton} href={href(locale, "/questions/ask", { city: c, category: k })} />}
      </section>
      {roamers.items.length > 0 && (
        <section className="container-x mt-10">
          <SectionHeader title={t.nav.roamers} link={href(locale, `/roamers/${c}`)} linkLabel={t.common.seeAll} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{roamers.items.map((r) => <RoamerCard key={r.id} r={r} locale={locale} t={t} />)}</div>
        </section>
      )}
      {guides.length > 0 && (
        <section className="container-x mt-10">
          <SectionHeader title={t.nav.guides} link={href(locale, "/guides", { city: c, category: k })} linkLabel={t.common.seeAll} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{guides.map((g) => <GuideTile key={g.id} g={g} locale={locale} t={t} />)}</div>
        </section>
      )}
      <section className="container-x mt-10">
        <SectionHeader title={t.common.relatedTopics} />
        <div className="flex flex-wrap gap-2">
          <Link className="chip hover:bg-brand-50" href={href(locale, `/cities/${c}`)}>{city.name}</Link>
          <Link className="chip hover:bg-brand-50" href={href(locale, `/categories/${k}`)}>{cat.name}</Link>
          {cats.filter((x) => x.slug !== k).map((x) => <Link key={x.id} className="chip hover:bg-brand-50" href={href(locale, `/cities/${c}/${x.slug}`)}>{x.name}</Link>)}
        </div>
      </section>
      <CtaBand title={t.roamers.bandTitle} text={t.roamers.bandText} cta={t.roamers.bandCta} href={href(locale, "/become-a-roamer")} image="/images/hero/cta-coast.jpg" />
    </>
  );
}
