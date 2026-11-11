import Link from "next/link";
import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/config";
import { privateMetadata } from "@/lib/seo";
import { requireRoamer } from "@/lib/permissions";
import { db } from "@/lib/db";
import { fmt, money } from "@/lib/format";
import { panelNav } from "@/lib/nav";
import { DashShell, SideNav } from "@/components/SideNav";
import { EmptyState, Notice, StatusPill } from "@/components/ui";
import { submitGuideAction } from "@/actions/guides";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) { const { t } = await resolveLocale(params); return privateMetadata(t.panel.guides); }

export default async function PanelGuidesPage({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const user = await requireRoamer(locale);
  const guides = await db.guide.findMany({ where: { roamerId: user.roamer.id }, include: { _count: { select: { purchases: true } } }, orderBy: { updatedAt: "desc" } });
  const approved = user.roamer.status === "APPROVED";
  const myCity = await db.city.findUnique({
    where: { id: user.roamer.cityId },
    include: { translations: true, _count: { select: { guides: { where: { status: "PUBLISHED" } }, guideRequests: true } } },
  });
  const nudgeLang = approved && myCity
    ? await (async () => {
        for (const l of ["en", "fr"] as const) {
          if (!user.roamer.languages.split(",").includes(l)) continue;
          const n = await db.guide.count({ where: { status: "PUBLISHED", locale: l, cityId: user.roamer.cityId } });
          if (n === 0) return l;
        }
        return null;
      })()
    : null;
  const gap = approved && myCity && myCity._count.guides === 0 ? { slug: myCity.slug, name: (myCity.translations.find((x) => x.locale === locale) ?? myCity.translations[0]).name, n: myCity._count.guideRequests } : null;
  return (
    <DashShell nav={<SideNav title={t.panel.title} items={panelNav(locale, t)} active="guides" />}>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[36px]">{t.panel.guides}</h1>
        {approved && <Link href={href(locale, "/roamer-dashboard/guides/new")} className="btn btn-primary px-5 py-2.5 text-[14px]">+ {t.panel.newGuide}</Link>}
      </div>
      {!approved && <Notice kind="warn">{t.panel.onlyApproved}</Notice>}
      {nudgeLang && myCity && (
        <Notice kind="info">
          <Link href={href(locale, "/roamer-dashboard/guides/new", { city: myCity.slug, lang: nudgeLang })} className="link-orange font-semibold">{fmt(t.panel.writeGuideLang, { language: t.languages[nudgeLang] })} →</Link>
        </Notice>
      )}
      {gap && (
        <Notice kind="info">
          <span>{fmt(t.panel.guideWanted, { city: gap.name, n: gap.n })}</span>{" "}
          <Link href={href(locale, "/roamer-dashboard/guides/new", { city: gap.slug })} className="link-orange font-semibold">{fmt(t.panel.writeGuideFor, { city: gap.name })} →</Link>
        </Notice>
      )}
      {guides.length === 0 ? <EmptyState text={t.panel.noGuides} /> : (
        <ul className="space-y-3">
          {guides.map((g) => (
            <li key={g.id} className="card p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[220px]">
                <Link href={href(locale, `/roamer-dashboard/guides/${g.id}`)} className="font-semibold text-[16px] hover:text-brand">{g.title}</Link>
                <div className="text-[13px] text-ink-2">{money(g.priceCents, g.currency, locale)} · {fmt(t.panel.sales, { n: g._count.purchases })}{g.reviewNote ? ` · ${g.reviewNote}` : ""}</div>
              </div>
              <StatusPill status={g.status} label={t.statuses[g.status as keyof typeof t.statuses]} />
              {g.status === "PUBLISHED" && <Link href={href(g.locale as never, `/guides/${g.slug}`)} className="link-orange text-[13px]">→</Link>}
              {approved && ["DRAFT", "REJECTED"].includes(g.status) && (
                <form action={submitGuideAction}><input type="hidden" name="locale" value={locale} /><input type="hidden" name="guideId" value={g.id} /><button className="btn btn-outline px-4 py-2 text-[13px]">{t.panel.submitReview}</button></form>
              )}
            </li>
          ))}
        </ul>
      )}
    </DashShell>
  );
}
