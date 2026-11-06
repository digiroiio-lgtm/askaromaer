import Link from "next/link";
import Image from "next/image";
import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/config";
import { buildMetadata, breadcrumbLd } from "@/lib/seo";
import { getCurrentUser } from "@/lib/auth";
import { getAllCities, getCategories, getRoamers } from "@/lib/queries";
import { db } from "@/lib/db";
import { platformFeePercent, SPOKEN_LANGUAGES } from "@/lib/constants";
import { fmt } from "@/lib/format";
import { Icon, VerifiedBadge, type IconName } from "@/components/Icon";
import { Avatar, CtaBand, JsonLd, Notice, StatStrip } from "@/components/ui";
import { ActionForm, CheckGroup, Input, Select, Textarea, FieldError } from "@/components/forms";
import { SubmitButton } from "@/components/client";
import { applyRoamerAction } from "@/actions/roamer";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  return buildMetadata({ locale, path: "/become-a-roamer", title: t.become.metaTitle, description: t.become.metaDescription, image: "/images/hero/become.jpg" });
}

export default async function BecomeRoamerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const [user, cities, cats, roamers, feeSetting] = await Promise.all([
    getCurrentUser(), getAllCities(locale), getCategories(locale), getRoamers(locale, { pageSize: 12 }),
    db.platformSetting.findUnique({ where: { key: "platformFeePercent" } }),
  ]);
  const fee = feeSetting ? Number(feeSetting.value) : platformFeePercent();
  const testimonials = roamers.items.filter((r) => r.motivation).slice(0, 3);
  const badge = roamers.items.find((r) => r.slug === "can-demir") ?? roamers.items[0];
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: t.become.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  const whyIcons: IconName[] = ["globe", "coins", "laptop", "users"];

  return (
    <>
      <JsonLd data={[faqLd, breadcrumbLd([{ name: t.nav.home, url: href(locale) }, { name: t.become.metaTitle.split(" — ")[0], url: href(locale, "/become-a-roamer") }])]} />
      {/* HERO */}
      <section className="relative overflow-hidden bg-cream -mt-[72px] pt-[72px]">
        <div className="absolute inset-y-0 right-0 w-full md:w-[44%]">
          <Image src="/images/hero/become.jpg" alt="" fill priority sizes="44vw" className="object-cover object-[40%_30%]" />
          <div className="absolute inset-0 hero-fade hidden md:block" />
          <div className="absolute inset-0 bg-cream/80 md:hidden" />
        </div>
        <div className="relative container-x py-10 md:py-14 min-h-[280px]">
          <div className="max-w-[520px]">
            <h1 className="text-[52px] md:text-[64px] leading-none">{t.become.titleA} <em className="text-brand italic">{t.become.titleB}</em></h1>
            <p className="mt-4 text-[17px] md:text-[19px] leading-relaxed text-ink">{t.become.subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#apply" className="btn btn-primary px-7 py-3.5 text-[16px]">{t.become.applyNow} <Icon name="arrowRight" size={18} /></a>
              <a href="#how" className="btn btn-outline bg-white/80 px-6 py-3.5 text-[15px] border-line text-ink"><Icon name="play" size={18} />{t.become.howItWorksShort}</a>
            </div>
          </div>
          {badge && (
            <div className="hidden md:flex absolute right-[4%] top-[46%] card px-4 py-3 items-start gap-2.5">
              <Icon name="pin" size={24} className="text-brand mt-0.5" />
              <div className="text-[13px] leading-snug">
                <b className="text-[15px] inline-flex items-center gap-1">{badge.name} <VerifiedBadge size={17} /></b>
                <div className="text-ink-2">{fmt(t.become.badgeYear, { city: badge.cityName, cityIn: badge.cityLocative, n: badge.yearsInCity })}</div>
                <div className="text-ink-2">Roamer</div>
              </div>
            </div>
          )}
        </div>
      </section>
      <StatStrip items={t.become.features.map((f, i) => ({ icon: (["users", "calendar", "book", "coins"] as const)[i], title: f.title, text: f.text }))} />

      <div className="container-x mt-10 grid lg:grid-cols-[1fr_300px] gap-8 items-start">
        <div className="min-w-0">
          <div className="grid md:grid-cols-[1fr_260px] gap-6 items-start">
            <section>
              <h2 className="text-[30px] underline-swoosh">{t.become.whyTitle}</h2>
              <div className="grid sm:grid-cols-2 gap-6 mt-8">
                {t.become.why.map((w, i) => (
                  <div key={w.title} className="flex gap-3.5">
                    <span className="grid place-items-center w-14 h-14 rounded-full bg-brand-50 text-brand flex-none"><Icon name={whyIcons[i]} size={26} /></span>
                    <div><h3 className="text-[20px]">{w.title}</h3><p className="text-[14px] text-ink-2 leading-snug mt-0.5">{w.text}</p></div>
                  </div>
                ))}
              </div>
            </section>
            <div className="relative h-[230px] rounded-[16px] overflow-hidden hidden md:block shadow-card">
              <Image src="/images/hero/sunset-woman.jpg" alt="" fill sizes="260px" className="object-cover" />
            </div>
          </div>

          <div className="grid md:grid-cols-[1fr_270px] gap-6 mt-10 items-start" id="how">
            <section>
              <h2 className="text-[30px]">{t.become.howTitle}</h2>
              <ol className="grid sm:grid-cols-3 gap-4 mt-5">
                {t.become.steps.map((s, i) => (
                  <li key={s.title} className="text-center relative">
                    <span className="grid place-items-center w-14 h-14 mx-auto rounded-full bg-brand-50 text-brand"><Icon name={(["laptop", "checkCircle", "rocket"] as const)[i]} size={26} /></span>
                    <h3 className="text-[20px] mt-2">{s.title}</h3>
                    <p className="text-[13.5px] text-ink-2 mt-1 leading-snug">{s.text}</p>
                    {i < 2 && <Icon name="arrowRight" size={22} className="hidden sm:block absolute -right-4 top-4 text-ink-2" />}
                  </li>
                ))}
              </ol>
            </section>
            <section className="card p-5 bg-cream-2/50">
              <h2 className="text-[22px]">{t.become.whoTitle}</h2>
              <ul className="mt-3 space-y-2.5">
                {t.become.who.map((w) => <li key={w} className="flex gap-2 text-[13.5px] text-ink leading-snug"><Icon name="check" size={18} className="text-teal-700 flex-none" strokeWidth={2.4} />{w}</li>)}
              </ul>
            </section>
          </div>

          <section className="mt-10">
            <h2 className="text-[30px]">{t.become.earnTitle}</h2>
            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              {t.become.earn.map((e, i) => (
                <div key={e.title} className="card p-5">
                  <Icon name={(["calendar", "book", "euro"] as const)[i]} size={28} className="text-brand" />
                  <h3 className="text-[20px] mt-2">{e.title}</h3>
                  <p className="text-[14px] text-ink-2 mt-1 leading-relaxed">{fmt(e.text, { fee })}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10 card p-6">
            <h2 className="text-[28px] flex items-center gap-2"><Icon name="shield" size={28} className="text-brand" />{t.become.trustTitle}</h2>
            <ul className="mt-3 grid sm:grid-cols-2 gap-3">{t.become.trust.map((x) => <li key={x} className="flex gap-2 text-[14px] text-ink"><Icon name="checkCircle" size={18} className="text-teal-700 flex-none mt-0.5" />{x}</li>)}</ul>
          </section>
        </div>

        {/* APPLICATION */}
        <aside id="apply" className="card p-5 lg:sticky lg:top-4 scroll-mt-4" aria-labelledby="apply-h">
          <h2 id="apply-h" className="text-[26px]">{t.become.formTitle}</h2>
          <p className="text-[14px] text-ink-2 mt-1">{t.become.formText}</p>
          {user?.roamer ? (
            <div className="mt-4 space-y-3">
              <Notice>{fmt(t.become.alreadyApplied, { status: t.statuses[user.roamer.status as keyof typeof t.statuses] ?? user.roamer.status })}</Notice>
              <Link href={href(locale, "/roamer-dashboard")} className="btn btn-primary w-full py-3">{t.become.goPanel}</Link>
            </div>
          ) : (
            <ActionForm action={applyRoamerAction} locale={locale} className="space-y-3.5 mt-4">
              {user ? <p className="text-[13px] text-ink-2">{fmt(t.become.loggedInAs, { name: user.name })}</p> : (
                <>
                  <Input name="name" label={t.become.name} srLabel icon={<Icon name="user" size={18} />} autoComplete="name" required />
                  <Input name="email" type="email" label={t.become.email} srLabel icon={<Icon name="mail" size={18} />} autoComplete="email" required />
                  <Input name="password" type="password" label={t.become.password} srLabel icon={<Icon name="lock" size={18} />} autoComplete="new-password" minLength={8} required />
                </>
              )}
              <Select name="city" label={t.become.city} srLabel icon={<Icon name="pin" size={18} />} options={cities.map((c) => ({ value: c.slug, label: `${c.name}, ${c.country}` }))} />
              <Input name="years" type="number" min={0} max={80} label={t.become.years} srLabel icon={<Icon name="calendar" size={18} />} required />
              <details className="rounded-[10px] border border-[#ded5c8] bg-white px-3.5 py-2.5">
                <summary className="cursor-pointer text-[13px] text-ink-2 flex items-center gap-2"><Icon name="layers" size={18} />{t.become.expertise}</summary>
                <div className="mt-3"><CheckGroup name="expertise" label={t.become.expertise} options={cats.map((c) => ({ value: c.slug, label: c.name }))} columns={2} /></div>
              </details>
              <FieldError name="expertise" />
              <CheckGroup name="languages" label={t.become.languages} options={SPOKEN_LANGUAGES.map((l) => ({ value: l, label: t.languages[l] }))} defaultValues={[locale === "tr" ? "tr" : locale]} columns={2} />
              <Input name="headline" label={t.become.headline} srLabel maxLength={120} required />
              <Textarea name="bio" label={t.become.bio} rows={4} minLength={40} required />
              <Input name="evidence" label={t.become.evidence} srLabel required />
              <label className="flex items-start gap-2 text-[13px] text-ink">
                <input type="checkbox" name="consent" className="check mt-0.5" required /> {t.become.consent}
              </label>
              <FieldError name="consent" />
              <SubmitButton className="btn btn-primary w-full py-3.5 text-[16px]">{t.become.submit} <Icon name="arrowRight" size={18} /></SubmitButton>
              <p className="flex gap-2 text-[12px] text-ink-2"><Icon name="shield" size={20} className="flex-none" />{t.become.privacy}</p>
            </ActionForm>
          )}
        </aside>
      </div>

      {testimonials.length > 0 && (
        <section className="container-x mt-12">
          <h2 className="text-[30px] underline-swoosh">{t.become.testimonialsTitle}</h2>
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            {testimonials.map((r) => (
              <figure key={r.id} className="card p-5 flex gap-4">
                <Avatar src={r.avatarUrl} name={r.name} size={76} />
                <div>
                  <span className="font-display text-[40px] leading-none text-brand">“</span>
                  <blockquote className="text-[14px] italic text-ink -mt-3">{r.motivation}</blockquote>
                  <figcaption className="mt-2 text-[13.5px] font-semibold">{r.name} · <span className="font-normal">{r.cityName}</span></figcaption>
                </div>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="container-x mt-12 max-w-[860px]">
        <h2 className="text-[30px]">{t.become.faqTitle}</h2>
        <div className="mt-4 space-y-2">
          {t.become.faq.map((f) => (
            <details key={f.q} className="card px-5 py-4 group">
              <summary className="cursor-pointer font-semibold text-ink flex justify-between gap-4 list-none">{f.q}<Icon name="chevronDown" size={18} className="group-open:rotate-180 transition flex-none" /></summary>
              <p className="mt-2 text-[14.5px] text-ink-2 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <CtaBand title={t.become.bandTitle} text={t.become.bandText} cta={t.become.bandCta} href="#apply" image="/images/hero/cta-coast.jpg" />
    </>
  );
}
