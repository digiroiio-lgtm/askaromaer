import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/config";
import { buildMetadata, breadcrumbLd, collectionLd } from "@/lib/seo";
import { getAllCities, getCategories, getCategory, getGuides, getQuestions, getRoamers } from "@/lib/queries";
import { MIN_INDEX_ITEMS } from "@/lib/constants";
import { fmt } from "@/lib/format";
import { Breadcrumbs, HubCta, JsonLd, SectionHeader, CtaBand, EmptyState } from "@/components/ui";
import { GuideTile, QuestionRow, RoamerCard } from "@/components/cards";

type Props = { params: Promise<{ locale: string; category: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const { category: slug } = await params;
  const cat = await getCategory(locale, slug);
  if (!cat) return {};
  return buildMetadata({
    locale, path: `/categories/${slug}`, title: fmt(t.categories.detailMetaTitle, { category: cat.name }), description: cat.description, image: cat.imageUrl,
    noindex: cat.questionCount + cat.guideCount < MIN_INDEX_ITEMS,
  });
}

export default async function CategoryPage({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const { category: slug } = await params;
  const cat = await getCategory(locale, slug);
  if (!cat) notFound();
  const [questions, guides, roamers, cities, cats] = await Promise.all([
    getQuestions(locale, { categories: [slug], pageSize: 8, sort: "popular" }),
    getGuides(locale, { categories: [slug], take: 3 }),
    getRoamers(locale, { expertise: [slug], pageSize: 3, sort: "rating" }),
    getAllCities(locale),
    getCategories(locale),
  ]);
  const topCities = cities.filter((c) => c.tags.some((tg) => tg.slug === slug)).slice(0, 6);
  const others = cats.filter((c) => c.slug !== slug);
  const url = href(locale, `/categories/${slug}`);
  return (
    <>
      <JsonLd data={[
        breadcrumbLd([{ name: t.nav.home, url: href(locale) }, { name: t.categories.title, url: href(locale, "/categories") }, { name: cat.name, url }]),
        collectionLd({ name: cat.name, description: cat.description, url, items: questions.items.map((q) => ({ name: q.title, url: href(locale, `/questions/${q.slug}`) })) }),
      ]} />
      <section className="relative -mt-[72px] pt-[72px] overflow-hidden">
        <div className="absolute inset-0"><Image src={cat.imageUrl} alt="" fill priority sizes="100vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-teal-950/90 via-teal-950/60 to-teal-950/10" /></div>
        <div className="relative container-x py-12 text-white">
          <div className="[&_*]:!text-white/85"><Breadcrumbs items={[{ name: t.nav.home, href: href(locale) }, { name: t.categories.title, href: href(locale, "/categories") }, { name: cat.name }]} /></div>
          <h1 className="text-white text-[44px] md:text-[56px] mt-3 leading-none">{cat.name}</h1>
          <p className="mt-4 max-w-[640px] text-[16px] md:text-[17px] leading-relaxed text-white/95">{cat.description}</p>
        </div>
      </section>

      <HubCta title={cat.name} primary={t.questions.askButton} primaryHref={href(locale, "/questions/ask", { category: slug })} secondary={t.nav.roamers} secondaryHref={href(locale, "/roamers", { expertise: slug })} />
      <section className="container-x mt-10">
        <SectionHeader title={t.nav.questions} link={href(locale, "/questions", { category: slug })} linkLabel={t.common.seeAll} />
        {questions.items.length ? <div className="space-y-3">{questions.items.map((q) => <QuestionRow key={q.id} q={q} locale={locale} t={t} />)}</div> : <EmptyState text={t.questions.noAnswers} cta={t.questions.askButton} href={href(locale, "/questions/ask", { category: slug })} />}
      </section>
      {roamers.items.length > 0 && (
        <section className="container-x mt-10">
          <SectionHeader title={t.nav.roamers} link={href(locale, "/roamers", { expertise: slug })} linkLabel={t.common.seeAll} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{roamers.items.map((r) => <RoamerCard key={r.id} r={r} locale={locale} t={t} />)}</div>
        </section>
      )}
      {guides.length > 0 && (
        <section className="container-x mt-10">
          <SectionHeader title={t.nav.guides} link={href(locale, "/guides", { category: slug })} linkLabel={t.common.seeAll} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{guides.map((g) => <GuideTile key={g.id} g={g} locale={locale} t={t} />)}</div>
        </section>
      )}
      {topCities.length > 0 && (
        <section className="container-x mt-10">
          <SectionHeader title={t.common.popularCities} link={href(locale, "/cities")} linkLabel={t.common.seeAll} />
          <div className="flex flex-wrap gap-2">{topCities.map((c) => <Link key={c.id} className="chip hover:bg-brand-50" href={href(locale, `/cities/${c.slug}`)}>{c.name}</Link>)}</div>
        </section>
      )}
      <section className="container-x mt-10">
        <SectionHeader title={t.common.relatedTopics} />
        <div className="flex flex-wrap gap-2">{others.map((c) => <Link key={c.id} className="chip hover:bg-brand-50" href={href(locale, `/categories/${c.slug}`)}>{c.name}</Link>)}</div>
      </section>
      <CtaBand title={t.roamers.bandTitle} text={t.roamers.bandText} cta={t.roamers.bandCta} href={href(locale, "/become-a-roamer")} image="/images/hero/cta-coast.jpg" />
    </>
  );
}
