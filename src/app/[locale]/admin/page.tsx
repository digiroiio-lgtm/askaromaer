import Link from "next/link";
import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/config";
import { privateMetadata } from "@/lib/seo";
import { requireAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { date, money, excerpt } from "@/lib/format";
import { DashShell, SideNav } from "@/components/SideNav";
import { StatusPill } from "@/components/ui";
import { decideGuideAction, decideRoamerAction, refundPaymentAction, resolveReportAction, setContentStatusAction, setFeeAction, userAdminAction, verifyRoamerAction } from "@/actions/admin";
import { one, type SP } from "@/components/filters";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<SP> };
export async function generateMetadata({ params }: Props) { const { t } = await resolveLocale(params); return privateMetadata(t.admin.title); }

function Btn({ action, fields, label, kind = "outline", locale }: { action: (fd: FormData) => Promise<void>; fields: Record<string, string>; label: string; kind?: "outline" | "primary" | "danger"; locale: string }) {
  const cls = kind === "primary" ? "btn btn-primary" : kind === "danger" ? "btn border border-rose-300 text-rose-700 bg-white hover:bg-rose-50" : "btn btn-outline";
  return (
    <form action={action} className="inline">
      <input type="hidden" name="locale" value={locale} />
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <button className={`${cls} px-3 py-1.5 text-[12.5px]`}>{label}</button>
    </form>
  );
}

