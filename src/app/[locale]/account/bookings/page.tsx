import Link from "next/link";
import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/config";
import { privateMetadata } from "@/lib/seo";
import { requireUser } from "@/lib/permissions";
import { db } from "@/lib/db";
import { date, fmt, money } from "@/lib/format";
import { accountNav } from "@/lib/nav";
import { DashShell, SideNav } from "@/components/SideNav";
import { Avatar, EmptyState, Notice, StatusPill, StarInput } from "@/components/ui";
import { ActionForm, Textarea } from "@/components/forms";
import { ConfirmButton, SubmitButton } from "@/components/client";
import { cancelBookingAction, reviewBookingAction } from "@/actions/commerce";
import { one, type SP } from "@/components/filters";
import { TrackOnMount } from "@/components/Analytics";
import { purchaseParams } from "@/lib/purchase-event";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<SP> };
export async function generateMetadata({ params }: Props) { const { t } = await resolveLocale(params); return privateMetadata(t.account.bookings); }

export default async function BookingsPage({ params, searchParams }: Props) {
  const { locale, t } = await resolveLocale(params);
  const user = await requireUser(locale);
  const sp = await searchParams;
  const bookings = await db.booking.findMany({
    where: { travelerId: user.id, status: { not: "PENDING_PAYMENT" } },
    include: { roamer: { include: { user: { select: { name: true, avatarUrl: true } } } }, review: true },
    orderBy: { startsAt: "desc" },
  });
  const now = new Date();
  const pp = await purchaseParams(one(sp, "paid"), user.id);
  return (
    <DashShell nav={<SideNav title={t.account.title} items={accountNav(locale, t)} active="bookings" />}>
      <h1 className="text-[36px]">{t.account.bookings}</h1>
      {pp && <TrackOnMount name="purchase" params={pp} stripParam="paid" />}
      {one(sp, "paid") && <Notice kind="success">{t.account.paymentDone}</Notice>}
      {bookings.length === 0 ? <EmptyState text={t.account.noBookings} cta={t.account.findRoamer} href={href(locale, "/roamers")} /> : (
        <ul className="space-y-4">
          {bookings.map((b) => (
            <li key={b.id} className="card p-5">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar src={b.roamer.user.avatarUrl} name={b.roamer.user.name} size={48} />
                <div className="flex-1 min-w-0">
                  <Link href={href(locale, `/roamer/${b.roamer.slug}`)} className="font-semibold text-[16px] hover:text-brand">{fmt(t.account.withRoamer, { name: b.roamer.user.name })}</Link>
                  <div className="text-[14px] text-ink-2">{date(b.startsAt, locale, true)} · {fmt(t.panel.minutes, { n: b.durationMin })} · {money(b.priceCents, b.currency, locale)}</div>
                </div>
                <StatusPill status={b.status} label={t.statuses[b.status as keyof typeof t.statuses]} />
              </div>
              {b.status === "CONFIRMED" && b.startsAt > now && (
                <form action={cancelBookingAction} className="mt-3">
                  <input type="hidden" name="locale" value={locale} /><input type="hidden" name="bookingId" value={b.id} />
                  <ConfirmButton message={t.account.cancelBooking + "?"} className="btn btn-outline px-4 py-2 text-[13px]">{t.account.cancelBooking}</ConfirmButton>
                </form>
              )}
              {b.status === "COMPLETED" && !b.review && (
                <details className="mt-3">
                  <summary className="link-orange text-[14px] cursor-pointer">{t.account.leaveReview}</summary>
                  <ActionForm action={reviewBookingAction} locale={locale} hidden={{ bookingId: b.id }} className="space-y-3 mt-3">
                    <StarInput />
                    <Textarea name="comment" label={t.guides.comment} rows={3} required minLength={10} />
                    <SubmitButton className="btn btn-primary px-5 py-2.5 text-[14px]">{t.guides.sendReview}</SubmitButton>
                  </ActionForm>
                </details>
              )}
              {b.review && <p className="mt-3 text-[13px] text-ink-2">★ {b.review.rating} — {b.review.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </DashShell>
  );
}
