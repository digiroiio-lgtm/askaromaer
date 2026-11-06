import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/config";
import { privateMetadata } from "@/lib/seo";
import { getGuideBySlug } from "@/lib/queries";
import { requireUser } from "@/lib/permissions";
import { canReadGuide } from "@/lib/entitlements";
import { db } from "@/lib/db";
import { date, fmt } from "@/lib/format";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const { slug } = await params;
  const g = await getGuideBySlug(locale, slug);
  return privateMetadata(g ? fmt(t.guides.readTitle, { title: g.title }) : "AskARoamer");
}

export default async function ReadGuidePage({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const { slug } = await params;
  const user = await requireUser(locale);
  const g = await getGuideBySlug(locale, slug);
  if (!g) notFound();
  // Entitlement check happens on the server before any paid content is loaded
  if (!(await canReadGuide(user, g))) redirect(href(locale, `/guides/${slug}`));
  const chapters = await db.guideChapter.findMany({ where: { guideId: g.id }, orderBy: { position: "asc" } });
  return (
    <div className="container-x max-w-[820px] py-8">
      <Link href={href(locale, `/guides/${slug}`)} className="link-orange text-[14px]">← {t.guides.backToGuide}</Link>
      <h1 className="text-[36px] md:text-[46px] leading-tight mt-4">{g.title}</h1>
      <p className="text-[13px] text-ink-2 mt-2">{t.common.by} {g.authorName} · {t.common.lastUpdated}: {date(g.updatedAt, locale)}</p>
      <nav className="card p-4 mt-6" aria-label={t.guides.contents}>
        <h2 className="text-[20px]">{t.guides.contents}</h2>
        <ol className="list-decimal pl-5 mt-2 space-y-1 text-[14.5px]">{chapters.map((c) => <li key={c.id}><a href={`#ch-${c.position}`} className="hover:text-brand">{c.title}</a></li>)}</ol>
      </nav>
      {chapters.map((c) => (
        <section key={c.id} id={`ch-${c.position}`} className="mt-8 scroll-mt-6">
          <h2 className="text-[28px]">{c.position}. {c.title}</h2>
          <div className="prose-ar mt-3 text-[16.5px] text-ink">{c.content.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}</div>
        </section>
      ))}
    </div>
  );
}
