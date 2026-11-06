import { notFound } from "next/navigation";
import { resolveLocale } from "@/i18n";
import { privateMetadata } from "@/lib/seo";
import { requireRoamer } from "@/lib/permissions";
import { db } from "@/lib/db";
import { getAllCities, getCategories } from "@/lib/queries";
import { panelNav } from "@/lib/nav";
import { DashShell, SideNav } from "@/components/SideNav";
import { Notice, StatusPill } from "@/components/ui";
import { GuideEditor } from "@/components/GuideEditor";
import { submitGuideAction } from "@/actions/guides";

type Props = { params: Promise<{ locale: string; id: string }> };
export async function generateMetadata({ params }: Props) { const { t } = await resolveLocale(params); return privateMetadata(t.common.edit); }

export default async function EditGuidePage({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const { id } = await params;
  const user = await requireRoamer(locale);
  const g = await db.guide.findFirst({ where: { id, roamerId: user.roamer.id }, include: { chapters: { orderBy: { position: "asc" } }, city: true, category: true } });
  if (!g) notFound();
  const [cities, cats] = await Promise.all([getAllCities(locale), getCategories(locale)]);
  const approved = user.roamer.status === "APPROVED";
  return (
    <DashShell nav={<SideNav title={t.panel.title} items={panelNav(locale, t)} active="guides" />}>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[32px] flex-1">{g.title}</h1>
        <StatusPill status={g.status} label={t.statuses[g.status as keyof typeof t.statuses]} />
        {approved && ["DRAFT", "REJECTED"].includes(g.status) && (
          <form action={submitGuideAction}><input type="hidden" name="locale" value={locale} /><input type="hidden" name="guideId" value={g.id} /><button className="btn btn-primary px-5 py-2.5 text-[14px]">{t.panel.submitReview}</button></form>
        )}
      </div>
      {g.reviewNote && <Notice kind="warn">{g.reviewNote}</Notice>}
      {approved ? (
        <div className="card p-6">
          <GuideEditor locale={locale} t={t} cities={cities} cats={cats} guide={{ id: g.id, title: g.title, summary: g.summary, description: g.description, priceCents: g.priceCents, locale: g.locale, coverUrl: g.coverUrl, citySlug: g.city.slug, categorySlug: g.category.slug, chapters: g.chapters }} />
        </div>
      ) : <Notice kind="warn">{t.panel.onlyApproved}</Notice>}
    </DashShell>
  );
}
