import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/config";
import { buildMetadata, breadcrumbLd, abs } from "@/lib/seo";
import { getGuideBySlug, getGuides, getReviews } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { canReadGuide } from "@/lib/entitlements";
import { db } from "@/lib/db";
import { date, fmt, money, timeAgo, excerpt } from "@/lib/format";
import { Icon, VerifiedBadge } from "@/components/Icon";
import { Avatar, Breadcrumbs, JsonLd, Stars, StarInput, Notice } from "@/components/ui";
import { GuideTile } from "@/components/cards";
import { ActionForm, Textarea } from "@/components/forms";
import { SubmitButton } from "@/components/client";
import { purchaseGuideAction, reviewGuideAction } from "@/actions/commerce";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const { slug } = await params;
  const g = await getGuideBySlug(locale, slug);
  if (!g) return {};
  return buildMetadata({ locale, path: `/guides/${slug}`, title: fmt(t.guides.detailMetaTitle, { title: g.title }), description: excerpt(g.summary, 155), image: g.coverUrl, noindex: g.status !== "PUBLISHED" });
}

export default async function GuidePage({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const { slug } = await params;
  const [g, user] = await Promise.all([getGuideBySlug(locale, slug), getCurrentUser()]);
  if (!g) notFound();
  const isAuthor = user?.id === g.roamerUserId;
  if (g.status !== "PUBLISHED" && !isAuthor && !user?.roles.includes("ADMIN")) notFound();
  const [owned, reviews, related, preview, myReview] = await Promise.all([
    canReadGuide(user, g),
    getReviews({ guideId: g.id }, 10),
    getGuides(locale, { cities: [g.citySlug], excludeId: g.id, take: 3 }).then(async (r) => (r.length ? r : getGuides(locale, { excludeId: g.id, take: 3 }))),
    db.guideChapter.findFirst({ where: { guideId: g.id, isPreview: true }, orderBy: { position: "asc" } }),
    user ? db.review.findFirst({ where: { guideId: g.id, authorId: user.id } }) : null,
  ]);
  const purchased = user ? !!(await db.guidePurchase.findUnique({ where: { guideId_userId: { guideId: g.id, userId: user.id } } })) : false;
  const url = href(locale, `/guides/${slug}`);
  const price = money(g.priceCents, g.currency, locale);
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: g.title,
    description: g.summary,
    image: abs(g.coverUrl),
    category: g.categoryName,
    brand: { "@type": "Brand", name: "AskARoamer" },
    offers: { "@type": "Offer", price: (g.priceCents / 100).toFixed(2), priceCurrency: g.currency, availability: "https://schema.org/InStock", url: abs(url) },
    ...(g.rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: g.rating.avg.toFixed(1), reviewCount: g.rating.count } } : {}),
  };
  const articleLd = { "@context": "https://schema.org", "@type": "Article", headline: g.title, inLanguage: g.locale, author: { "@type": "Person", name: g.authorName, url: abs(href(locale, `/roamer/${g.roamerSlug}`)) }, datePublished: g.publishedAt?.toISOString(), dateModified: g.updatedAt.toISOString(), image: abs(g.coverUrl), isAccessibleForFree: false };

  return (
    <>
      <JsonLd data={[productLd, articleLd, breadcrumbLd([{ name: t.nav.home, url: href(locale) }, { name: t.guides.title, url: href(locale, "/guides") }, { name: g.title, url }])]} />
      <div className="container-x pt-4"><Breadcrumbs items={[{ name: t.nav.home, href: href(locale) }, { name: t.guides.title, href: href(locale, "/guides") }, { name: g.title }]} /></div>
      <div className="container-x mt-5 grid lg:grid-cols-[1fr_360px] gap-8 items-start">
        <div className="min-w-0">
          {g.status !== "PUBLISHED" && <div className="mb-4"><Notice kind="warn">{t.statuses[g.status as keyof typeof t.statuses]}</Notice></div>}
          <div className="relative h-[240px] md:h-[340px] rounded-[18px] overflow-hidden shadow-card">
            <Image src={g.coverUrl} alt={g.title} fill priority sizes="(max-width:1024px) 100vw, 800px" className="object-cover" />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-[13px]">
            <Link href={href(locale, `/cities/${g.citySlug}`)} className="chip bg-white border border-line"><Icon name="pin" size={13} className="text-brand" />{g.cityName}</Link>
            <span className="chip bg-brand-50">{g.categoryName}</span>
            <span className="chip uppercase">{g.locale}</span>
          </div>
          <h1 className="text-[34px] md:text-[44px] leading-tight mt-3">{g.title}</h1>
          <p className="text-[17px] text-ink mt-2 leading-relaxed">{g.summary}</p>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-[13px] text-ink-2">
            {g.rating && <Stars value={g.rating.avg} count={g.rating.count} />}
            <span>{fmt(t.guides.chapters, { n: g.chapters.length })}</span>
            <span>{t.common.lastUpdated}: <time dateTime={g.updatedAt.toISOString()}>{date(g.updatedAt, locale)}</time></span>
          </div>

          <section className="card p-5 mt-6">
            <h2 className="text-[24px]">{t.guides.about}</h2>
            <div className="prose-ar mt-2 text-[15.5px]">{g.description.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}</div>
          </section>

          <section className="card p-5 mt-5">
            <h2 className="text-[24px]">{t.guides.contents}</h2>
            <ol className="mt-3 divide-y divide-line">
              {g.chapters.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-3 text-[15px]">
                  <span className="grid place-items-center w-8 h-8 rounded-full bg-cream-2 text-[13px] font-semibold flex-none">{c.position}</span>
                  <span className="flex-1">{c.title}</span>
                  {c.isPreview ? <span className="chip bg-emerald-50 text-emerald-700">{t.guides.preview}</span> : !owned && <span className="text-muted inline-flex items-center gap-1 text-[12px]"><Icon name="lock" size={14} />{t.guides.locked}</span>}
                </li>
              ))}
            </ol>
          </section>

          {preview && (
            <section className="card p-5 mt-5 border-brand/30">
              <span className="chip bg-emerald-50 text-emerald-700">{t.guides.preview}</span>
              <h2 className="text-[22px] mt-2">{preview.title}</h2>
              <div className="prose-ar mt-2 text-[15.5px]">{preview.content.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}</div>
            </section>
          )}

          <section className="mt-8" aria-labelledby="rv-h">
            <h2 id="rv-h" className="text-[26px] mb-3">{t.guides.reviews}</h2>
            {reviews.length ? (
              <ul className="grid md:grid-cols-2 gap-3">
                {reviews.map((rv) => (
                  <li key={rv.id} className="card p-4">
                    <div className="flex items-center gap-2.5"><Avatar src={rv.author.avatarUrl} name={rv.author.name} size={32} /><div className="text-[13px]"><b>{rv.author.name}</b><div className="text-muted">{timeAgo(rv.createdAt, t.time)}</div></div><span className="ml-auto"><Stars value={rv.rating} size={13} /></span></div>
                    <p className="mt-2 text-[14px] text-ink-2">{rv.comment}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-ink-2">{t.guides.noReviews}</p>}
            {purchased && !isAuthor && (
              <div className="card p-5 mt-4">
                {myReview ? <p className="text-ink-2">{t.guides.reviewed}</p> : (
                  <ActionForm action={reviewGuideAction} locale={locale} hidden={{ guideId: g.id }}>
                    <h3 className="text-[20px]">{t.guides.writeReview}</h3>
                    <fieldset><legend className="label">{t.guides.rating}</legend><StarInput /></fieldset>
                    <Textarea name="comment" label={t.guides.comment} rows={3} required minLength={10} />
                    <SubmitButton>{t.guides.sendReview}</SubmitButton>
                  </ActionForm>
                )}
              </div>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-4 space-y-4">
          <div className="card p-5">
            <div className="text-[34px] font-bold text-ink">{price}</div>
            <p className="text-[13px] text-ink-2">{t.guides.oneTime}</p>
            {owned ? (
              <>
                <p className="mt-4 text-[14px] text-emerald-700 font-semibold flex items-center gap-1.5"><Icon name="checkCircle" size={18} />{t.guides.owned}</p>
                <Link href={href(locale, `/guides/${slug}/read`)} className="btn btn-primary w-full py-3.5 mt-3">{t.guides.read} <Icon name="arrowRight" size={18} /></Link>
              </>
            ) : g.status === "PUBLISHED" ? (
              <form action={purchaseGuideAction} className="mt-4">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="guideId" value={g.id} />
                <SubmitButton className="btn btn-primary w-full py-3.5 text-[16px]">{user ? fmt(t.guides.buyFor, { price }) : t.guides.loginToBuy}</SubmitButton>
              </form>
            ) : null}
          </div>
          <div className="card p-5">
            <h2 className="font-sans text-[13px] font-semibold text-ink-2 uppercase tracking-wide">{t.guides.creator}</h2>
            <Link href={href(locale, `/roamer/${g.roamerSlug}`)} className="flex items-center gap-3 mt-3 hover:text-brand">
              <Avatar src={g.authorAvatar} name={g.authorName} size={52} />
              <span><b className="inline-flex items-center gap-1 text-[16px]">{g.authorName}{g.authorVerified && <VerifiedBadge size={15} />}</b><span className="block text-[13px] text-ink-2">{g.cityName}</span></span>
            </Link>
          </div>
        </aside>
      </div>
      {related.length > 0 && (
        <section className="container-x mt-12">
          <h2 className="text-[28px] mb-4">{t.guides.related}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{related.map((r) => <GuideTile key={r.id} g={r} locale={locale} t={t} />)}</div>
        </section>
      )}
      <div className="h-12" />
    </>
  );
}
