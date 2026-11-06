import Link from "next/link";
import Image from "next/image";
import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/config";
import { buildMetadata } from "@/lib/seo";
import { getAllCities, getCategories, getGuides, getQuestions, getRoamers, siteStats, firstAnswer, pickTr } from "@/lib/queries";
import { fmt, num, timeAgo } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { Avatar, SectionHeader, StatStrip } from "@/components/ui";
import { CategoryCard, CityCardCompact, GuideCardH, RoamerMini } from "@/components/cards";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  return buildMetadata({ locale, path: "/", title: t.meta.homeTitle, description: t.meta.homeDescription });
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const [cats, cities, questions, roamers, guides, stats] = await Promise.all([
    getCategories(locale),
    getAllCities(locale),
    getQuestions(locale, { sort: "popular", pageSize: 1 }),
    getRoamers(locale, { pageSize: 3 }),
    getGuides(locale, { take: 8 }),
    siteStats(),
  ]);
  const featuredQ = questions.items[0];
  const answer = featuredQ ? await firstAnswer(featuredQ.id) : null;
  const sortedCities = [...cities].sort((a, b) => Number(b.featured) - Number(a.featured) || b.questionCount - a.questionCount);
  const chipLinks = [
    href(locale, "/cities/bali"),
    href(locale, "/cities/lisbon"),
    href(locale, "/questions", { city: "berlin", category: "work-business" }),
    href(locale, "/questions", { city: "bangkok", category: "cost-of-living" }),
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden -mt-[72px] pt-[72px]">
        <div className="absolute inset-y-0 right-0 w-full md:w-[56%]">
          <Image src="/images/hero/home-hero.jpg" alt="" fill priority sizes="(max-width: 768px) 100vw, 56vw" className="object-cover object-[65%_center]" />
          <div className="absolute inset-0 hidden md:block" style={{ background: "linear-gradient(90deg, #fcf8f2 0%, rgba(252,248,242,.6) 14%, rgba(252,248,242,0) 34%)" }} />
          <div className="absolute inset-0 md:hidden bg-cream/85" />
        </div>
        <div className="relative container-x pt-4 pb-8 md:pt-4 md:pb-9">
          <div className="max-w-[620px] md:pl-9">
            <h1 className="text-[42px] md:text-[48px] leading-[1.04]">
              {t.home.heroTitle1}
              <br />
              {t.home.heroTitle2} <em className="text-brand italic">{t.home.heroAccent}</em>
            </h1>
            <p className="mt-4 text-[16px] md:text-[17.5px] text-ink leading-[1.5] max-w-[470px]">{t.home.heroText}</p>
            <form action={href(locale, "/questions")} method="get" role="search" className="mt-6 flex items-center bg-white rounded-full shadow-pop pl-5 pr-1.5 py-1.5 max-w-[490px]">
              <Icon name="search" size={21} className="text-ink flex-none" />
              <label htmlFor="hero-q" className="sr-only">{t.home.searchPlaceholder}</label>
              <input id="hero-q" name="q" placeholder={t.home.searchPlaceholder} className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-[14.5px] placeholder:text-ink focus:outline-none" />
              <button className="btn btn-primary px-7 py-2.5 text-[14px]">{t.home.searchButton}</button>
            </form>
            <div className="mt-4 flex flex-wrap lg:flex-nowrap gap-2">
              {t.home.chips.map((c, i) => (
                <Link key={c} href={chipLinks[i]} className="inline-flex items-center gap-1.5 bg-white rounded-full pl-2.5 pr-3 py-1.5 text-[12px] whitespace-nowrap font-medium text-ink shadow-card hover:text-brand">
                  <Icon name="pin" size={14} className="text-brand" /> {c}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <StatStrip items={t.home.features.map((f, i) => ({ icon: (["chat", "users", "book", "shield"] as const)[i], title: f.title, text: f.text }))} />

      {/* CATEGORIES */}
      <section className="container-x mt-8">
        <SectionHeader title={t.home.categoriesTitle} link={href(locale, "/categories")} linkLabel={t.nav.allCategories} />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {cats.map((c) => <CategoryCard key={c.id} c={c} locale={locale} />)}
        </div>
      </section>

      {/* CITIES */}
      <section className="container-x mt-8">
        <SectionHeader title={t.home.citiesTitle} link={href(locale, "/cities")} linkLabel={t.home.allCities} />
        <div className="relative">
          <div className="scroll-x flex gap-3.5 md:grid md:grid-flow-col md:auto-cols-[calc((100%-4*14px)/5)]">
            {sortedCities.map((c) => <CityCardCompact key={c.id} c={c} locale={locale} t={t} />)}
          </div>
          <Link href={href(locale, "/cities")} aria-label={t.home.allCities} className="hidden md:grid absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 place-items-center rounded-full bg-white shadow-pop border border-line">
            <Icon name="chevronRight" size={18} />
          </Link>
        </div>
      </section>

      {/* ASK + MEET */}
      <section className="container-x mt-8 grid lg:grid-cols-[1fr_1px_1.15fr] gap-6 lg:gap-7">
        <div>
          <SectionHeader title={t.home.askTitle} subtitle={t.home.askSubtitle} link={href(locale, "/questions")} linkLabel={t.home.allQuestions} />
          {featuredQ && (
            <div className="flex gap-3">
              <Avatar src={featuredQ.author.avatarUrl} name={featuredQ.author.name} size={46} className="mt-1" />
              <div className="card p-4 flex-1 min-w-0">
                <h3 className="font-sans font-semibold text-[15.5px] text-ink">
                  <Link href={href(featuredQ.locale as never, `/questions/${featuredQ.slug}`)} className="hover:text-brand">{featuredQ.title}</Link>
                </h3>
                <p className="text-[12.5px] text-ink-2 mt-1">
                  {fmt(t.home.answersCount, { n: featuredQ.answerCount })} · {fmt(t.home.updated, { t: timeAgo(featuredQ.updatedAt, t.time) })}
                </p>
                {answer && (
                  <>
                    <div className="mt-3 rounded-lg bg-brand-50 px-3.5 py-2.5"><p className="text-[13.5px] text-ink leading-relaxed line-clamp-2">{answer.body}</p></div>
                    <p className="mt-2.5 text-[12px] text-ink-2 flex items-center gap-1.5">
                      <b className="text-ink">{answer.author.name}</b>
                      {answer.author.roamerProfile?.status === "APPROVED" && <Icon name="checkCircle" size={15} className="text-emerald-600" />}
                      {answer.author.roamerProfile && (
                        <span>· {fmt(t.home.livesIn, { n: answer.author.roamerProfile.yearsInCity, city: pickTr(answer.author.roamerProfile.city, locale).name, cityIn: pickTr(answer.author.roamerProfile.city, locale).locative })}</span>
                      )}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="hidden lg:block bg-line" />
        <div>
          <SectionHeader title={t.home.meetTitle} subtitle={t.home.meetSubtitle} link={href(locale, "/roamers")} linkLabel={t.home.allRoamers} />
          <div className="grid sm:grid-cols-3 gap-3">
            {roamers.items.map((r) => <RoamerMini key={r.id} r={r} locale={locale} t={t} />)}
          </div>
        </div>
      </section>

      {/* GUIDES */}
      <section className="container-x mt-9">
        <SectionHeader title={t.home.guidesTitle} subtitle={t.home.guidesSubtitle} link={href(locale, "/guides")} linkLabel={t.home.allGuides} />
        <div className="relative">
          <div className="scroll-x flex gap-3.5 md:grid md:grid-flow-col md:auto-cols-[calc((100%-3*14px)/4)]">
            {guides.map((g) => <GuideCardH key={g.id} g={g} locale={locale} t={t} />)}
          </div>
          {guides.length > 4 && (
            <Link href={href(locale, "/guides")} aria-label={t.home.allGuides} className="hidden md:grid absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 place-items-center rounded-full bg-white shadow-pop border border-line">
              <Icon name="chevronRight" size={18} />
            </Link>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container-x mt-10" id="how">
        <h2 className="text-[26px] md:text-[30px] mb-5">{t.home.howTitle}</h2>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {t.home.howSteps.map((s, i) => (
            <li key={s.title} className="card p-5">
              <div className="flex items-center gap-3">
                <span className="grid place-items-center w-11 h-11 rounded-full bg-brand-50 text-brand"><Icon name={(["search", "chatRound", "calendar", "book"] as const)[i]} size={22} /></span>
                <span className="font-display text-[34px] text-line leading-none">{i + 1}</span>
              </div>
              <h3 className="text-[20px] mt-3">{s.title}</h3>
              <p className="text-[14px] text-ink-2 mt-1 leading-relaxed">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* BAND */}
      <section className="container-x my-10">
        <div className="band relative overflow-hidden rounded-[22px] text-white">
          <div className="absolute inset-y-0 right-0 w-[24%] hidden lg:block">
            <Image src="/images/hero/cta-village.jpg" alt="" fill sizes="25vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a5c58] to-transparent" />
          </div>
          <div className="relative grid lg:grid-cols-[1.25fr_auto_auto_auto_1fr] items-center gap-6 lg:gap-0 px-6 md:px-12 py-8">
            <h2 className="text-white text-[28px] md:text-[30px] leading-[1.12] underline-swoosh max-w-[340px]">{t.home.bandTitle}</h2>
            {[
              { icon: "users" as const, n: stats.members, l: t.home.bandMembers },
              { icon: "chatRound" as const, n: stats.answered, l: t.home.bandAnswered },
              { icon: "book" as const, n: stats.guides, l: t.home.bandGuides },
            ].map((s, i) => (
              <div key={s.l} className={`text-center px-8 ${i > 0 ? "lg:border-l lg:border-white/20" : ""}`}>
                <Icon name={s.icon} size={28} className="mx-auto text-white/90" />
                <div className="text-[20px] font-bold mt-1">{num(s.n, locale)}</div>
                <div className="text-[13px] text-white/85">{s.l}</div>
              </div>
            ))}
            <div className="lg:pl-8">
              <Link href={href(locale, "/register")} className="btn btn-primary px-7 py-3.5 text-[15px] border-2 border-white/25">
                {t.home.bandCta} <Icon name="arrowRight" size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
