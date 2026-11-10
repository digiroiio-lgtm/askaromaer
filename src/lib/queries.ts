import "server-only";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import type { Locale } from "@/i18n/config";

/* ---------- translation helpers ---------- */

type WithTr<T> = { translations: T[] };
export function pickTr<T extends { locale: string }>(entity: WithTr<T>, locale: Locale): T {
  return entity.translations.find((t) => t.locale === locale) ?? entity.translations.find((t) => t.locale === "en") ?? entity.translations[0];
}

const now = () => new Date();

/* ---------- categories ---------- */

export const getCategories = cache(async (locale: Locale) => {
  const cats = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      translations: true,
      _count: { select: { questions: { where: { status: "PUBLISHED" } }, guides: { where: { status: "PUBLISHED" } } } },
    },
  });
  return cats.map((c) => {
    const tr = pickTr(c, locale);
    return { id: c.id, slug: c.slug, imageUrl: c.imageUrl, name: tr.name, description: tr.description, questionCount: c._count.questions, guideCount: c._count.guides };
  });
});
export async function getCategory(locale: Locale, slug: string) {
  return (await getCategories(locale)).find((c) => c.slug === slug) ?? null;
}
export type CategoryView = Awaited<ReturnType<typeof getCategories>>[number];

/* ---------- cities ---------- */

export const getAllCities = cache(async (locale: Locale) => {
  const cities = await db.city.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      translations: true,
      _count: {
        select: {
          questions: { where: { status: "PUBLISHED" } },
          roamers: { where: { status: "APPROVED" } },
          guides: { where: { status: "PUBLISHED" } },
        },
      },
    },
  });
  // top categories per city (by question count) used as tags
  const tagRows = await db.question.groupBy({ by: ["cityId", "categoryId"], where: { status: "PUBLISHED" }, _count: { _all: true } });
  const cats = await getCategories(locale);
  const catName = new Map(cats.map((c) => [c.id, c]));
  return cities.map((c) => {
    const tr = pickTr(c, locale);
    const tags = tagRows
      .filter((r) => r.cityId === c.id)
      .sort((a, b) => b._count._all - a._count._all)
      .slice(0, 3)
      .map((r) => catName.get(r.categoryId)!)
      .filter(Boolean);
    return {
      id: c.id,
      slug: c.slug,
      region: c.region,
      imageUrl: c.imageUrl,
      featured: c.featured,
      name: tr.name,
      locative: tr.locative,
      country: tr.country,
      intro: tr.intro,
      questionCount: c._count.questions,
      roamerCount: c._count.roamers,
      guideCount: c._count.guides,
      tags,
    };
  });
});
export type CityView = Awaited<ReturnType<typeof getAllCities>>[number];

export async function getCity(locale: Locale, slug: string) {
  const all = await getAllCities(locale);
  return all.find((c) => c.slug === slug) ?? null;
}

/* ---------- ratings ---------- */

async function roamerRatings(ids: string[]) {
  if (!ids.length) return new Map<string, { avg: number; count: number }>();
  const rows = await db.review.groupBy({
    by: ["roamerId"],
    where: { roamerId: { in: ids }, status: "PUBLISHED" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.roamerId!, { avg: r._avg.rating ?? 0, count: r._count._all }]));
}

async function guideRatings(ids: string[]) {
  if (!ids.length) return new Map<string, { avg: number; count: number }>();
  const rows = await db.review.groupBy({
    by: ["guideId"],
    where: { guideId: { in: ids }, status: "PUBLISHED" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.guideId!, { avg: r._avg.rating ?? 0, count: r._count._all }]));
}

/* ---------- roamers ---------- */

const roamerInclude = {
  user: { select: { name: true, avatarUrl: true } },
  city: { include: { translations: true } },
  expertise: { include: { translations: true }, orderBy: { sortOrder: "asc" } },
  offers: { where: { active: true }, orderBy: { durationMin: "asc" } },
  _count: { select: { slots: { where: { isBooked: false, startsAt: { gt: new Date(0) } } } } },
} satisfies Prisma.RoamerProfileInclude;

type RoamerRow = Prisma.RoamerProfileGetPayload<{ include: typeof roamerInclude }>;

