import Link from "next/link";
import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/config";
import { privateMetadata } from "@/lib/seo";
import { requireUser } from "@/lib/permissions";
import { db } from "@/lib/db";
import { fmt, timeAgo } from "@/lib/format";
import { accountNav } from "@/lib/nav";
import { DashShell, SideNav } from "@/components/SideNav";
import { StatusPill } from "@/components/ui";
import { markNotificationsReadAction } from "@/actions/admin";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) { const { t } = await resolveLocale(params); return privateMetadata(t.account.title); }

export default async function AccountPage({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const user = await requireUser(locale);
  const [notifications, questions, bookingCount, guideCount] = await Promise.all([
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
    db.question.findMany({ where: { authorId: user.id }, orderBy: { createdAt: "desc" }, take: 10, include: { _count: { select: { answers: true } } } }),
    db.booking.count({ where: { travelerId: user.id, status: { in: ["CONFIRMED", "COMPLETED"] } } }),
    db.guidePurchase.count({ where: { userId: user.id } }),
  ]);
  const unread = notifications.filter((n) => !n.readAt).length;
  return (
    <DashShell nav={<SideNav title={t.account.title} items={accountNav(locale, t)} active="overview" />}>
      <div>
        <h1 className="text-[36px]">{fmt(t.account.welcome, { name: user.name.split(" ")[0] })}</h1>
        <p className="text-ink-2">{user.email}</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <Link href={href(locale, "/account/bookings")} className="card p-5 hover:-translate-y-0.5 transition"><div className="text-[30px] font-bold">{bookingCount}</div><div className="text-ink-2 text-[14px]">{t.account.bookings}</div></Link>
        <Link href={href(locale, "/account/purchased-guides")} className="card p-5 hover:-translate-y-0.5 transition"><div className="text-[30px] font-bold">{guideCount}</div><div className="text-ink-2 text-[14px]">{t.account.purchased}</div></Link>
        {user.roamer ? (
          <Link href={href(locale, "/roamer-dashboard")} className="card p-5 bg-teal-900 text-white hover:-translate-y-0.5 transition">
            <div className="text-[13px] text-white/80">{t.account.roamerStatus}</div>
            <div className="mt-1"><StatusPill status={user.roamer.status} label={t.statuses[user.roamer.status as keyof typeof t.statuses]} /></div>
            <div className="mt-2 font-semibold">{t.account.goPanel} →</div>
          </Link>
        ) : (
          <Link href={href(locale, "/become-a-roamer")} className="card p-5 bg-teal-900 text-white hover:-translate-y-0.5 transition">
            <div className="font-display text-[22px] text-white">{t.account.becomeRoamer}</div>
            <div className="text-[13px] text-white/85 mt-1">{t.account.becomeRoamerText}</div>
          </Link>
        )}
      </div>
      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[24px]">{t.account.notifications} {unread > 0 && <span className="ml-1 align-middle text-[12px] font-sans bg-brand text-white rounded-full px-2 py-0.5">{unread}</span>}</h2>
          {unread > 0 && <form action={markNotificationsReadAction}><input type="hidden" name="locale" value={locale} /><button className="link-orange text-[13px]">{t.account.markAllRead}</button></form>}
        </div>
        {notifications.length ? (
          <ul className="mt-3 divide-y divide-line">
            {notifications.map((n) => (
              <li key={n.id} className={`py-3 text-[14px] flex gap-3 ${n.readAt ? "text-ink-2" : ""}`}>
                {!n.readAt && <span className="w-2 h-2 rounded-full bg-brand mt-1.5 flex-none" />}
                <div className="flex-1 min-w-0">{n.link ? <Link href={n.link} className="font-semibold hover:text-brand">{n.title}</Link> : <b>{n.title}</b>}<div className="text-ink-2 truncate">{n.body}</div></div>
                <span className="text-[12px] text-muted whitespace-nowrap">{timeAgo(n.createdAt, t.time)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-ink-2 mt-2">{t.account.noNotifications}</p>}
      </section>
      <section className="card p-5">
        <div className="flex items-center justify-between"><h2 className="text-[24px]">{t.account.myQuestions}</h2><Link href={href(locale, "/questions/ask")} className="btn btn-primary px-4 py-2 text-[13px]">{t.questions.askButton}</Link></div>
        {questions.length ? (
          <ul className="mt-3 divide-y divide-line">{questions.map((q) => <li key={q.id} className="py-3 flex justify-between gap-4 text-[14px]"><Link href={href(q.locale as never, `/questions/${q.slug}`)} className="hover:text-brand font-medium">{q.title}</Link><span className="text-ink-2 whitespace-nowrap">{q._count.answers} {t.common.answers}</span></li>)}</ul>
        ) : <p className="text-ink-2 mt-2">{t.common.none}</p>}
      </section>
    </DashShell>
  );
}
