import { resolveLocale } from "@/i18n";
import { privateMetadata } from "@/lib/seo";
import { requireRoamer } from "@/lib/permissions";
import { db } from "@/lib/db";
import { date, fmt, money } from "@/lib/format";
import { panelNav } from "@/lib/nav";
import { DashShell, SideNav } from "@/components/SideNav";
import { Notice, StatusPill } from "@/components/ui";
import { ActionForm, Input, Select } from "@/components/forms";
import { SubmitButton } from "@/components/client";
import { addSlotsAction, completeBookingAction, deleteSlotAction } from "@/actions/roamer";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) { const { t } = await resolveLocale(params); return privateMetadata(t.panel.calendar); }

export default async function CalendarPage({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const user = await requireRoamer(locale);
  const now = new Date();
  const [slots, bookings] = await Promise.all([
    db.availabilitySlot.findMany({ where: { roamerId: user.roamer.id, startsAt: { gt: now } }, orderBy: { startsAt: "asc" }, take: 60 }),
    db.booking.findMany({ where: { roamerId: user.roamer.id, status: { in: ["CONFIRMED", "COMPLETED"] } }, include: { traveler: { select: { name: true } } }, orderBy: { startsAt: "desc" }, take: 30 }),
  ]);
  const approved = user.roamer.status === "APPROVED";
  const tomorrow = new Date(Date.now() + 86400_000).toISOString().slice(0, 10);
  return (
    <DashShell nav={<SideNav title={t.panel.title} items={panelNav(locale, t)} active="calendar" />}>
      <h1 className="text-[36px]">{t.panel.calendar}</h1>
      {!approved && <Notice kind="warn">{t.panel.onlyApproved}</Notice>}
      {approved && (
        <div className="card p-6">
          <h2 className="text-[22px] mb-3">{t.panel.addSlots} <span className="font-sans text-[13px] text-muted">(UTC)</span></h2>
          <ActionForm action={addSlotsAction} locale={locale} className="grid sm:grid-cols-5 gap-3 items-end">
            <Input name="date" type="date" label={t.panel.slotDate} defaultValue={tomorrow} min={tomorrow} />
            <Input name="time" type="time" label={t.panel.slotTime} defaultValue="10:00" step={900} />
            <Select name="length" label={t.panel.slotLength} defaultValue="60" options={[15, 30, 60].map((n) => ({ value: String(n), label: String(n) }))} />
            <Input name="count" type="number" min={1} max={12} label={t.panel.slotCount} defaultValue={1} />
            <SubmitButton className="btn btn-primary py-3">{t.panel.add}</SubmitButton>
          </ActionForm>
        </div>
      )}
      <section className="card p-6">
        <h2 className="text-[22px]">{t.panel.openSlots}</h2>
        {slots.length ? (
          <ul className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {slots.map((s) => (
              <li key={s.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-[13.5px] ${s.isBooked ? "border-brand/40 bg-brand-50" : "border-line bg-white"}`}>
                <span>{date(s.startsAt, locale, true)}</span>
                {s.isBooked ? <b className="text-brand text-[12px]">{t.panel.booked}</b> : (
                  <form action={deleteSlotAction}><input type="hidden" name="locale" value={locale} /><input type="hidden" name="slotId" value={s.id} /><button className="text-muted hover:text-rose-600 text-[12px]" aria-label={t.common.delete}>✕</button></form>
                )}
              </li>
            ))}
          </ul>
        ) : <p className="text-ink-2 mt-2">{t.common.none}</p>}
      </section>
      <section className="card p-6">
        <h2 className="text-[22px]">{t.account.bookings}</h2>
        {bookings.length ? (
          <ul className="mt-3 divide-y divide-line">
            {bookings.map((b) => (
              <li key={b.id} className="py-3 flex flex-wrap items-center gap-3 text-[14px]">
                <span className="flex-1 min-w-[200px]"><b>{b.traveler.name}</b> · {fmt(t.panel.minutes, { n: b.durationMin })} · {money(b.priceCents, b.currency, locale)}<span className="block text-ink-2">{date(b.startsAt, locale, true)}{b.note ? ` — “${b.note}”` : ""}</span></span>
                <StatusPill status={b.status} label={t.statuses[b.status as keyof typeof t.statuses]} />
                {b.status === "CONFIRMED" && b.startsAt <= now && (
                  <form action={completeBookingAction}><input type="hidden" name="locale" value={locale} /><input type="hidden" name="bookingId" value={b.id} /><button className="btn btn-outline px-3 py-1.5 text-[12.5px]">{t.panel.complete}</button></form>
                )}
              </li>
            ))}
          </ul>
        ) : <p className="text-ink-2 mt-2">{t.common.none}</p>}
      </section>
    </DashShell>
  );
}
