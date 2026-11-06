import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/config";
import { buildMetadata, breadcrumbLd, abs } from "@/lib/seo";
import { getRoamerBySlug, getGuides, getReviews } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { db } from "@/lib/db";
import { date, fmt, money, timeAgo, excerpt } from "@/lib/format";
import { Icon, VerifiedBadge } from "@/components/Icon";
import { Avatar, Breadcrumbs, JsonLd, Notice, Stars, SectionHeader } from "@/components/ui";
import { GuideTile } from "@/components/cards";
import { ActionForm, Textarea, FieldError } from "@/components/forms";
import { SubmitButton } from "@/components/client";
import { createBookingAction } from "@/actions/commerce";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const { slug } = await params;
  const r = await getRoamerBySlug(locale, slug);
  if (!r) return {};
  return buildMetadata({
    locale, path: `/roamer/${slug}`, type: "profile",
    title: fmt(t.profile.metaTitle, { name: r.name, city: r.cityName }),
    description: excerpt(`${r.headline}. ${r.bio}`, 155),
    image: r.photoUrl ?? undefined,
    noindex: r.status !== "APPROVED",
  });
}

export default async function RoamerProfilePage({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const { slug } = await params;
  const [r, user] = await Promise.all([getRoamerBySlug(locale, slug), getCurrentUser()]);
  if (!r) notFound();
  const isOwner = user?.id === r.userId;
  if (r.status !== "APPROVED" && !isOwner && !can.isAdmin(user)) notFound();
  const [reviews, guides, slots, answers] = await Promise.all([
    getReviews({ roamerId: r.id }, 8),
    getGuides(locale, {}).then((gs) => gs.filter((g) => g.roamerId === r.id)),
    db.availabilitySlot.findMany({ where: { roamerId: r.id, isBooked: false, startsAt: { gt: new Date() } }, orderBy: { startsAt: "asc" }, take: 12 }),
    db.answer.findMany({ where: { authorId: r.userId, status: "PUBLISHED", question: { status: "PUBLISHED" } }, include: { question: { select: { slug: true, title: true, locale: true } } }, orderBy: { createdAt: "desc" }, take: 4 }),
  ]);
  const profileUrl = href(locale, `/roamer/${slug}`);
  const ld = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: abs(profileUrl),
    mainEntity: {
      "@type": "Person",
      name: r.name,
      description: r.headline,
      image: r.photoUrl ? abs(r.photoUrl) : undefined,
      homeLocation: { "@type": "Place", name: `${r.cityName}, ${r.country}` },
      knowsLanguage: r.languages,
      knowsAbout: r.expertise.map((e) => e.name),
    },
  };

  return (
    <>
      <JsonLd data={[ld, breadcrumbLd([{ name: t.nav.home, url: href(locale) }, { name: t.nav.roamers, url: href(locale, "/roamers") }, { name: r.cityName, url: href(locale, `/roamers/${r.citySlug}`) }, { name: r.name, url: profileUrl }])]} />
      <div className="container-x pt-4">
        <Breadcrumbs items={[{ name: t.nav.home, href: href(locale) }, { name: t.nav.roamers, href: href(locale, "/roamers") }, { name: r.cityName, href: href(locale, `/roamers/${r.citySlug}`) }, { name: r.name }]} />
      </div>
      <div className="container-x mt-5 grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="min-w-0">
          {r.status !== "APPROVED" && <div className="mb-4"><Notice kind="warn">{t.profile.pending}</Notice></div>}
          {isOwner && <div className="mb-4"><Notice>{t.profile.ownProfile} <Link className="link-orange" href={href(locale, "/roamer-dashboard/profile")}>{t.common.edit}</Link></Notice></div>}
          <div className="card overflow-hidden">
            <div className="relative h-[220px] md:h-[280px]">
              <Image src={r.photoUrl ?? "/images/hero/sunset-woman.jpg"} alt={r.name} fill priority sizes="(max-width:1024px) 100vw, 800px" className="object-cover" />
            </div>
            <div className="p-5 md:p-6 flex gap-4">
              <Avatar src={r.avatarUrl} name={r.name} size={84} className="-mt-14 border-4 border-white shadow-card" />
              <div className="min-w-0">
                <h1 className="text-[32px] md:text-[38px] leading-tight inline-flex items-center gap-2">{r.name} {r.verified && <VerifiedBadge size={24} title={t.common.verified} />}</h1>
                <p className="text-ink-2 flex items-center gap-1.5 mt-1"><Icon name="pin" size={16} className="text-brand" />{fmt(t.profile.livesIn, { city: `${r.cityName}, ${r.country}`, years: r.yearsInCity })}</p>
                <p className="mt-2 text-[16px] text-ink font-medium">{r.headline}</p>
                {r.rating && <Stars className="mt-2" value={r.rating.avg} count={r.rating.count} />}
              </div>
            </div>
          </div>

          <section className="card p-5 md:p-6 mt-5">
            <h2 className="text-[24px]">{t.profile.about}</h2>
            <div className="prose-ar mt-2 text-[15.5px] text-ink">{r.bio.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}</div>
            <div className="grid sm:grid-cols-2 gap-5 mt-4">
              <div>
                <h3 className="font-sans text-[14px] font-semibold text-ink-2 mb-2">{t.profile.expertise}</h3>
                <div className="flex flex-wrap gap-2">{r.expertise.map((e) => <Link key={e.slug} href={href(locale, "/roamers", { expertise: e.slug })} className="chip hover:bg-brand-50">{e.name}</Link>)}</div>
              </div>
              <div>
                <h3 className="font-sans text-[14px] font-semibold text-ink-2 mb-2">{t.profile.languages}</h3>
                <div className="flex flex-wrap gap-2">{r.languages.map((l) => <span key={l} className="chip">{t.languages[l as keyof typeof t.languages] ?? l}</span>)}</div>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-[26px] mb-3">{t.profile.reviews}</h2>
            {reviews.length ? (
              <ul className="grid md:grid-cols-2 gap-3">
                {reviews.map((rv) => (
                  <li key={rv.id} className="card p-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={rv.author.avatarUrl} name={rv.author.name} size={34} />
                      <div className="text-[13px]"><b className="text-ink">{rv.author.name}</b><div className="text-muted">{timeAgo(rv.createdAt, t.time)}</div></div>
                      <span className="ml-auto"><Stars value={rv.rating} size={13} /></span>
                    </div>
                    <p className="mt-2.5 text-[14px] text-ink-2 leading-relaxed">{rv.comment}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-ink-2">{t.profile.noReviews}</p>}
          </section>

          {answers.length > 0 && (
            <section className="mt-8">
              <h2 className="text-[26px] mb-3">{t.profile.answers}</h2>
              <ul className="space-y-3">
                {answers.map((a) => (
                  <li key={a.id} className="card p-4">
                    <Link href={href(a.question.locale as never, `/questions/${a.question.slug}`)} className="font-semibold text-ink hover:text-brand">{a.question.title}</Link>
                    <p className="text-[14px] text-ink-2 mt-1 line-clamp-2">{a.body}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {guides.length > 0 && (
            <section className="mt-8">
              <SectionHeader title={t.profile.guides} />
              <div className="grid sm:grid-cols-2 gap-4">{guides.map((g) => <GuideTile key={g.id} g={g} locale={locale} t={t} />)}</div>
            </section>
          )}
        </div>

        {/* Booking card */}
        <aside className="lg:sticky lg:top-4 card p-5" id="book" aria-labelledby="book-h">
          <h2 id="book-h" className="text-[24px]">{t.profile.bookTitle}</h2>
          {r.minPrice && <p className="text-ink-2 text-[14px] mt-0.5">{money(r.minPrice.cents, r.minPrice.currency, locale)} {t.common.from} {t.common.consultation}</p>}
          {!user ? (
            <Link href={href(locale, "/login", { next: `${profileUrl}#book` })} className="btn btn-primary w-full py-3 mt-5">{t.profile.loginToBook}</Link>
          ) : isOwner || r.status !== "APPROVED" ? (
            <p className="text-[14px] text-ink-2 mt-4">{isOwner ? t.profile.ownProfile : t.profile.pending}</p>
          ) : r.offers.length === 0 || slots.length === 0 ? (
            <p className="text-[14px] text-ink-2 mt-4">{t.profile.noSlots}</p>
          ) : (
            <ActionForm action={createBookingAction} locale={locale} hidden={{ roamerId: r.id }} className="space-y-5 mt-4">
              <fieldset>
                <legend className="label">{t.profile.chooseDuration}</legend>
                <div className="grid grid-cols-3 gap-2">
                  {r.offers.map((o, i) => (
                    <label key={o.id} className="cursor-pointer">
                      <input type="radio" name="offerId" value={o.id} defaultChecked={i === Math.min(1, r.offers.length - 1)} className="peer sr-only" />
                      <span className="block text-center rounded-xl border border-line bg-white px-2 py-2.5 peer-checked:border-brand peer-checked:bg-brand-50 peer-focus-visible:ring-2 peer-focus-visible:ring-brand">
                        <span className="block text-[13px] text-ink-2">{fmt(t.panel.minutes, { n: o.durationMin })}</span>
                        <b className="text-[16px] text-ink">{money(o.priceCents, o.currency, locale)}</b>
                      </span>
                    </label>
                  ))}
                </div>
                <FieldError name="offerId" />
              </fieldset>
              <fieldset>
                <legend className="label">{t.profile.chooseSlot}</legend>
                <div className="grid grid-cols-1 gap-1.5 max-h-[230px] overflow-y-auto pr-1">
                  {slots.map((s, i) => (
                    <label key={s.id} className="cursor-pointer">
                      <input type="radio" name="slotId" value={s.id} defaultChecked={i === 0} className="peer sr-only" />
                      <span className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] peer-checked:border-brand peer-checked:bg-brand-50">
                        <Icon name="clock" size={15} className="text-brand" />{date(s.startsAt, locale, true)}
                      </span>
                    </label>
                  ))}
                </div>
                <FieldError name="slotId" />
              </fieldset>
              <Textarea name="note" label={t.profile.note} rows={3} maxLength={1000} />
              <SubmitButton className="btn btn-primary w-full py-3 text-[15px]">{t.profile.continueToPayment} <Icon name="arrowRight" size={18} /></SubmitButton>
            </ActionForm>
          )}
        </aside>
      </div>
      <div className="h-10" />
    </>
  );
}
