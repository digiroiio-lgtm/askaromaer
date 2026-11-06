import { resolveLocale } from "@/i18n";
import { privateMetadata } from "@/lib/seo";
import { requireRoamer } from "@/lib/permissions";
import { db } from "@/lib/db";
import { date, money } from "@/lib/format";
import { panelNav } from "@/lib/nav";
import { DashShell, SideNav } from "@/components/SideNav";
import { Notice, StatusPill } from "@/components/ui";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) { const { t } = await resolveLocale(params); return privateMetadata(t.panel.earnings); }

export default async function EarningsPage({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const user = await requireRoamer(locale);
  const payments = await db.payment.findMany({ where: { payeeRoamerId: user.roamer.id, status: { in: ["SUCCEEDED", "REFUNDED"] } }, orderBy: { createdAt: "desc" }, take: 100 });
  const ok = payments.filter((p) => p.status === "SUCCEEDED");
  const sum = (k: "amountCents" | "platformFeeCents" | "payeeEarningsCents") => ok.reduce((s, p) => s + p[k], 0);
  return (
    <DashShell nav={<SideNav title={t.panel.title} items={panelNav(locale, t)} active="earnings" />}>
      <h1 className="text-[36px]">{t.panel.earnings}</h1>
      <div className="grid sm:grid-cols-3 gap-4">
        {[[t.panel.gross, sum("amountCents")], [t.panel.fee, sum("platformFeeCents")], [t.panel.net, sum("payeeEarningsCents")]].map(([l, v]) => (
          <div key={String(l)} className="card p-5"><div className="text-[28px] font-bold">{money(Number(v), "EUR", locale)}</div><div className="text-[14px] text-ink-2">{l}</div></div>
        ))}
      </div>
      <Notice>{t.panel.payoutNote}</Notice>
      <section className="card p-0 overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead className="text-left text-ink-2 bg-cream-2/60"><tr><th className="p-3">{t.common.date}</th><th className="p-3">Type</th><th className="p-3">{t.panel.gross}</th><th className="p-3">{t.panel.net}</th><th className="p-3">{t.common.status}</th></tr></thead>
          <tbody>{payments.map((p) => <tr key={p.id} className="border-t border-line"><td className="p-3">{date(p.createdAt, locale)}</td><td className="p-3">{p.purpose === "GUIDE" ? t.nav.guides : t.common.consultation}</td><td className="p-3">{money(p.amountCents, p.currency, locale)}</td><td className="p-3 font-semibold">{money(p.payeeEarningsCents, p.currency, locale)}</td><td className="p-3"><StatusPill status={p.status} label={t.statuses[p.status as keyof typeof t.statuses]} /></td></tr>)}</tbody>
        </table>
        {payments.length === 0 && <p className="p-5 text-ink-2">{t.common.none}</p>}
      </section>
    </DashShell>
  );
}