export default async function AdminPage({ params, searchParams }: Props) {
  const { locale, t } = await resolveLocale(params);
  const me = await requireAdmin(locale);
  const tab = one(await searchParams, "tab") || "roamers";
  const tabs = ["roamers", "guides", "moderation", "users", "payments", "settings"] as const;
  const nav = tabs.map((k) => ({ key: k, label: t.admin[k], href: href(locale, "/admin", { tab: k }) }));
  const T = (s: string) => t.statuses[s as keyof typeof t.statuses] ?? s;

  let body: React.ReactNode = null;
  if (tab === "roamers") {
    const list = await db.roamerProfile.findMany({ include: { user: true, city: { include: { translations: true } }, verifications: { orderBy: { createdAt: "desc" } } }, orderBy: [{ status: "desc" }, { createdAt: "desc" }] });
    body = (
      <ul className="space-y-3">
        {list.map((r) => (
          <li key={r.id} className="card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[220px]">
                <Link href={href(locale, `/roamer/${r.slug}`)} className="font-semibold hover:text-brand">{r.user.name}</Link> <span className="text-[13px] text-ink-2">· {r.user.email} · {r.city.translations.find((x) => x.locale === locale)?.name} · {r.yearsInCity}y</span>
                <p className="text-[13px] text-ink-2">{r.headline}</p>
                {r.verifications[0] && <p className="text-[12.5px] text-muted">{r.verifications[0].type}: {r.verifications[0].evidence}</p>}
              </div>
              <StatusPill status={r.status} label={T(r.status)} />
              {r.verified && <StatusPill status="APPROVED" label={t.common.verified} />}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {r.status !== "APPROVED" && <Btn locale={locale} action={decideRoamerAction} fields={{ roamerId: r.id, decision: "APPROVED" }} label={t.admin.approve} kind="primary" />}
              {r.status === "PENDING" && <Btn locale={locale} action={decideRoamerAction} fields={{ roamerId: r.id, decision: "REJECTED" }} label={t.admin.reject} kind="danger" />}
              {r.status === "APPROVED" && <Btn locale={locale} action={decideRoamerAction} fields={{ roamerId: r.id, decision: "SUSPENDED" }} label={t.admin.suspend} kind="danger" />}
              <Btn locale={locale} action={verifyRoamerAction} fields={{ roamerId: r.id, verified: r.verified ? "0" : "1" }} label={r.verified ? `✕ ${t.common.verified}` : t.admin.verify} />
            </div>
          </li>
        ))}
      </ul>
    );
  } else if (tab === "guides") {
    const list = await db.guide.findMany({ where: { status: { in: ["PENDING_REVIEW", "PUBLISHED", "REJECTED"] } }, include: { roamer: { include: { user: true } }, _count: { select: { chapters: true } } }, orderBy: [{ status: "asc" }, { updatedAt: "desc" }] });
    body = list.length ? (
      <ul className="space-y-3">
        {list.map((g) => (
          <li key={g.id} className="card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[220px]"><Link href={href(g.locale as never, `/guides/${g.slug}`)} className="font-semibold hover:text-brand">{g.title}</Link><div className="text-[13px] text-ink-2">{g.roamer.user.name} · {money(g.priceCents, g.currency, locale)} · {g._count.chapters} ch · {g.locale.toUpperCase()}</div></div>
              <StatusPill status={g.status} label={T(g.status)} />
            </div>
            <div className="flex flex-wrap gap-2 mt-3 items-center">
              {g.status !== "PUBLISHED" && <Btn locale={locale} action={decideGuideAction} fields={{ guideId: g.id, decision: "PUBLISHED" }} label={t.admin.approve} kind="primary" />}
              {g.status === "PENDING_REVIEW" && (
                <form action={decideGuideAction} className="flex gap-2"><input type="hidden" name="locale" value={locale} /><input type="hidden" name="guideId" value={g.id} /><input type="hidden" name="decision" value="REJECTED" /><input name="note" placeholder="Note" className="input py-1.5 text-[13px] w-48" /><button className="btn border border-rose-300 text-rose-700 bg-white px-3 py-1.5 text-[12.5px]">{t.admin.reject}</button></form>
              )}
              {g.status === "PUBLISHED" && <Btn locale={locale} action={decideGuideAction} fields={{ guideId: g.id, decision: "DRAFT" }} label={t.admin.hide} kind="danger" />}
            </div>
          </li>
        ))}
      </ul>
    ) : <p className="text-ink-2">{t.admin.nothing}</p>;
  } else if (tab === "moderation") {
    const [reports, questions, answers] = await Promise.all([
      db.moderationReport.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 50, include: { reporter: true } }),
      db.question.findMany({ orderBy: { createdAt: "desc" }, take: 15, include: { author: true } }),
      db.answer.findMany({ orderBy: { createdAt: "desc" }, take: 15, include: { author: true, question: true } }),
    ]);
    body = (
      <div className="space-y-6">
        <section className="card p-5"><h2 className="text-[22px] mb-2">{t.admin.reports}</h2>
          {reports.length ? <ul className="divide-y divide-line">{reports.map((r) => (
            <li key={r.id} className="py-3 flex flex-wrap gap-3 items-center text-[14px]">
              <span className="flex-1 min-w-[220px]"><b>{r.targetType}</b> {r.targetId.slice(0, 8)} — {r.reason} <span className="text-muted">({r.reporter.name})</span></span>
              <StatusPill status={r.status} label={T(r.status)} />
              {r.status === "OPEN" && <>
                {(r.targetType === "ANSWER" || r.targetType === "QUESTION") && <Btn locale={locale} action={setContentStatusAction} fields={{ type: r.targetType, id: r.targetId, status: "HIDDEN" }} label={t.admin.hide} kind="danger" />}
                <Btn locale={locale} action={resolveReportAction} fields={{ reportId: r.id, status: "RESOLVED" }} label={t.admin.resolve} />
                <Btn locale={locale} action={resolveReportAction} fields={{ reportId: r.id, status: "DISMISSED" }} label={t.admin.dismiss} />
              </>}
            </li>))}</ul> : <p className="text-ink-2">{t.admin.nothing}</p>}
        </section>
        <section className="card p-5"><h2 className="text-[22px] mb-2">{t.admin.recentQuestions}</h2>
          <ul className="divide-y divide-line">{questions.map((q) => (
            <li key={q.id} className="py-2.5 flex gap-3 items-center text-[14px]"><span className="flex-1">{q.title} <span className="text-muted">— {q.author.name}</span></span><StatusPill status={q.status} label={T(q.status)} />
              <Btn locale={locale} action={setContentStatusAction} fields={{ type: "QUESTION", id: q.id, status: q.status === "HIDDEN" ? "PUBLISHED" : "HIDDEN" }} label={q.status === "HIDDEN" ? t.admin.unhide : t.admin.hide} /></li>))}</ul>
        </section>
        <section className="card p-5"><h2 className="text-[22px] mb-2">{t.admin.recentAnswers}</h2>
          <ul className="divide-y divide-line">{answers.map((a) => (
            <li key={a.id} className="py-2.5 flex gap-3 items-center text-[14px]"><span className="flex-1">{excerpt(a.body, 90)} <span className="text-muted">— {a.author.name}</span></span><StatusPill status={a.status} label={T(a.status)} />
              <Btn locale={locale} action={setContentStatusAction} fields={{ type: "ANSWER", id: a.id, status: a.status === "HIDDEN" ? "PUBLISHED" : "HIDDEN" }} label={a.status === "HIDDEN" ? t.admin.unhide : t.admin.hide} /></li>))}</ul>
        </section>
      </div>
    );
  } else if (tab === "users") {
    const users = await db.user.findMany({ include: { roles: true }, orderBy: { createdAt: "desc" }, take: 100 });
    body = (
      <div className="card overflow-x-auto"><table className="w-full text-[14px]"><thead className="text-left text-ink-2 bg-cream-2/60"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Roles</th><th className="p-3">{t.common.actions}</th></tr></thead>
        <tbody>{users.map((u) => (
          <tr key={u.id} className="border-t border-line"><td className="p-3">{u.name}{u.isDemo && <span className="chip ml-2 text-[10px]">demo</span>}</td><td className="p-3">{u.email}</td><td className="p-3">{u.roles.map((r) => r.role).join(", ")}{u.suspended && " · SUSPENDED"}</td>
            <td className="p-3 space-x-1 whitespace-nowrap">{u.id !== me.id && <>
              <Btn locale={locale} action={userAdminAction} fields={{ userId: u.id, op: u.suspended ? "unsuspend" : "suspend" }} label={u.suspended ? t.admin.unsuspend : t.admin.suspend} kind={u.suspended ? "outline" : "danger"} />
              {!u.roles.some((r) => r.role === "ADMIN") && <Btn locale={locale} action={userAdminAction} fields={{ userId: u.id, op: "makeAdmin" }} label={t.admin.makeAdmin} />}
            </>}</td></tr>))}</tbody></table></div>
    );
  } else if (tab === "payments") {
    const payments = await db.payment.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 100 });
    body = (
      <div className="card overflow-x-auto"><table className="w-full text-[14px]"><thead className="text-left text-ink-2 bg-cream-2/60"><tr><th className="p-3">{t.common.date}</th><th className="p-3">User</th><th className="p-3">Type</th><th className="p-3">{t.common.amount}</th><th className="p-3">Fee</th><th className="p-3">{t.common.status}</th><th className="p-3" /></tr></thead>
        <tbody>{payments.map((p) => (
          <tr key={p.id} className="border-t border-line"><td className="p-3 whitespace-nowrap">{date(p.createdAt, locale)}</td><td className="p-3">{p.user.name}</td><td className="p-3">{p.purpose} · {p.provider}</td><td className="p-3">{money(p.amountCents, p.currency, locale)}</td><td className="p-3">{money(p.platformFeeCents, p.currency, locale)}</td><td className="p-3"><StatusPill status={p.status} label={T(p.status)} /></td>
            <td className="p-3">{p.status === "SUCCEEDED" && <Btn locale={locale} action={refundPaymentAction} fields={{ paymentId: p.id }} label={t.admin.refund} kind="danger" />}</td></tr>))}</tbody></table></div>
    );
  } else {
    const [fee, log] = await Promise.all([db.platformSetting.findUnique({ where: { key: "platformFeePercent" } }), db.moderationAction.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { actor: true } })]);
    body = (
      <div className="space-y-6">
        <form action={setFeeAction} className="card p-5 flex items-end gap-3"><input type="hidden" name="locale" value={locale} /><div><label className="label" htmlFor="fee">{t.admin.fee}</label><input id="fee" name="fee" type="number" min={0} max={60} defaultValue={fee?.value ?? "20"} className="input w-32" /></div><button className="btn btn-primary px-5 py-3">{t.common.save}</button></form>
        <section className="card p-5"><h2 className="text-[22px] mb-2">{t.admin.log}</h2><ul className="text-[13.5px] divide-y divide-line">{log.map((l) => <li key={l.id} className="py-2">{date(l.createdAt, locale, true)} — <b>{l.actor.name}</b>: {l.action} {l.targetType} {l.targetId.slice(0, 10)} {l.note ?? ""}</li>)}</ul></section>
      </div>
    );
  }
  return (
    <DashShell nav={<SideNav title={t.admin.title} items={nav} active={tab} />}>
      <h1 className="text-[34px]">{t.admin[tab as (typeof tabs)[number]] ?? t.admin.title}</h1>
      {body}
    </DashShell>
  );
}
