"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { slugify } from "@/lib/format";
import { getDictionary } from "@/i18n";
import { href } from "@/i18n/config";
import { formLocale, zodErrors, str } from "./helpers";
import type { FormState } from "./state";

const askSchema = z.object({ title: str(12, 160), body: str(20, 4000), city: z.string().min(1), category: z.string().min(1) });

export async function askQuestionAction(_: FormState, fd: FormData): Promise<FormState> {
  const locale = formLocale(fd);
  const t = getDictionary(locale);
  const user = await getCurrentUser();
  if (!user) return { error: t.common.loginRequired };
  const parsed = askSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodErrors(parsed.error, locale);
  const [city, category] = await Promise.all([
    db.city.findUnique({ where: { slug: parsed.data.city } }),
    db.category.findUnique({ where: { slug: parsed.data.category } }),
  ]);
  if (!city) return { error: t.common.genericError, fields: { city: t.errors.required } };
  if (!category) return { error: t.common.genericError, fields: { category: t.errors.required } };
  const base = slugify(parsed.data.title) || "soru";
  const slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;
  await db.question.create({
    data: { slug, locale, title: parsed.data.title, body: parsed.data.body, authorId: user.id, cityId: city.id, categoryId: category.id },
  });
  // notify approved roamers of that city
  const roamers = await db.roamerProfile.findMany({ where: { cityId: city.id, status: "APPROVED" }, select: { userId: true } });
  await Promise.all(roamers.filter((r) => r.userId !== user.id).map((r) => notify(r.userId, "QUESTION_IN_CITY", parsed.data.title, t.questions.yourAnswer, href(locale, `/questions/${slug}`))));
  revalidatePath(`/${locale}/questions`);
  redirect(href(locale, `/questions/${slug}`, { posted: "1" }));
}

const answerSchema = z.object({ questionId: z.string().min(1), body: str(20, 6000) });

export async function answerQuestionAction(_: FormState, fd: FormData): Promise<FormState> {
  const locale = formLocale(fd);
  const t = getDictionary(locale);
  const user = await getCurrentUser();
  if (!user) return { error: t.common.loginRequired };
  const parsed = answerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodErrors(parsed.error, locale);
  const q = await db.question.findUnique({ where: { id: parsed.data.questionId } });
  if (!q || q.status !== "PUBLISHED") return { error: t.common.genericError };
  await db.answer.create({ data: { questionId: q.id, authorId: user.id, body: parsed.data.body } });
  await db.question.update({ where: { id: q.id }, data: { updatedAt: new Date() } });
  if (q.authorId !== user.id) await notify(q.authorId, "NEW_ANSWER", q.title, `${user.name}: ${parsed.data.body.slice(0, 120)}`, href(q.locale as never, `/questions/${q.slug}`));
  revalidatePath(`/${q.locale}/questions/${q.slug}`);
  return { ok: true, message: t.common.saved };
}

const reportSchema = z.object({ targetType: z.enum(["QUESTION", "ANSWER", "GUIDE", "ROAMER", "REVIEW"]), targetId: z.string().min(1), reason: str(5, 500) });

export async function reportAction(_: FormState, fd: FormData): Promise<FormState> {
  const locale = formLocale(fd);
  const t = getDictionary(locale);
  const user = await getCurrentUser();
  if (!user) return { error: t.common.loginRequired };
  const parsed = reportSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodErrors(parsed.error, locale);
  await db.moderationReport.create({ data: { reporterId: user.id, ...parsed.data } });
  return { ok: true, message: t.common.reported };
}