async function toRoamerViews(rows: RoamerRow[], locale: Locale) {
  const ratings = await roamerRatings(rows.map((r) => r.id));
  const freeSlots = rows.length
    ? await db.availabilitySlot.groupBy({ by: ["roamerId"], where: { roamerId: { in: rows.map((r) => r.id) }, isBooked: false, startsAt: { gt: now() } }, _count: { _all: true } })
    : [];
  const freeMap = new Map(freeSlots.map((s) => [s.roamerId, s._count._all]));
  return rows.map((r) => {
    const city = pickTr(r.city, locale);
    const minOffer = r.offers.reduce<null | (typeof r.offers)[number]>((m, o) => (!m || o.priceCents < m.priceCents ? o : m), null);
    return {
      id: r.id,
      slug: r.slug,
      userId: r.userId,
      name: r.user.name,
      avatarUrl: r.user.avatarUrl,
      photoUrl: r.photoUrl ?? r.user.avatarUrl,
      headline: r.headline,
      bio: r.bio,
      motivation: r.motivation,
      yearsInCity: r.yearsInCity,
      languages: r.languages.split(",").filter(Boolean),
      verified: r.verified,
      status: r.status,
      citySlug: r.city.slug,
      cityName: city.name,
      cityLocative: city.locative,
      country: city.country,
      expertise: r.expertise.map((e) => ({ slug: e.slug, name: pickTr(e, locale).name })),
      offers: r.offers.map((o) => ({ id: o.id, durationMin: o.durationMin, priceCents: o.priceCents, currency: o.currency })),
      minPrice: minOffer ? { cents: minOffer.priceCents, currency: minOffer.currency } : null,
      rating: ratings.get(r.id) ?? null,
      freeSlots: freeMap.get(r.id) ?? 0,
    };
  });
}
export type RoamerView = Awaited<ReturnType<typeof toRoamerViews>>[number];

