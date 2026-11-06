"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createPendingPayment } from "@/lib/payments";
import { notify } from "@/lib/notify";
import { getDictionary } from "@/i18n";
import { href } from "@/i18n/config";
import { formLocale, zodErrors, str } from "./helpers";
import type { FormState } from "./state";

/* ---------------- bookings ---------------- */

const bookSchema = z.object({ roamerId: z.string().min(1), offerId: z.string().min(1), slotId: z.string().min(1), note: z.string().max(1000).optional() });

export async function createBookingAction(_: FormState, fd: FormData): Promise<FormState> {
  const locale = formLocale(fd);
  const t = getDictionary(locale);
  const user = await getCurrentUser();
  if (!user) return { error: t.common.loginRequired };
  const parsed = bookSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodErrors(parsed.error, locale);
  const { roamerId, offerId, slotId, note } = parsed.data;
  const roamer = await db.roamerProfile.findUnique({ where: { id: roamerId } });
  if (!roamer || roamer.status !== "APPROVED") return { error: t.common.forbidden };
  if (roamer.userId === user.id) return { error: t.common.forbidden };
  const offer = await db.consultationOffer.findFirst({ where: { id: offerId, roamerId, active: true } });
  const slot = await db.availabilitySlot.findFirst({ where: { id: slotId, roamerId } });
  if (!offer) return { error: t.common.genericError, fields: { offerId: t.errors.required } };
  if (!slot || slot.startsAt <= new Date()) return { error: t.errors.slotTaken, fields: { slotId: t.errors.slotTaken } };
  if (slot.endsAt.getTime() - slot.startsAt.getTime() < offer.durationMin * 60_000) return { error: t.errors.slotTaken, fields: { slotId: t.errors.slotTaken } };

  // atomic hold: only one booking can flip the slot
  const held = await db.availabilitySlot.updateMany({ where: { id: slot.id, isBooked: false }, data: { isBooked: true } });
  if (held.count === 0) return { error: t.errors.slotTaken, fields: { slotId: t.errors.slotTaken } };

  const booking = await db.booking.create({
    data: { travelerId: user.id, roamerId, offerId, slotId: slot.id, startsAt: slot.startsAt, durationMin: offer.durationMin, priceCents: offer.priceCents, currency: offer.currency, note: note?.trim() || null },
  });
  const payment = await createPendingPayment({ userId: user.id, purpose: "BOOKING", bookingId: booking.id, amountCents: offer.priceCents, currency: offer.currency, payeeRoamerId: roamerId });
  redirect(href(locale, `/account/checkout/${payment.id}`));
}

export async function confirmPaymentAction(fd: FormData) {
  const locale = formLocale(fd);
  const user = await getCurrentUser();
  if (!user) redirect(href(locale, "/login"));
  const payment = await db.payment.findFirst({ where: { id: String(fd.get("paymentId")), userId: user.id, status: "PENDING" } });
  if (!payment) redirect(href(locale, "/account"));
  if (payment.provider !== "test") throw new Error("Live provider payments are confirmed by webhook only");
  const t = getDictionary(locale);
  await db.payment.update({ where: { id: payment.id }, data: { status: "SUCCEEDED", providerRef: payment.providerRef ?? `test_${payment.id}` } });
  const payee = await db.roamerProfile.findUnique({ where: { id: payment.payeeRoamerId } });
  if (payment.purpose === "BOOKING" && payment.bookingId) {
    await db.booking.update({ where: { id: payment.bookingId }, data: { status: "CONFIRMED" } });
    if (payee) await notify(payee.userId, "NEW_BOOKING", t.panel.upcoming, user.name, href(locale, "/roamer-dashboard/calendar"));
    revalidatePath(`/${locale}/account/bookings`);
    redirect(href(locale, "/account/bookings", { paid: "1" }));
  }
  const guideId = payment.providerRef?.startsWith("guide:") ? payment.providerRef.slice(6) : null;
  if (payment.purpose === "GUIDE" && guideId) {
    await db.guidePurchase.upsert({ where: { guideId_userId: { guideId, userId: user.id } }, update: {}, create: { guideId, userId: user.id, paymentId: payment.id } });
    const guide = await db.guide.findUnique({ where: { id: guideId } });
    if (payee && guide) await notify(payee.userId, "GUIDE_SOLD", guide.title, user.name, href(locale, "/roamer-dashboard/earnings"));
    if (guide) redirect(href(guide.locale as never, `/guides/${guide.slug}/read`));
  }
  redirect(href(locale, "/account"));
}

