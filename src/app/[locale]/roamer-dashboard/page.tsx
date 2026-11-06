import Link from "next/link";
import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/config";
import { privateMetadata } from "@/lib/seo";
import { requireRoamer } from "@/lib/permissions";
import { db } from "@/lib/db";
import { date, fmt, money } from "@/lib/format";
import { panelNav } from "@/lib/nav";
import { DashShell, SideNav } from "@/components/SideNav";
import { Notice, StatusPill } from "@/components/ui";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> };
export async function generateMetadata({ params }: Props) { const { t } = await resolveLocale(params); return privateMetadata(t.panel.title); }

export default async function PanelPage({ params, searchParams }: Props) {
  const { locale, t } = await resolveLocale(params);
  const user = await requireRoamer(locale);
  const r = user.roamer;
  const [earn, confirmed, published, answers, upcoming] = await Promise.all([
    db.payment.aggregate({ where: { payeeRoamerId: r.id, status: "SUCCEEDED" }, _sum: { payeeEarningsCents: true } }),
    db.booking.count({ where: { roamerId: r.id, status: "CONFIRMED" } }),
    db.guide.count({ where: { roamerId: r.id, status: "PUBLISHED" } }),
    db.answer.count({ where: { authorId: user.id } }),
    db.booking.findMany({ where: { roamerId: r.id, status: "CONFIRMED", startsAt: { gt: new Date() } }, include: { traveler: { select: { name: true } } }, orderBy: { startsAt: "asc" }, take: 5 }),
  ]);
  const statusText = t.panel[`status${r.status}` as "statusPENDING"];
  return (
    <DashShell nav={<SideNav title={t.panel.title} items={panelNav(locale, t)} active="overview" />}>
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <h1 className="text-[36px]">{t.panel.title}</h1>
        <Link href={href(locale, `/roamer/${r.slug}`)} className="link-orange text-[14px]">{t.panel.viewPublic} →</Link>
      </div>
      {(await searchParams).applied && <Notice kind="success">{t.become.success}</Notice>}
      <Notice kind={r.status === "APPROVED" ? "success" : r.status === "PENDING" ? "warn" : "error"}><StatusPill status={r.status} label={t.statuses[r.status as keyof typeof t.statuses]} /> <span className="ml-2">{statusText}</span></Notice>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[[t.panel.totalEarnings, money(earn._sum.payeeEarningsCents ?? 0, "EUR", locale)], [t.panel.pendingBookings, confirmed], [t.panel.publishedGuides, published], [t.panel.answersGiven, answers]].map(([l, v]) => (
          <div key={String(l)} className="card p-5"><div className="text-[28px] font-bold">{v}</div><div className="text-[14px] text-ink-2">{l}</div></div>
        ))}
      </div>
      <section className="card p-5">
        <h2 className="text-[24px]">{t.panel.upcoming}</h2>
        {upcoming.length ? <ul className="mt-3 divide-y divide-line">{upcoming.map((b) => <li key={b.id} className="py-3 text-[14px] flex justify-between"><span>{b.traveler.name} · {fmt(t.panel.minutes, { n: b.durationMin })}</span><span className="text-ink-2">{date(b.startsAt, locale, true)}</span></li>)}</ul> : <p className="text-ink-2 mt-2">{t.common.none}</p>}
      </section>
    </DashShell>
  );
}
