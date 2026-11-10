import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { resolveLocale } from "@/i18n";
import { href, type Locale } from "@/i18n/config";
import { buildMetadata, breadcrumbLd, abs } from "@/lib/seo";
import { getQuestionBySlug, getQuestions, pickTr } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { date, fmt, excerpt, timeAgo } from "@/lib/format";
import { Icon, VerifiedBadge } from "@/components/Icon";
import { Avatar, Breadcrumbs, HubCta, JsonLd, Notice } from "@/components/ui";
import { QuestionRow } from "@/components/cards";
import { ActionForm, Textarea, Input } from "@/components/forms";
import { SubmitButton } from "@/components/client";
import { answerQuestionAction, reportAction } from "@/actions/questions";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await resolveLocale(params);
  const { slug } = await params;
  const q = await getQuestionBySlug(locale, slug);
  if (!q) return {};
  const qLocale = q.locale as Locale;
  // UGC exists in one language only: no hreflang alternates; thin (unanswered/hidden) pages are noindex
  return buildMetadata({ locale: qLocale, path: `/questions/${slug}`, title: `${q.title} | AskARoamer`, description: excerpt(q.answers[0]?.body ?? q.body, 155), image: q.cityImage, alternateLocales: [qLocale], noindex: q.answers.length === 0 || q.status !== "PUBLISHED", type: "article" });
}

