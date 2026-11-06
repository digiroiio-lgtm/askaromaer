"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { slugify } from "@/lib/format";
import { getDictionary } from "@/i18n";
import { href, locales } from "@/i18n/config";
import { formLocale, zodErrors, str } from "./helpers";
import type { FormState } from "./state";

const guideSchema = z.object({
  title: str(8, 140),
  summary: str(20, 300),
  description: str(40, 5000),
  price: z.coerce.number().min(1).max(500),
  city: z.string().min(1),
  category: z.string().min(1),
  guideLocale: z.enum(locales),
  coverUrl: z.string().regex(/^\/images\/[a-z0-9/_-]+\.jpg$/),
});

export async function saveGuideAction(_: FormState, fd: FormData): Promise<FormState> {
  const locale = formLocale(fd);
  const t = getDictionary(locale);
  const user = await getCurrentUser();
  if (user?.roamer?.status !== "APPROVED") return { error: t.panel.onlyApproved };
  const parsed = guideSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodErrors(parsed.error, locale);
  const titles = fd.getAll("chapterTitle").map((s) => String(s).trim());
  const contents = fd.getAll("chapterContent").map((s) => String(s).trim());
  const previews = new Set(fd.getAll("chapterPreview").map(String));
  const chapters = titles
    .map((title, i) => ({ title, content: contents[i] ?? "", isPreview: previews.has(String(i)) }))
    .filter((c) => c.title || c.content);
  if (!chapters.length || chapters.some((c) => c.title.length < 3 || c.content.length < 20))
    return { error: t.common.genericError, fields: { chapters: `${t.panel.chapters}: ${t.panel.chapterTitle} ≥ 3, ${t.panel.chapterContent} ≥ 20` } };

  const [city, category] = await Promise.all([db.city.findUnique({ where: { slug: parsed.data.city } }), db.category.findUnique({ where: { slug: parsed.data.category } })]);
  if (!city || !category) return { error: t.common.genericError };
  const data = {
    title: parsed.data.title,
    summary: parsed.data.summary,
    description: parsed.data.description,
    priceCents: Math.round(parsed.data.price * 100),
    cityId: city.id,
    categoryId: category.id,
    locale: parsed.data.guideLocale,
    coverUrl: parsed.data.coverUrl,
  };
  const guideId = String(fd.get("guideId") ?? "");
  let id = guideId;
  if (guideId) {
    const existing = await db.guide.findFirst({ where: { id: guideId, roamerId: user.roamer.id } });
    if (!existing) return { error: t.common.forbidden };
    await db.guide.update({ where: { id: guideId }, data });
    await db.guideChapter.deleteMany({ where: { guideId } });
  } else {
    const slug = `${slugify(parsed.data.title) || "rehber"}-${Math.random().toString(36).slice(2, 6)}`;
    id = (await db.guide.create({ data: { ...data, slug, roamerId: user.roamer.id, status: "DRAFT" } })).id;
  }
  await db.guideChapter.createMany({ data: chapters.map((c, i) => ({ guideId: id, position: i + 1, ...c })) });
  revalidatePath(`/${locale}/roamer-dashboard/guides`);
  return { ok: true, message: t.common.saved, redirectTo: href(locale, `/roamer-dashboard/guides/${id}`) };
}

export async function submitGuideAction(fd: FormData) {
  const locale = formLocale(fd);
  const user = await getCurrentUser();
  if (user?.roamer?.status !== "APPROVED") return;
  const g = await db.guide.findFirst({ where: { id: String(fd.get("guideId")), roamerId: user.roamer.id, status: { in: ["DRAFT", "REJECTED"] } } });
  if (!g) return;
  await db.guide.update({ where: { id: g.id }, data: { status: "PENDING_REVIEW", reviewNote: null } });
  const admins = await db.userRole.findMany({ where: { role: "ADMIN" } });
  await Promise.all(admins.map((a) => notify(a.userId, "GUIDE_REVIEW", g.title, user.name, href(locale, "/admin", { tab: "guides" }))));
  revalidatePath(`/${locale}/roamer-dashboard/guides`);
}
