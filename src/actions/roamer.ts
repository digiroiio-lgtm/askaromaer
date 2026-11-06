"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, getCurrentUser, hashPassword } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { slugify } from "@/lib/format";
import { DURATIONS, SPOKEN_LANGUAGES } from "@/lib/constants";
import { getDictionary } from "@/i18n";
import { href } from "@/i18n/config";
import { formLocale, zodErrors, str } from "./helpers";
import type { FormState } from "./state";

const profileFields = {
  city: z.string().min(1),
  years: z.coerce.number().int().min(0).max(80),
  headline: str(10, 120),
  bio: str(40, 3000),
  expertise: z.array(z.string()).min(1),
  languages: z.array(z.enum(SPOKEN_LANGUAGES)).min(1),
};

const applySchema = z.object({
  ...profileFields,
  evidence: str(5, 500),
  consent: z.literal("on"),
});
const guestSchema = z.object({ name: str(2, 80), email: z.string().trim().toLowerCase().email().max(160), password: z.string().min(8).max(200) });

function read(fd: FormData) {
  return { ...Object.fromEntries(fd), expertise: fd.getAll("expertise").map(String), languages: fd.getAll("languages").map(String) };
}

async function uniqueSlug(name: string) {
  const base = slugify(name) || "roamer";
  let slug = base;
  for (let i = 2; await db.roamerProfile.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;
  return slug;
}

export async function applyRoamerAction(_: FormState, fd: FormData): Promise<FormState> {
  const locale = formLocale(fd);
  const t = getDictionary(locale);
  const data = read(fd);
  let user = await getCurrentUser();
  let userId = user?.id;
  let userName = user?.name ?? "";
  const parsed = applySchema.safeParse(data);
  const guest = user ? null : guestSchema.safeParse(data);
  if (!parsed.success || (guest && !guest.success)) {
    const a = parsed.success ? {} : zodErrors(parsed.error, locale).fields;
    const b = guest && !guest.success ? zodErrors(guest.error, locale).fields : {};
    return { error: t.common.genericError, fields: { ...b, ...a } };
  }
  if (user?.roamer) return { error: t.become.alreadyApplied.replace("{status}", t.statuses[user.roamer.status as keyof typeof t.statuses] ?? user.roamer.status) };
  const city = await db.city.findUnique({ where: { slug: parsed.data.city } });
  if (!city) return { error: t.common.genericError, fields: { city: t.errors.required } };
  const cats = await db.category.findMany({ where: { slug: { in: parsed.data.expertise } } });

  if (!userId && guest?.success) {
    if (await db.user.findUnique({ where: { email: guest.data.email } })) return { error: t.auth.emailTaken, fields: { email: t.auth.emailTaken } };
    const created = await db.user.create({
      data: { name: guest.data.name, email: guest.data.email, passwordHash: await hashPassword(guest.data.password), locale, roles: { create: [{ role: "TRAVELER" }] } },
    });
    userId = created.id;
    userName = created.name;
    await createSession(created.id);
  }
  if (!userId) return { error: t.common.loginRequired };

  const profile = await db.roamerProfile.create({
    data: {
      userId,
      slug: await uniqueSlug(userName),
      cityId: city.id,
      yearsInCity: parsed.data.years,
      headline: parsed.data.headline,
      bio: parsed.data.bio,
      languages: parsed.data.languages.join(","),
      status: "PENDING",
      expertise: { connect: cats.map((c) => ({ id: c.id })) },
      verifications: { create: [{ type: "APPLICATION", evidence: parsed.data.evidence }] },
    },
  });
  await db.userRole.upsert({ where: { userId_role: { userId, role: "ROAMER" } }, update: {}, create: { userId, role: "ROAMER" } });
  // default offers (inactive until roamer sets prices)
  const admins = await db.userRole.findMany({ where: { role: "ADMIN" }, select: { userId: true } });
  await Promise.all(admins.map((a) => notify(a.userId, "ROAMER_APPLICATION", userName, profile.headline, href(locale, "/admin", { tab: "roamers" }))));
  redirect(href(locale, "/roamer-dashboard", { applied: "1" }));
}

const updateSchema = z.object({
  ...profileFields,
  price15: z.string().optional(),
  price30: z.string().optional(),
  price60: z.string().optional(),
});

export async function updateRoamerProfileAction(_: FormState, fd: FormData): Promise<FormState> {
  const locale = formLocale(fd);
  const t = getDictionary(locale);
  const user = await getCurrentUser();
  if (!user?.roamer) return { error: t.common.forbidden };
  const parsed = updateSchema.safeParse(read(fd));
  if (!parsed.success) return zodErrors(parsed.error, locale);
  const city = await db.city.findUnique({ where: { slug: parsed.data.city } });
  if (!city) return { error: t.common.genericError, fields: { city: t.errors.required } };
  const prices: Record<number, number | null> = {};
  for (const d of DURATIONS) {
    const raw = String(parsed.data[`price${d}` as "price15"] ?? "").replace(",", ".").trim();
    if (!raw) { prices[d] = null; continue; }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 5 || n > 1000) return { error: t.common.genericError, fields: { [`price${d}`]: t.errors.number } };
    prices[d] = Math.round(n * 100);
  }
  const cats = await db.category.findMany({ where: { slug: { in: parsed.data.expertise } } });
  await db.roamerProfile.update({
    where: { id: user.roamer.id },
    data: {
      cityId: city.id,
      yearsInCity: parsed.data.years,
      headline: parsed.data.headline,
      bio: parsed.data.bio,
      languages: parsed.data.languages.join(","),
      expertise: { set: cats.map((c) => ({ id: c.id })) },
    },
  });
  for (const d of DURATIONS) {
    const p = prices[d];
    await db.consultationOffer.upsert({
      where: { roamerId_durationMin: { roamerId: user.roamer.id, durationMin: d } },
      update: p === null ? { active: false } : { active: true, priceCents: p },
      create: { roamerId: user.roamer.id, durationMin: d, priceCents: p ?? 0, active: p !== null },
    });
  }
  revalidatePath(`/${locale}/roamer/${user.roamer.slug}`);
  return { ok: true, message: t.common.saved };
}