export type RoamerFilters = {
  q?: string;
  cities?: string[];
  expertise?: string[];
  languages?: string[];
  verified?: boolean;
  available?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export async function getRoamers(locale: Locale, f: RoamerFilters = {}) {
  const where: Prisma.RoamerProfileWhereInput = { status: "APPROVED", user: { suspended: false } };
  const and: Prisma.RoamerProfileWhereInput[] = [];
  if (f.cities?.length) and.push({ city: { slug: { in: f.cities } } });
  if (f.expertise?.length) and.push({ expertise: { some: { slug: { in: f.expertise } } } });
  if (f.languages?.length) and.push({ OR: f.languages.map((l) => ({ languages: { contains: l } })) });
  if (f.verified) and.push({ verified: true });
  if (f.available) and.push({ slots: { some: { isBooked: false, startsAt: { gt: now() } } } });
  if (f.q) {
    const q = f.q.trim();
    and.push({
      OR: [
        { user: { name: { contains: q } } },
        { headline: { contains: q } },
        { bio: { contains: q } },
        { city: { translations: { some: { name: { contains: q } } } } },
        { city: { slug: { contains: q.toLowerCase() } } },
        { expertise: { some: { translations: { some: { name: { contains: q } } } } } },
      ],
    });
  }
  if (and.length) where.AND = and;
  const rows = await db.roamerProfile.findMany({ where, include: roamerInclude, orderBy: { createdAt: "asc" } });
  let views = await toRoamerViews(rows, locale);
  const score = (v: RoamerView) => (v.rating ? v.rating.avg * Math.log10(10 + v.rating.count) : 0) + (v.verified ? 0.5 : 0);
  switch (f.sort) {
    case "rating":
      views.sort((a, b) => (b.rating?.avg ?? 0) - (a.rating?.avg ?? 0));
      break;
    case "priceAsc":
      views.sort((a, b) => (a.minPrice?.cents ?? 1e9) - (b.minPrice?.cents ?? 1e9));
      break;
    case "priceDesc":
      views.sort((a, b) => (b.minPrice?.cents ?? 0) - (a.minPrice?.cents ?? 0));
      break;
    default:
      views.sort((a, b) => score(b) - score(a));
  }
  const total = views.length;
  const pageSize = f.pageSize ?? 6;
  const page = Math.max(1, f.page ?? 1);
  views = views.slice((page - 1) * pageSize, page * pageSize);
  return { items: views, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getRoamerBySlug(locale: Locale, slug: string) {
  const row = await db.roamerProfile.findUnique({ where: { slug }, include: roamerInclude });
  if (!row) return null;
  return (await toRoamerViews([row], locale))[0];
}

/** Facet counts for the roamer directory sidebar */
export async function roamerFacets() {
  const rows = await db.roamerProfile.findMany({
    where: { status: "APPROVED", user: { suspended: false } },
    select: { languages: true, city: { select: { slug: true } }, expertise: { select: { slug: true } } },
  });
  const city = new Map<string, number>();
  const exp = new Map<string, number>();
  const lang = new Map<string, number>();
  for (const r of rows) {
    city.set(r.city.slug, (city.get(r.city.slug) ?? 0) + 1);
    for (const e of r.expertise) exp.set(e.slug, (exp.get(e.slug) ?? 0) + 1);
    for (const l of r.languages.split(",").filter(Boolean)) lang.set(l, (lang.get(l) ?? 0) + 1);
  }
  return { city, exp, lang, total: rows.length };
}

/* ---------- questions ---------- */

const questionInclude = {
  author: { select: { id: true, name: true, avatarUrl: true, roamerProfile: { select: { slug: true, status: true, yearsInCity: true } } } },
  city: { include: { translations: true } },
  category: { include: { translations: true } },
  _count: { select: { answers: { where: { status: "PUBLISHED" } } } },
} satisfies Prisma.QuestionInclude;

type QuestionRow = Prisma.QuestionGetPayload<{ include: typeof questionInclude }>;

function toQuestionView(q: QuestionRow, locale: Locale) {
  const city = pickTr(q.city, locale);
  return {
    id: q.id,
    slug: q.slug,
    locale: q.locale,
    title: q.title,
    body: q.body,
    status: q.status,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
    author: q.author,
    citySlug: q.city.slug,
    cityName: city.name,
    cityLocative: city.locative,
    cityImage: q.city.imageUrl,
    categorySlug: q.category.slug,
    categoryName: pickTr(q.category, locale).name,
    answerCount: q._count.answers,
  };
}
export type QuestionView = ReturnType<typeof toQuestionView>;

export type QuestionFilters = { q?: string; cities?: string[]; categories?: string[]; state?: string[]; sort?: string; page?: number; pageSize?: number };

export async function getQuestions(locale: Locale, f: QuestionFilters = {}) {
  const and: Prisma.QuestionWhereInput[] = [{ status: "PUBLISHED" }];
  if (f.cities?.length) and.push({ city: { slug: { in: f.cities } } });
  if (f.categories?.length) and.push({ category: { slug: { in: f.categories } } });
  const st = f.state ?? [];
  if (st.includes("answered") && !st.includes("unanswered")) and.push({ answers: { some: { status: "PUBLISHED" } } });
  if (st.includes("unanswered") && !st.includes("answered")) and.push({ answers: { none: { status: "PUBLISHED" } } });
  if (f.q) and.push({ OR: [{ title: { contains: f.q } }, { body: { contains: f.q } }] });
  const where = { AND: and };
  const pageSize = f.pageSize ?? 8;
  const page = Math.max(1, f.page ?? 1);
  const orderBy: Prisma.QuestionOrderByWithRelationInput[] =
    f.sort === "popular" ? [{ answers: { _count: "desc" } }, { createdAt: "desc" }] : [{ createdAt: "desc" }];
  const [rows, total] = await Promise.all([
    db.question.findMany({ where, include: questionInclude, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
    db.question.count({ where }),
  ]);
  return { items: rows.map((r) => toQuestionView(r, locale)), total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function questionFacets() {
  const [byCity, byCat, total, answered] = await Promise.all([
    db.question.groupBy({ by: ["cityId"], where: { status: "PUBLISHED" }, _count: { _all: true } }),
    db.question.groupBy({ by: ["categoryId"], where: { status: "PUBLISHED" }, _count: { _all: true } }),
    db.question.count({ where: { status: "PUBLISHED" } }),
    db.question.count({ where: { status: "PUBLISHED", answers: { some: { status: "PUBLISHED" } } } }),
  ]);
  return {
    city: new Map(byCity.map((r) => [r.cityId, r._count._all])),
    cat: new Map(byCat.map((r) => [r.categoryId, r._count._all])),
    total,
    answered,
    unanswered: total - answered,
  };
}

export async function getQuestionBySlug(locale: Locale, slug: string) {
  const q = await db.question.findUnique({
    where: { slug },
    include: {
      ...questionInclude,
      answers: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              roamerProfile: { select: { slug: true, status: true, yearsInCity: true, verified: true, city: { include: { translations: true } } } },
            },
          },
        },
      },
    },
  });
  if (!q) return null;
  return { ...toQuestionView(q, locale), answers: q.answers };
}

/** Latest answer snippet per question (for the homepage card) */
export async function firstAnswer(questionId: string) {
  return db.answer.findFirst({
    where: { questionId, status: "PUBLISHED" },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { name: true, avatarUrl: true, roamerProfile: { select: { slug: true, yearsInCity: true, status: true, city: { include: { translations: true } } } } } } },
  });
}

/* ---------- guides ---------- */

const guideInclude = {
  roamer: { include: { user: { select: { name: true, avatarUrl: true } }, city: { include: { translations: true } } } },
  city: { include: { translations: true } },
  category: { include: { translations: true } },
  chapters: { orderBy: { position: "asc" }, select: { id: true, position: true, title: true, isPreview: true } },
  _count: { select: { purchases: true } },
} satisfies Prisma.GuideInclude;

type GuideRow = Prisma.GuideGetPayload<{ include: typeof guideInclude }>;

async function toGuideViews(rows: GuideRow[], locale: Locale) {
  const ratings = await guideRatings(rows.map((r) => r.id));
  return rows.map((g) => ({
    id: g.id,
    slug: g.slug,
    locale: g.locale,
    title: g.title,
    summary: g.summary,
    description: g.description,
    coverUrl: g.coverUrl,
    priceCents: g.priceCents,
    currency: g.currency,
    status: g.status,
    publishedAt: g.publishedAt,
    updatedAt: g.updatedAt,
    roamerId: g.roamerId,
    roamerSlug: g.roamer.slug,
    roamerUserId: g.roamer.userId,
    authorName: g.roamer.user.name,
    authorAvatar: g.roamer.user.avatarUrl,
    authorVerified: g.roamer.verified,
    citySlug: g.city.slug,
    cityName: pickTr(g.city, locale).name,
    categorySlug: g.category.slug,
    categoryName: pickTr(g.category, locale).name,
    chapters: g.chapters,
    purchases: g._count.purchases,
    rating: ratings.get(g.id) ?? null,
  }));
}
export type GuideView = Awaited<ReturnType<typeof toGuideViews>>[number];

export type GuideFilters = { q?: string; cities?: string[]; categories?: string[]; languages?: string[]; sort?: string; take?: number; excludeId?: string };

export async function getGuides(locale: Locale, f: GuideFilters = {}) {
  const and: Prisma.GuideWhereInput[] = [{ status: "PUBLISHED" }];
  if (f.cities?.length) and.push({ city: { slug: { in: f.cities } } });
  if (f.categories?.length) and.push({ category: { slug: { in: f.categories } } });
  if (f.languages?.length) and.push({ locale: { in: f.languages } });
  if (f.excludeId) and.push({ id: { not: f.excludeId } });
  if (f.q) and.push({ OR: [{ title: { contains: f.q } }, { summary: { contains: f.q } }, { city: { translations: { some: { name: { contains: f.q } } } } }] });
  const orderBy: Prisma.GuideOrderByWithRelationInput[] =
    f.sort === "newest"
      ? [{ publishedAt: "desc" }]
      : f.sort === "priceAsc"
        ? [{ priceCents: "asc" }]
        : f.sort === "priceDesc"
          ? [{ priceCents: "desc" }]
          : [{ purchases: { _count: "desc" } }, { publishedAt: "desc" }];
  const rows = await db.guide.findMany({ where: { AND: and }, include: guideInclude, orderBy, take: f.take });
  const views = await toGuideViews(rows, locale);
  if (f.sort === "rating") views.sort((a, b) => (b.rating?.avg ?? 0) - (a.rating?.avg ?? 0));
  return views;
}

export async function getGuideBySlug(locale: Locale, slug: string) {
  const row = await db.guide.findUnique({ where: { slug }, include: guideInclude });
  if (!row) return null;
  return (await toGuideViews([row], locale))[0];
}

export async function getGuidesByIds(locale: Locale, ids: string[]) {
  const rows = await db.guide.findMany({ where: { id: { in: ids } }, include: guideInclude });
  return toGuideViews(rows, locale);
}

/* ---------- reviews ---------- */

export async function getReviews(where: Prisma.ReviewWhereInput, take = 10) {
  return db.review.findMany({
    where: { ...where, status: "PUBLISHED" },
    include: { author: { select: { name: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
}

/* ---------- site stats (real counts, never inflated) ---------- */

export const siteStats = cache(async () => {
  const [members, roamers, questions, answered, guides, cities, rating] = await Promise.all([
    db.user.count({ where: { suspended: false } }),
    db.roamerProfile.count({ where: { status: "APPROVED" } }),
    db.question.count({ where: { status: "PUBLISHED" } }),
    db.question.count({ where: { status: "PUBLISHED", answers: { some: { status: "PUBLISHED" } } } }),
    db.guide.count({ where: { status: "PUBLISHED" } }),
    db.city.count(),
    db.review.aggregate({ where: { status: "PUBLISHED", roamerId: { not: null } }, _avg: { rating: true }, _count: { _all: true } }),
  ]);
  return { members, roamers, questions, answered, guides, cities, avgRating: rating._avg.rating, ratingCount: rating._count._all };
});
