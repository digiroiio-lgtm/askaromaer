import { notFound } from "next/navigation";
import { resolveLocale } from "@/i18n";
import { privateMetadata } from "@/lib/seo";
import { requireUser } from "@/lib/permissions";
import { db } from "@/lib/db";
import { date, fmt, money } from "@/lib/format";
import { Notice } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { cancelCheckoutAction, confirmPaymentAction } from "@/actions/commerce";

type Props = { params: Promise<{ locale: string; id: string }> };
export async function generateMetadata({ params }: Props) { const { t } = await resolveLocale(params); return privateMetadata(t.account.checkoutTitle); }

export default async function CheckoutPage({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const { id } = await params;
  const user = await requireUser(locale);
  const payment = await db.payment.findFirst({ where: { id, userId: user.id } });
  if (!payment) notFound();
  const booking = payment.bookingId ? await db.booking.findUnique({ where: { id: payment.bookingId }, include: { roamer: { include: { user: true } } } }) : null;
  const guideId = payment.providerRef?.startsWith("guide:") ? payment.providerRef.slice(6) : null;
  const guide = guideId ? await db.guide.findUnique({ where: { id: guideId } }) : null;
  return (
    <div className="container-x max-w-[620px] py-12">
      <h1 className="text-[38px]">{t.account.checkoutTitle}</h1>
      <div className="card p-6 mt-5 space-y-4">
        <h2 className="text-[20px]">{t.account.summary}</h2>
        {booking && <p className="text-[15px]">{fmt(t.account.withRoamer, { name: booking.roamer.user.name })} — {date(booking.startsAt, locale, true)} · {fmt(t.panel.minutes, { n: booking.durationMin })}</p>}
        {guide && <p className="text-[15px]">{guide.title}</p>}
        <div className="flex justify-between border-t border-line pt-4 text-[18px]"><span>{t.account.total}</span><b>{money(payment.amountCents, payment.currency, locale)}</b></div>
        {payment.status === "PENDING" ? (
          <>
            {payment.provider === "test" && <Notice kind="warn">{t.account.checkoutTestMode}</Notice>}
            <div className="flex flex-wrap gap-3">
              <form action={confirmPaymentAction}><input type="hidden" name="locale" value={locale} /><input type="hidden" name="paymentId" value={payment.id} /><SubmitButton className="btn btn-primary px-6 py-3">{t.account.checkoutConfirm}</SubmitButton></form>
              <form action={cancelCheckoutAction}><input type="hidden" name="locale" value={locale} /><input type="hidden" name="paymentId" value={payment.id} /><button className="btn btn-outline px-6 py-3">{t.account.checkoutCancel}</button></form>
            </div>
          </>
        ) : <Notice kind={payment.status === "SUCCEEDED" ? "success" : "info"}>{t.statuses[payment.status as keyof typeof t.statuses]}</Notice>}
      </div>
    </div>
  );
}