export default async function QuestionPage({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const { slug } = await params;
  const [q, user] = await Promise.all([getQuestionBySlug(locale, slug), getCurrentUser()]);
  if (!q) notFound();
  if (q.locale !== locale) permanentRedirect(href(q.locale as Locale, `/questions/${slug}`));
  if (q.status !== "PUBLISHED" && !can.isAdmin(user)) notFound();
  // related: same city + category first, then same city, then same category (deduped, most-answered first)
  const [both, sameCity, sameCat] = await Promise.all([
    getQuestions(locale, { cities: [q.citySlug], categories: [q.categorySlug], pageSize: 6, sort: "popular" }),
    getQuestions(locale, { cities: [q.citySlug], pageSize: 6, sort: "popular" }),
    getQuestions(locale, { categories: [q.categorySlug], pageSize: 6, sort: "popular" }),
  ]);
  const seen = new Set([q.id]);
  const related = [...both.items, ...sameCity.items, ...sameCat.items].filter((x) => !seen.has(x.id) && seen.add(x.id)).slice(0, 5);
  const url = href(locale, `/questions/${slug}`);

  const answerLd = (a: (typeof q.answers)[number]) => ({
    "@type": "Answer",
    text: a.body,
    datePublished: a.createdAt.toISOString(),
    url: `${abs(url)}#a-${a.id}`,
    author: { "@type": "Person", name: a.author.name, ...(a.author.roamerProfile?.status === "APPROVED" ? { url: abs(href(locale, `/roamer/${a.author.roamerProfile.slug}`)) } : {}) },
  });
  // accepted answer = earliest answer from an approved Roamer (no accept flag exists in the data model)
  const bestAnswer = q.answers.find((a) => a.author.roamerProfile?.status === "APPROVED");
  const qaLd = q.answers.length
    ? {
        "@context": "https://schema.org",
        "@type": "QAPage",
        mainEntity: {
          "@type": "Question",
          name: q.title,
          text: q.body,
          answerCount: q.answers.length,
          inLanguage: q.locale,
          ...(bestAnswer ? { acceptedAnswer: answerLd(bestAnswer) } : {}),
          datePublished: q.createdAt.toISOString(),
          author: { "@type": "Person", name: q.author.name },
          suggestedAnswer: q.answers.filter((a) => a !== bestAnswer).map(answerLd),
        },
      }
    : null;

  return (
    <>
      <JsonLd data={[breadcrumbLd([{ name: t.nav.home, url: href(locale) }, { name: t.nav.questions, url: href(locale, "/questions") }, { name: q.cityName, url: href(locale, "/questions", { city: q.citySlug }) }, { name: q.title, url }]), ...(qaLd ? [qaLd] : [])]} />
      <div className="container-x pt-4 max-w-[900px]">
        <Breadcrumbs items={[{ name: t.nav.home, href: href(locale) }, { name: t.nav.questions, href: href(locale, "/questions") }, { name: q.cityName, href: href(locale, "/questions", { city: q.citySlug }) }, { name: excerpt(q.title, 50) }]} />
        {q.status !== "PUBLISHED" && <div className="mt-3"><Notice kind="warn">{t.statuses.HIDDEN}</Notice></div>}
        <article className="mt-5">
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <Link href={href(locale, `/cities/${q.citySlug}`)} className="inline-flex items-center gap-1 font-semibold"><Icon name="pin" size={15} className="text-brand" />{q.cityName}</Link>
            <Link href={href(locale, `/categories/${q.categorySlug}`)} className="chip bg-brand-50">{q.categoryName}</Link>
          </div>
          <h1 className="text-[32px] md:text-[42px] leading-tight mt-3">{q.title}</h1>
          <div className="flex items-center gap-2 mt-3 text-[13px] text-ink-2">
            <Avatar src={q.author.avatarUrl} name={q.author.name} size={28} />
            <span>{t.questions.askedBy} <b className="text-ink">{q.author.name}</b></span>
            <span>· <time dateTime={q.createdAt.toISOString()}>{date(q.createdAt, locale)}</time></span>
            <span>· {t.common.lastUpdated}: <time dateTime={q.updatedAt.toISOString()}>{date(q.updatedAt, locale)}</time></span>
          </div>
          <div className="prose-ar mt-4 text-[16px] text-ink">{q.body.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}</div>
        </article>

        <section className="mt-8" aria-labelledby="answers-h">
          <h2 id="answers-h" className="text-[26px]">{fmt(t.questions.answersTitle, { n: q.answers.length })}</h2>
          {q.answers.length === 0 && <p className="text-ink-2 mt-2">{t.questions.noAnswers}</p>}
          <ol className="space-y-4 mt-4">
            {q.answers.map((a) => {
              const rp = a.author.roamerProfile;
              const isRoamer = rp?.status === "APPROVED";
              return (
                <li key={a.id} id={`a-${a.id}`} className="card p-5">
                  <div className="flex items-center gap-3">
                    <Avatar src={a.author.avatarUrl} name={a.author.name} size={42} />
                    <div className="text-[13px] leading-snug">
                      <div className="flex items-center gap-1.5">
                        {isRoamer ? <Link href={href(locale, `/roamer/${rp!.slug}`)} className="font-semibold text-[14.5px] text-ink hover:text-brand">{a.author.name}</Link> : <b className="text-[14.5px] text-ink">{a.author.name}</b>}
                        {isRoamer && rp!.verified && <VerifiedBadge size={15} title={t.common.verified} />}
                        {isRoamer && <span className="chip bg-teal-900 text-white text-[11px] px-2 py-0.5">{t.questions.roamerBadge}</span>}
                      </div>
                      <div className="text-ink-2">
                        {isRoamer && <>{fmt(t.home.livesIn, { n: rp!.yearsInCity, city: pickTr(rp!.city, locale).name, cityIn: pickTr(rp!.city, locale).locative })} · </>}
                        <time dateTime={a.createdAt.toISOString()}>{timeAgo(a.createdAt, t.time)}</time>
                      </div>
                    </div>
                  </div>
                  <div className="prose-ar mt-3 text-[15.5px] text-ink">{a.body.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}</div>
                  {user && (
                    <details className="mt-1 text-[13px]">
                      <summary className="cursor-pointer text-muted inline-flex items-center gap-1"><Icon name="flag" size={13} />{t.common.report}</summary>
                      <ActionForm action={reportAction} locale={locale} hidden={{ targetType: "ANSWER", targetId: a.id }} className="mt-2 flex gap-2 items-end">
                        <div className="flex-1"><Input name="reason" label={t.common.reportReason} srLabel /></div>
                        <SubmitButton className="btn btn-outline px-4 py-2.5 text-[13px]">{t.common.submit}</SubmitButton>
                      </ActionForm>
                    </details>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <section className="card p-5 mt-6" aria-labelledby="your-answer">
          <h2 id="your-answer" className="text-[22px] mb-3">{t.questions.yourAnswer}</h2>
          {user ? (
            <ActionForm action={answerQuestionAction} locale={locale} hidden={{ questionId: q.id }} resetOnSuccess>
              <Textarea name="body" label={t.questions.yourAnswer} placeholder={t.questions.answerPlaceholder} rows={6} required minLength={20} />
              <SubmitButton>{t.questions.postAnswer}</SubmitButton>
            </ActionForm>
          ) : (
            <Link href={href(locale, "/login", { next: `${url}#your-answer` })} className="btn btn-primary px-6 py-3">{t.questions.loginToAnswer}</Link>
          )}
        </section>

        <HubCta className="mt-8" sticky={false} title={fmt(t.cities.askAbout, { city: q.cityName, cityIn: q.cityLocative })} primary={t.questions.askButton} primaryHref={href(locale, "/questions/ask", { city: q.citySlug, category: q.categorySlug })} secondary={t.cities.exploreRoamers} secondaryHref={href(locale, `/roamers/${q.citySlug}`)} />

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-[24px] mb-3">{t.questions.related}</h2>
            <div className="space-y-3">{related.map((r) => <QuestionRow key={r.id} q={r} locale={locale} t={t} />)}</div>
          </section>
        )}
        <nav aria-label={t.common.relatedTopics} className="mt-8 flex flex-wrap gap-2 text-[13px]">
          <Link className="chip hover:bg-brand-50" href={href(locale, `/cities/${q.citySlug}`)}>{q.cityName}</Link>
          <Link className="chip hover:bg-brand-50" href={href(locale, `/categories/${q.categorySlug}`)}>{q.categoryName}</Link>
          <Link className="chip hover:bg-brand-50" href={href(locale, "/guides", { city: q.citySlug })}>{t.nav.guides}</Link>
        </nav>
      </div>
      <div className="h-12" />
    </>
  );
}
