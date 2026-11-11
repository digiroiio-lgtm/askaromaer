import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/config";
import { buildMetadata, breadcrumbLd, faqLd } from "@/lib/seo";
import { getAllCities, getCategories, getCity, getCityCategoryCounts, getGuides, getQuestions, getRoamers } from "@/lib/queries";
import { MIN_INDEX_ITEMS } from "@/lib/constants";
import { fmt, num } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { Breadcrumbs, HubContent, HubCta, JsonLd, SectionHeader, CtaBand, EmptyState } from "@/components/ui";
import { GuideTile, QuestionRow, RoamerCard } from "@/components/cards";

type Props = { params: Promise<{ locale: string; city: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const { city: slug } = await params;
  const city = await getCity(locale, slug);
  if (!city) return {};
  return buildMetadata({ locale, path: `/cities/${slug}`, title: fmt(t.cities.detailMetaTitle, { city: city.name, cityIn: city.locative }), description: city.intro, image: city.imageUrl, noindex: city.questionCount + city.roamerCount + city.guideCount < MIN_INDEX_ITEMS });
}

export default async function CityPage({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const { city: slug } = await params;
  const city = await getCity(locale, slug);
  if (!city) notFound();
  const [allCities, cats, counts] = await Promise.all([getAllCities(locale), getCategories(locale), getCityCategoryCounts()]);
  const sameRegion = allCities.filter((c) => c.slug !== slug && c.region === city.region);
  const related = [...sameRegion, ...allCities.filter((c) => c.slug !== slug && c.region !== city.region)].slice(0, 6);
  const [roamers, questions, guides] = await Promise.all([
    getRoamers(locale, { cities: [slug], pageSize: 3 }),
    getQuestions(locale, { cities: [slug], pageSize: 5 }),
    getGuides(locale, { cities: [slug], take: 3 }),
  ]);
  const vars = { city: city.name, cityIn: city.locative };
  return (
    <>
      <JsonLd data={[
        breadcrumbLd([{ name: t.nav.home, url: href(locale) }, { name: t.cities.title, url: href(locale, "/cities") }, { name: city.name, url: href(locale, `/cities/${slug}`) }]),
        { "@context": "https://schema.org", "@type": "Place", name: city.name, description: city.intro, url: `${href(locale, `/cities/${slug}`)}`, containedInPlace: { "@type": "Country", name: city.country }, address: { "@type": "PostalAddress", addressCountry: city.country }, image: city.imageUrl },
        ...(city.faq.length ? [faqLd(city.faq)] : []),
      ]} />
      <section className="relative -mt-[72px] pt-[72px] overflow-hidden">
        <div className="absolute inset-0"><Image src={city.imageUrl} alt="" fill priority sizes="100vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-teal-950/90 via-teal-950/60 to-teal-950/10" /></div>
        <div className="relative container-x py-12 text-white">
          <div className="[&_*]:!text-white/85"><Breadcrumbs items={[{ name: t.nav.home, href: href(locale) }, { name: t.cities.title, href: href(locale, "/cities") }, { name: city.name }]} /></div>
          <h1 className="text-white text-[48px] md:text-[64px] mt-3 leading-none">{city.name}</h1>
          <p className="mt-2 inline-flex items-center gap-1.5 text-white/90"><Icon name="pin" size={16} />{city.country}</p>
          <p className="mt-4 max-w-[640px] text-[16px] md:text-[17px] leading-relaxed text-white/95">{city.intro}</p>
          <div className="mt-6 flex flex-wrap gap-6 text-[14px]">
            <span><b className="text-[20px]">{num(city.questionCount, locale)}</b> {t.common.questions}</span>
            <span><b className="text-[20px]">{num(city.roamerCount, locale)}</b> {t.common.roamers}</span>
            <span><b className="text-[20px]">{num(city.guideCount, locale)}</b> {t.common.guides}</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={href(locale, `/roamers/${slug}`)} className="btn btn-primary px-6 py-3">{t.cities.exploreRoamers} <Icon name="arrowRight" size={18} /></Link>
            <Link href={href(locale, "/questions/ask", { city: slug })} className="btn bg-white text-teal-900 px-6 py-3">{fmt(t.cities.askAbout, vars)}</Link>
          </div>
        </div>
      </section>

      <HubContent title={city.name} body={city.body} faq={city.faq} faqTitle={t.common.faqTitle} />
      <HubCta trackPage="city" title={fmt(t.cities.askAbout, vars)} primary={t.questions.askButton} primaryHref={href(locale, "/questions/ask", { city: slug })} secondary={t.cities.exploreRoamers} secondaryHref={href(locale, `/roamers/${slug}`)} />
      <section className="container-x mt-10">
        <SectionHeader title={fmt(t.cities.cityRoamers, vars)} link={href(locale, `/roamers/${slug}`)} linkLabel={t.common.seeAll} />
        {roamers.items.length ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{roamers.items.map((r) => <RoamerCard key={r.id} r={r} locale={locale} t={t} />)}</div> : <EmptyState text={t.roamers.noRoamers} cta={t.roamers.bandCta} href={href(locale, "/become-a-roamer")} />}
      </section>
      <section className="container-x mt-10">
        <SectionHeader title={fmt(t.cities.cityQuestions, vars)} link={href(locale, "/questions", { city: slug })} linkLabel={t.common.seeAll} />
        {questions.items.length ? <div className="space-y-3">{questions.items.map((q) => <QuestionRow key={q.id} q={q} locale={locale} t={t} />)}</div> : <EmptyState text={t.questions.noAnswers} cta={t.questions.askButton} href={href(locale, "/questions/ask", { city: slug })} />}
      </section>
      {guides.length > 0 && (
        <section className="container-x mt-10">
          <SectionHeader title={fmt(t.cities.cityGuides, vars)} link={href(locale, "/guides", { city: slug })} linkLabel={t.common.seeAll} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{guides.map((g) => <GuideTile key={g.id} g={g} locale={locale} t={t} />)}</div>
        </section>
      )}
      <section className="container-x mt-10">
        <SectionHeader title={t.common.relatedTopics} />
        <div className="flex flex-wrap gap-2">{cats.map((c) => <Link key={c.id} className="chip hover:bg-brand-50" href={(counts.get(`${slug}:${c.slug}`) ?? 0) >= MIN_INDEX_ITEMS ? href(locale, `/cities/${slug}/${c.slug}`) : href(locale, `/categories/${c.slug}`)}>{c.name}</Link>)}</div>
      </section>
      <section className="container-x mt-8">
        <SectionHeader title={t.common.otherCities} link={href(locale, "/cities")} linkLabel={t.common.seeAll} />
        <div className="flex flex-wrap gap-2">{related.map((c) => <Link key={c.id} className="chip hover:bg-brand-50" href={href(locale, `/cities/${c.slug}`)}>{c.name}</Link>)}</div>
      </section>
      <CtaBand title={t.roamers.bandTitle} text={t.roamers.bandText} cta={t.roamers.bandCta} href={href(locale, "/become-a-roamer")} image="/images/hero/cta-coast.jpg" />
    </>
  );
}
