"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { notify } from "@/lib/notify";
import { getDictionary } from "@/i18n";
import { href } from "@/i18n/config";
import { formLocale } from "./helpers";

async function admin() {
  const u = await getCurrentUser();
  if (!can.isAdmin(u)) throw new Error("Forbidden");
  return u!;
}

async function log(actorId: string, targetType: string, targetId: string, action: string, note?: string) {
  await db.moderationAction.create({ data: { actorId, targetType, targetId, action, note } });
}

const done = (fd: FormData) => revalidatePath(`/${formLocale(fd)}/admin`);

export async function decideRoamerAction(fd: FormData) {
  const a = await admin();
  const locale = formLocale(fd);
  const t = getDictionary(locale);
  const id = String(fd.get("roamerId"));
  const decision = String(fd.get("decision"));
  if (!["APPROVED", "REJECTED", "SUSPENDED"].includes(decision)) return;
  const p = await db.roamerProfile.update({ where: { id }, data: { status: decision } });
  await db.verificationRecord.updateMany({ where: { roamerId: id, type: "APPLICATION", status: "PENDING" }, data: { status: decision === "APPROVED" ? "APPROVED" : "REJECTED", reviewerId: a.id, reviewedAt: new Date() } });
  await notify(p.userId, "ROAMER_DECISION", t.panel.title, t.statuses[decision as "APPROVED"], href(locale, "/roamer-dashboard"));
  await log(a.id, "ROAMER", id, decision);
  done(fd);
}

export async function verifyRoamerAction(fd: FormData) {
  const a = await admin();
  const id = String(fd.get("roamerId"));
  const verified = fd.get("verified") === "1";
  await db.roamerProfile.update({ where: { id }, data: { verified, verifiedAt: verified ? new Date() : null } });
  await db.verificationRecord.updateMany({ where: { roamerId: id, status: "PENDING" }, data: { status: verified ? "APPROVED" : "REJECTED", reviewerId: a.id, reviewedAt: new Date() } });
  await log(a.id, "ROAMER", id, verified ? "VERIFY" : "UNVERIFY");
  done(fd);
}

export async function decideGuideAction(fd: FormData) {
  const a = await admin();
  const locale = formLocale(fd);
  const id = String(fd.get("guideId"));
  const decision = String(fd.get("decision"));
  if (!["PUBLISHED", "REJECTED", "DRAFT"].includes(decision)) return;
  const note = String(fd.get("note") ?? "").slice(0, 500) || null;
  const g = await db.guide.update({ where: { id }, data: { status: decision, reviewNote: note, publishedAt: decision === "PUBLISHED" ? new Date() : undefined }, include: { roamer: true } });
  await notify(g.roamer.userId, "GUIDE_DECISION", g.title, getDictionary(locale).statuses[decision as "PUBLISHED"], href(locale, "/roamer-dashboard/guides"));
  await log(a.id, "GUIDE", id, decision, note ?? undefined);
  done(fd);
}

export async function setContentStatusAction(fd: FormData) {
  const a = await admin();
  const type = String(fd.get("type"));
  const id = String(fd.get("id"));
  const status = String(fd.get("status")) === "HIDDEN" ? "HIDDEN" : "PUBLISHED";
  if (type === "QUESTION") await db.question.update({ where: { id }, data: { status } });
  else if (type === "ANSWER") await db.answer.update({ where: { id }, data: { status } });
  else if (type === "REVIEW") await db.review.update({ where: { id }, data: { status } });
  else return;
  await log(a.id, type, id, status);
  done(fd);
}

export async function resolveReportAction(fd: FormData) {
  const a = await admin();
  const id = String(fd.get("reportId"));
  const status = String(fd.get("status")) === "DISMISSED" ? "DISMISSED" : "RESOLVED";
  await db.moderationReport.update({ where: { id }, data: { status, resolvedAt: new Date() } });
  await log(a.id, "REPORT", id, status);
  done(fd);
}

export async function refundPaymentAction(fd: FormData) {
  const a = await admin();
  const p = await db.payment.findUnique({ where: { id: String(fd.get("paymentId")) } });
  if (!p || p.status !== "SUCCEEDED") return;
  await db.payment.update({ where: { id: p.id }, data: { status: "REFUNDED" } });
  if (p.bookingId) {
    const b = await db.booking.update({ where: { id: p.bookingId }, data: { status: "REFUNDED", slotId: null } });
    const slot = await db.availabilitySlot.findFirst({ where: { roamerId: b.roamerId, startsAt: b.startsAt } });
    if (slot && b.startsAt > new Date()) await db.availabilitySlot.update({ where: { id: slot.id }, data: { isBooked: false } });
  }
  if (p.purpose === "GUIDE") await db.guidePurchase.deleteMany({ where: { paymentId: p.id } });
  await notify(p.userId, "REFUND", getDictionary(formLocale(fd)).statuses.REFUNDED, `${(p.amountCents / 100).toFixed(2)} ${p.currency}`);
  await log(a.id, "PAYMENT", p.id, "REFUND");
  done(fd);
}

export async function userAdminAction(fd: FormData) {
  const a = await admin();
  const id = String(fd.get("userId"));
  const op = String(fd.get("op"));
  if (id === a.id) return; // never lock yourself out
  if (op === "suspend" || op === "unsuspend") {
    await db.user.update({ where: { id }, data: { suspended: op === "suspend" } });
    if (op === "suspend") await db.session.deleteMany({ where: { userId: id } });
  } else if (op === "makeAdmin") {
    await db.userRole.upsert({ where: { userId_role: { userId: id, role: "ADMIN" } }, update: {}, create: { userId: id, role: "ADMIN" } });
  } else return;
  await log(a.id, "USER", id, op);
  done(fd);
}

export async function setFeeAction(fd: FormData) {
  const a = await admin();
  const n = Number(fd.get("fee"));
  if (!Number.isFinite(n) || n < 0 || n > 60) return;
  await db.platformSetting.upsert({ where: { key: "platformFeePercent" }, update: { value: String(n) }, create: { key: "platformFeePercent", value: String(n) } });
  await log(a.id, "SETTING", "platformFeePercent", "SET", String(n));
  done(fd);
}

export async function markNotificationsReadAction(fd: FormData) {
  const u = await getCurrentUser();
  if (!u) return;
  await db.notification.updateMany({ where: { userId: u.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath(`/${formLocale(fd)}/account`);
}
