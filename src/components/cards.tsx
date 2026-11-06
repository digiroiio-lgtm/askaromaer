import Link from "next/link";
import Image from "next/image";
import { Icon, VerifiedBadge } from "./Icon";
import { Avatar, Stars } from "./ui";
import { FavoriteButton } from "./client";
import { href, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/tr";
import type { CategoryView, CityView, GuideView, QuestionView, RoamerView } from "@/lib/queries";
import { fmt, money, num, timeAgo, excerpt } from "@/lib/format";

type Ctx = { locale: Locale; t: Dictionary };

export function CategoryCard({ c, locale }: { c: CategoryView; locale: Locale }) {
  return (
    <Link href={href(locale, "/questions", { category: c.slug })} className="card overflow-hidden group block hover:-translate-y-0.5 transition">
      <div className="relative h-[92px] md:h-[60px] lg:h-[64px] bg-chip">
        <Image src={c.imageUrl} alt="" fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover group-hover:scale-105 transition duration-500" />
      </div>
      <div className="px-4 py-3 bg-cream-2/60">
        <h3 className="text-[17px] leading-tight">{c.name}</h3>
        <p className="text-[12.5px] text-ink-2 mt-0.5">{c.description}</p>
      </div>
    </Link>
  );
}

/** Homepage carousel card */
export function CityCardCompact({ c, locale, t }: { c: CityView } & Ctx) {
  return (
    <Link href={href(locale, `/cities/${c.slug}`)} className="relative block rounded-[12px] overflow-hidden h-[122px] min-w-[200px] md:min-w-0 shadow-card group">
      <Image src={c.imageUrl} alt={c.name} fill sizes="(max-width: 768px) 60vw, 20vw" className="object-cover group-hover:scale-105 transition duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute left-4 bottom-3 text-white">
        <h3 className="text-white text-[22px] leading-none drop-shadow">{c.name}</h3>
        <p className="text-[12px] mt-1.5 text-white/95">
          {num(c.questionCount, locale)} {t.common.questions} · {num(c.roamerCount, locale)} {t.common.roamers}
        </p>
      </div>
    </Link>
  );
}

/** City directory tile */
export function CityTile({ c, locale, t, popular }: { c: CityView; popular?: boolean } & Ctx) {
  return (
    <article className="card overflow-hidden flex flex-col group relative">
      <Link href={href(locale, `/cities/${c.slug}`)} className="relative block h-[200px] lg:h-[190px]">
        <Image src={c.imageUrl} alt={c.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw" className="object-cover group-hover:scale-105 transition duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-teal-950/85 via-teal-950/10 to-transparent" />
        {popular && (
          <span className="absolute top-2.5 left-2.5 bg-white rounded-full px-2.5 py-1 text-[12px] font-semibold text-ink inline-flex items-center gap-1">
            <Icon name="fire" size={13} fill="#e8641c" stroke="#e8641c" /> {t.common.popular}
          </span>
        )}
        <div className="absolute left-3 bottom-2.5 text-white">
          <h3 className="text-white text-[24px] leading-none">{c.name}</h3>
          <p className="text-[13px] mt-1 inline-flex items-center gap-1"><Icon name="pin" size={13} />{c.country}</p>
        </div>
      </Link>
      <FavoriteButton id={`city:${c.slug}`} label={t.common.favorite} className="absolute top-2 right-2" />
      <div className="grid grid-cols-3 text-center py-3 text-[11.5px] text-ink-2 leading-tight">
        <div><Icon name="chatRound" size={17} className="mx-auto mb-1 text-ink-2" /><b className="block text-ink text-[12.5px]">{num(c.questionCount, locale)}</b>{t.common.questions}</div>
        <div><Icon name="users" size={17} className="mx-auto mb-1 text-ink-2" /><b className="block text-ink text-[12.5px]">{num(c.roamerCount, locale)}</b>{t.common.roamers}</div>
        <div><Icon name="book" size={17} className="mx-auto mb-1 text-ink-2" /><b className="block text-ink text-[12.5px]">{num(c.guideCount, locale)}</b>{t.common.guides}</div>
      </div>
      {c.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center px-2 pb-3 mt-auto">
          {c.tags.map((tag) => <span key={tag.slug} className="chip text-[11px] px-2">{tag.name}</span>)}
        </div>
      )}
    </article>
  );
}

export function RoamerCard({ r, locale, t }: { r: RoamerView } & Ctx) {
  const url = href(locale, `/roamer/${r.slug}`);
  return (
    <article className="card overflow-hidden flex flex-col relative group">
      <Link href={url} className="relative block h-[165px]" aria-label={r.name}>
        <Image src={r.photoUrl ?? "/images/hero/sunset-woman.jpg"} alt={r.name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover group-hover:scale-[1.03] transition duration-500" />
        {r.rating && (
          <span className="absolute top-2.5 left-2.5 bg-white rounded-full px-2.5 py-1 shadow-card"><Stars value={r.rating.avg} count={r.rating.count} size={14} /></span>
        )}
      </Link>
      <FavoriteButton id={`roamer:${r.slug}`} label={t.common.favorite} className="absolute top-2 right-2" />
      <div className="p-3.5 flex gap-2.5">
        <Avatar src={r.avatarUrl} name={r.name} size={46} className="border-2 border-white shadow-card -mt-0.5" />
        <div className="min-w-0 flex-1">
          <h3 className="font-sans text-[15.5px] font-semibold text-ink inline-flex items-center gap-1.5">
            <Link href={url} className="hover:text-brand">{r.name}</Link>
            {r.verified && <VerifiedBadge title={t.common.verified} />}
          </h3>
          <p className="text-[12.5px] text-ink-2 leading-snug">{r.cityName}, {r.country}</p>
          <p className="text-[12.5px] text-ink-2 leading-snug">{r.yearsInCity} {t.common.yearsLiving}</p>
        </div>
        {r.minPrice && (
          <div className="text-right leading-tight">
            <div className="text-[18px] font-bold text-ink">{money(r.minPrice.cents, r.minPrice.currency, locale)}</div>
            <div className="text-[10.5px] text-ink-2 max-w-[70px]">{t.common.from} {t.common.consultation}</div>
          </div>
        )}
      </div>
      <div className="px-3.5 pb-3.5 mt-auto flex items-center gap-1.5">
        <div className="flex gap-1.5 flex-wrap flex-1">
          {r.expertise.slice(0, 3).map((e) => <span key={e.slug} className="chip">{e.name}</span>)}
        </div>
        <Link href={url} aria-label={r.name} className="grid place-items-center w-9 h-7 rounded-full bg-brand text-white flex-none hover:bg-brand-600">
          <Icon name="arrowRight" size={16} strokeWidth={2.2} />
        </Link>
      </div>
      <div className={`absolute top-[140px] right-3 text-[11px] font-semibold rounded-full px-2 py-0.5 ${r.freeSlots ? "bg-emerald-50 text-emerald-700" : "bg-chip text-muted"}`}>
        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle ${r.freeSlots ? "bg-emerald-500" : "bg-muted"}`} />
        {r.freeSlots ? t.common.available : t.common.notAvailable}
      </div>
    </article>
  );
}

export function RoamerMini({ r, locale, t }: { r: RoamerView } & Ctx) {
  return (
    <Link href={href(locale, `/roamer/${r.slug}`)} className="card p-3.5 block hover:-translate-y-0.5 transition">
      <div className="flex items-center gap-3">
        <Avatar src={r.avatarUrl} name={r.name} size={56} />
        <div className="text-[13px] leading-snug">
          <div className="font-semibold text-ink">{r.name}</div>
          <div className="text-ink-2 flex items-center gap-1"><Icon name="pin" size={13} className="text-brand" />{r.cityName}</div>
          <div className="text-ink-2 flex items-center gap-1"><b className="text-brand font-semibold">{r.yearsInCity}</b> {t.common.years}</div>
        </div>
      </div>
      <div className="flex gap-1 flex-wrap mt-3">{r.expertise.slice(0, 3).map((e) => <span key={e.slug} className="chip text-[11px] px-2 py-0.5">{e.name}</span>)}</div>
      {r.rating && <Stars className="mt-2.5" value={r.rating.avg} count={r.rating.count} />}
    </Link>
  );
}

export function QuestionRow({ q, locale, t }: { q: QuestionView } & Ctx) {
  const url = href(q.locale as Locale, `/questions/${q.slug}`);
  return (
    <article className="card p-2.5 flex gap-4 relative">
      <Link href={url} className="relative hidden sm:block w-[112px] h-[108px] flex-none rounded-[10px] overflow-hidden" tabIndex={-1} aria-hidden>
        <Image src={q.cityImage} alt="" fill sizes="112px" className="object-cover" />
      </Link>
      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-center gap-2 text-[12.5px] flex-wrap">
          <span className="inline-flex items-center gap-1 font-semibold text-ink"><Icon name="pin" size={14} className="text-brand" />{q.cityName}</span>
          <span className="chip bg-brand-50 text-ink"><Icon name="flag" size={11} className="text-brand" />{q.categoryName}</span>
          {q.locale !== locale && <span className="chip uppercase">{q.locale}</span>}
        </div>
        <h3 className="mt-1.5 text-[18px] md:text-[19px] leading-snug"><Link href={url} className="hover:text-brand">{q.title}</Link></h3>
        <p className="text-[13px] text-ink-2 mt-0.5 line-clamp-2">{q.body}</p>
        <div className="flex items-center gap-2 mt-2 text-[12px] text-ink-2">
          <Avatar src={q.author.avatarUrl} name={q.author.name} size={20} />
          <span className="font-medium text-ink">{q.author.name}</span>
          <span>· {timeAgo(q.createdAt, t.time)}</span>
        </div>
      </div>
      <div className="flex flex-col items-center justify-between py-1 pr-1">
        <Link href={url} className="grid place-items-center text-center w-[74px] h-[68px] rounded-xl border border-line bg-cream-2/60 text-[12px] text-ink-2 leading-tight">
          <Icon name="chatRound" size={20} className="text-brand" />
          <b className="text-[15px] text-ink">{q.answerCount}</b>
          {t.questions.answerCount}
        </Link>
        <Icon name="bookmark" size={18} className="text-ink-2" />
      </div>
    </article>
  );
}

/** Homepage horizontal guide card */
export function GuideCardH({ g, locale, t }: { g: GuideView } & Ctx) {
  return (
    <Link href={href(locale, `/guides/${g.slug}`)} className="card overflow-hidden flex min-w-[280px] md:min-w-0 hover:-translate-y-0.5 transition">
      <div className="relative w-[104px] flex-none">
        <Image src={g.coverUrl} alt="" fill sizes="104px" className="object-cover" />
      </div>
      <div className="p-3 flex flex-col flex-1 min-w-0">
        <h3 className="font-sans font-semibold text-[14.5px] text-ink leading-snug">{g.title}</h3>
        <div className="flex items-center gap-1.5 mt-2 text-[12px] text-ink-2">
          <Avatar src={g.authorAvatar} name={g.authorName} size={18} />
          {g.authorName}
        </div>
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-[11px] text-ink-2 inline-flex items-center gap-1 whitespace-nowrap">
            <Icon name="book" size={13} className="text-brand flex-none" />
            {g.rating ? `${g.rating.count} ${t.common.reviews}` : fmt(t.guides.chapters, { n: g.chapters.length })}
          </span>
          <span className="bg-brand text-white text-[13px] font-bold rounded-full px-3 py-0.5">{money(g.priceCents, g.currency, locale)}</span>
        </div>
      </div>
    </Link>
  );
}

export function GuideTile({ g, locale, t }: { g: GuideView } & Ctx) {
  return (
    <article className="card overflow-hidden flex flex-col group">
      <Link href={href(locale, `/guides/${g.slug}`)} className="relative block h-[170px]">
        <Image src={g.coverUrl} alt="" fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition duration-500" />
        <span className="absolute top-2.5 left-2.5 chip bg-white/95"><Icon name="pin" size={12} className="text-brand" />{g.cityName}</span>
        {g.locale !== locale && <span className="absolute top-2.5 right-2.5 chip bg-white/95 uppercase">{g.locale}</span>}
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <span className="text-[12px] text-brand font-semibold">{g.categoryName}</span>
        <h3 className="text-[19px] leading-snug mt-0.5"><Link href={href(locale, `/guides/${g.slug}`)} className="hover:text-brand">{g.title}</Link></h3>
        <p className="text-[13px] text-ink-2 mt-1 line-clamp-2">{excerpt(g.summary, 120)}</p>
        <div className="flex items-center gap-2 mt-3 text-[12.5px] text-ink-2">
          <Avatar src={g.authorAvatar} name={g.authorName} size={22} />
          <span className="text-ink font-medium">{g.authorName}</span>
          {g.authorVerified && <VerifiedBadge size={14} title={t.common.verified} />}
        </div>
        <div className="flex items-center justify-between mt-auto pt-3">
          {g.rating ? <Stars value={g.rating.avg} count={g.rating.count} /> : <span className="text-[12px] text-muted">{fmt(t.guides.chapters, { n: g.chapters.length })}</span>}
          <span className="bg-brand text-white text-[14px] font-bold rounded-full px-3.5 py-1">{money(g.priceCents, g.currency, locale)}</span>
        </div>
      </div>
    </article>
  );
}