export async function submitVerificationAction(_: FormState, fd: FormData): Promise<FormState> {
  const locale = formLocale(fd);
  const t = getDictionary(locale);
  const user = await getCurrentUser();
  if (!user?.roamer) return { error: t.common.forbidden };
  const evidence = String(fd.get("evidence") ?? "").trim();
  if (evidence.length < 5) return { error: t.common.genericError, fields: { evidence: t.errors.required } };
  await db.verificationRecord.create({ data: { roamerId: user.roamer.id, type: "RESIDENCE", evidence: evidence.slice(0, 500) } });
  return { ok: true, message: t.common.saved };
}

const slotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  count: z.coerce.number().int().min(1).max(12),
  length: z.coerce.number().int().refine((n) => [15, 30, 60].includes(n)),
});

export async function addSlotsAction(_: FormState, fd: FormData): Promise<FormState> {
  const locale = formLocale(fd);
  const t = getDictionary(locale);
  const user = await getCurrentUser();
  if (user?.roamer?.status !== "APPROVED") return { error: t.panel.onlyApproved };
  const parsed = slotSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodErrors(parsed.error, locale);
  const start = new Date(`${parsed.data.date}T${parsed.data.time}:00Z`);
  if (Number.isNaN(start.getTime()) || start < new Date()) return { error: t.common.genericError, fields: { date: t.errors.required } };
  const ms = parsed.data.length * 60_000;
  for (let i = 0; i < parsed.data.count; i++) {
    const s = new Date(start.getTime() + i * ms);
    await db.availabilitySlot.upsert({
      where: { roamerId_startsAt: { roamerId: user.roamer.id, startsAt: s } },
      update: {},
      create: { roamerId: user.roamer.id, startsAt: s, endsAt: new Date(s.getTime() + ms) },
    });
  }
  revalidatePath(`/${locale}/roamer-dashboard/calendar`);
  return { ok: true, message: t.common.saved };
}

export async function deleteSlotAction(fd: FormData) {
  const user = await getCurrentUser();
  if (!user?.roamer) return;
  await db.availabilitySlot.deleteMany({ where: { id: String(fd.get("slotId")), roamerId: user.roamer.id, isBooked: false } });
  revalidatePath(`/${formLocale(fd)}/roamer-dashboard/calendar`);
}

export async function completeBookingAction(fd: FormData) {
  const user = await getCurrentUser();
  if (!user?.roamer) return;
  const booking = await db.booking.findFirst({ where: { id: String(fd.get("bookingId")), roamerId: user.roamer.id, status: "CONFIRMED", startsAt: { lte: new Date() } } });
  if (!booking) return;
  await db.booking.update({ where: { id: booking.id }, data: { status: "COMPLETED" } });
  const locale = formLocale(fd);
  await notify(booking.travelerId, "BOOKING_COMPLETED", getDictionary(locale).account.leaveReview, user.name, href(locale, "/account/bookings"));
  revalidatePath(`/${locale}/roamer-dashboard/calendar`);
}