export async function cancelCheckoutAction(fd: FormData) {
  const locale = formLocale(fd);
  const user = await getCurrentUser();
  if (!user) redirect(href(locale, "/login"));
  const payment = await db.payment.findFirst({ where: { id: String(fd.get("paymentId")), userId: user.id, status: "PENDING" } });
  if (payment) {
    await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    if (payment.bookingId) {
      const b = await db.booking.update({ where: { id: payment.bookingId }, data: { status: "CANCELLED" } });
      if (b.slotId) await db.availabilitySlot.update({ where: { id: b.slotId }, data: { isBooked: false } });
      await db.booking.update({ where: { id: b.id }, data: { slotId: null } });
    }
  }
  redirect(href(locale, "/account"));
}

export async function cancelBookingAction(fd: FormData) {
  const locale = formLocale(fd);
  const user = await getCurrentUser();
  if (!user) return;
  const b = await db.booking.findFirst({ where: { id: String(fd.get("bookingId")), travelerId: user.id, status: "CONFIRMED", startsAt: { gt: new Date() } }, include: { roamer: true } });
  if (!b) return;
  await db.$transaction([
    db.booking.update({ where: { id: b.id }, data: { status: "REFUNDED", slotId: null } }),
    ...(b.slotId ? [db.availabilitySlot.update({ where: { id: b.slotId }, data: { isBooked: false } })] : []),
    db.payment.updateMany({ where: { bookingId: b.id, status: "SUCCEEDED" }, data: { status: "REFUNDED" } }),
  ]);
  await notify(b.roamer.userId, "BOOKING_CANCELLED", getDictionary(locale).statuses.CANCELLED, user.name, href(locale, "/roamer-dashboard/calendar"));
  revalidatePath(`/${locale}/account/bookings`);
}

const reviewSchema = z.object({ rating: z.coerce.number().int().min(1).max(5), comment: str(10, 1500) });

export async function reviewBookingAction(_: FormState, fd: FormData): Promise<FormState> {
  const locale = formLocale(fd);
  const t = getDictionary(locale);
  const user = await getCurrentUser();
  if (!user) return { error: t.common.loginRequired };
  const parsed = reviewSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodErrors(parsed.error, locale);
  const b = await db.booking.findFirst({ where: { id: String(fd.get("bookingId")), travelerId: user.id, status: "COMPLETED" }, include: { review: true } });
  if (!b || b.review) return { error: t.common.forbidden };
  await db.review.create({ data: { authorId: user.id, roamerId: b.roamerId, bookingId: b.id, ...parsed.data } });
  revalidatePath(`/${locale}/account/bookings`);
  return { ok: true, message: t.account.reviewThanks };
}

/* ---------------- guides ---------------- */

export async function purchaseGuideAction(fd: FormData) {
  const locale = formLocale(fd);
  const user = await getCurrentUser();
  const guide = await db.guide.findUnique({ where: { id: String(fd.get("guideId")) }, include: { roamer: true } });
  if (!guide || guide.status !== "PUBLISHED") redirect(href(locale, "/guides"));
  if (!user) redirect(href(locale, "/login", { next: href(locale, `/guides/${guide.slug}`) }));
  const owned = await db.guidePurchase.findUnique({ where: { guideId_userId: { guideId: guide.id, userId: user.id } } });
  if (owned || guide.roamer.userId === user.id) redirect(href(guide.locale as never, `/guides/${guide.slug}/read`));
  const payment = await createPendingPayment({ userId: user.id, purpose: "GUIDE", guideId: guide.id, amountCents: guide.priceCents, currency: guide.currency, payeeRoamerId: guide.roamerId });
  redirect(href(locale, `/account/checkout/${payment.id}`));
}

export async function reviewGuideAction(_: FormState, fd: FormData): Promise<FormState> {
  const locale = formLocale(fd);
  const t = getDictionary(locale);
  const user = await getCurrentUser();
  if (!user) return { error: t.common.loginRequired };
  const parsed = reviewSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodErrors(parsed.error, locale);
  const guideId = String(fd.get("guideId"));
  const owned = await db.guidePurchase.findUnique({ where: { guideId_userId: { guideId, userId: user.id } } });
  if (!owned) return { error: t.common.forbidden };
  const exists = await db.review.findFirst({ where: { guideId, authorId: user.id } });
  if (exists) return { error: t.guides.reviewed };
  await db.review.create({ data: { authorId: user.id, guideId, ...parsed.data } });
  revalidatePath(`/${locale}/guides`);
  return { ok: true, message: t.account.reviewThanks };
}
