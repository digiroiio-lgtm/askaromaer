import Link from "next/link";
import Image from "next/image";
import { Icon, type IconName } from "./Icon";

export function Avatar({ src, name, size = 40, className = "" }: { src?: string | null; name: string; size?: number; className?: string }) {
  if (src)
    return <Image src={src} alt={name} width={size} height={size} className={`rounded-full object-cover flex-none ${className}`} style={{ width: size, height: size }} />;
  const initials = name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span aria-hidden className={`inline-grid place-items-center rounded-full bg-teal-800 text-white font-semibold flex-none ${className}`} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </span>
  );
}

export function Stars({ value, count, size = 15, className = "" }: { value: number; count?: number; size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[13px] ${className}`}>
      <Icon name="star" size={size} fill="#f39c12" stroke="#f39c12" />
      <b className="font-semibold text-ink">{value.toFixed(1)}</b>
      {count !== undefined && <span className="text-muted">({count})</span>}
    </span>
  );
}

export function StarInput({ name = "rating", defaultValue = 5 }: { name?: string; defaultValue?: number }) {
  return (
    <div className="flex gap-3" role="radiogroup">
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className="inline-flex items-center gap-1 text-sm cursor-pointer">
          <input type="radio" name={name} value={n} defaultChecked={n === defaultValue} className="accent-[#e8641c]" />
          {n}
          <Icon name="star" size={14} fill="#f39c12" stroke="#f39c12" />
        </label>
      ))}
    </div>
  );
}

export function SectionHeader({ title, subtitle, link, linkLabel, as: Tag = "h2" }: { title: string; subtitle?: string; link?: string; linkLabel?: string; as?: "h2" | "h3" }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        <Tag className="text-[26px] md:text-[30px] leading-tight">{title}</Tag>
        {subtitle && <p className="text-[14px] text-ink-2 mt-0.5">{subtitle}</p>}
      </div>
      {link && linkLabel && (
        <Link href={link} className="link-orange text-[13px] shrink-0 mb-1">
          {linkLabel} <Icon name="arrowRight" size={16} />
        </Link>
      )}
    </div>
  );
}

export type StatItem = { icon: IconName; title: string; text: string };
export function StatStrip({ items, className = "" }: { items: StatItem[]; className?: string }) {
  return (
    <div className={`bg-peach/70 border-y border-line/60 ${className}`}>
      <div className="container-x grid grid-cols-2 lg:grid-cols-4 gap-y-5 py-5">
        {items.map((it, i) => (
          <div key={i} className={`flex items-center gap-3.5 px-1 lg:px-5 ${i > 0 ? "lg:border-l lg:border-[#e8d9c8]" : ""}`}>
            <Icon name={it.icon} size={34} strokeWidth={1.6} className="text-brand flex-none" />
            <div>
              <div className="font-display text-[17px] md:text-[19px] text-teal-900 leading-tight">{it.title}</div>
              <div className="text-[12.5px] md:text-[13px] text-ink-2 leading-snug">{it.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageHero({
  title,
  subtitle,
  image,
  children,
  imagePosition = "center",
}: {
  title: React.ReactNode;
  subtitle?: string;
  image: string;
  children?: React.ReactNode;
  imagePosition?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-cream -mt-[72px] pt-[72px]">
      <div className="absolute inset-y-0 right-0 w-full md:w-[56%]">
        <Image src={image} alt="" fill priority sizes="(max-width: 768px) 100vw, 60vw" className="object-cover" style={{ objectPosition: imagePosition }} />
        <div className="absolute inset-0 hero-fade md:block hidden" />
        <div className="absolute inset-0 bg-cream/80 md:hidden" />
      </div>
      <div className="relative container-x pt-8 pb-8 md:pt-10 md:pb-10 min-h-[230px] md:min-h-[260px]">
        <div className="max-w-[640px]">
          <h1 className="text-[42px] md:text-[54px] leading-[1.04]">{title}</h1>
          {subtitle && <p className="mt-3 text-[16px] md:text-[18px] text-ink leading-relaxed max-w-[520px]">{subtitle}</p>}
          {children && <div className="mt-6">{children}</div>}
        </div>
      </div>
    </section>
  );
}

export function SearchPill({ action, name = "q", placeholder, defaultValue, button, hidden }: { action: string; name?: string; placeholder: string; defaultValue?: string; button?: string; hidden?: Record<string, string> }) {
  return (
    <form action={action} method="get" role="search" className="flex items-center bg-white rounded-full shadow-pop pl-5 pr-1.5 py-1.5 max-w-[540px] border border-white">
      <Icon name="search" size={21} className="text-ink flex-none" />
      <label className="sr-only" htmlFor={`s-${name}`}>{placeholder}</label>
      <input id={`s-${name}`} name={name} defaultValue={defaultValue} placeholder={placeholder} className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-[14.5px] placeholder:text-ink-2 focus:outline-none" />
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {button ? <button className="btn btn-primary px-7 py-2.5 text-[14px]">{button}</button> : <span className="w-2" />}
    </form>
  );
}

export function CtaBand({ title, text, cta, href, image, children }: { title: string; text?: string; cta: string; href: string; image: string; children?: React.ReactNode }) {
  return (
    <section className="container-x my-10">
      <div className="band relative overflow-hidden rounded-[22px] text-white">
        <div className="absolute inset-y-0 right-0 w-[45%] hidden md:block">
          <Image src={image} alt="" fill sizes="45vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#114744] via-[#114744]/40 to-transparent" />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center gap-6 px-6 md:px-12 py-8 md:py-9">
          <div className="md:max-w-[480px]">
            <h2 className="text-white text-[30px] md:text-[34px] leading-[1.1] underline-swoosh">{title}</h2>
            {text && <p className="mt-6 text-[15px] md:text-[16px] text-white/90 leading-relaxed">{text}</p>}
          </div>
          {children}
          <div className="md:ml-auto">
            <Link href={href} className="btn btn-primary px-7 py-3.5 text-[16px] border-2 border-white/30">
              {cta} <Icon name="arrowRight" size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Pagination({ page, pages, makeHref, labels }: { page: number; pages: number; makeHref: (p: number) => string; labels: { previous: string; next: string; page: string } }) {
  if (pages <= 1) return null;
  const list: (number | "…")[] = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1 || (page <= 3 && p <= 5)) list.push(p);
    else if (list[list.length - 1] !== "…") list.push("…");
  }
  const cls = "grid place-items-center w-10 h-10 rounded-full border border-line bg-white text-[14px] font-medium text-ink shadow-card";
  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2 mt-8">
      {page > 1 ? <Link aria-label={labels.previous} href={makeHref(page - 1)} className={cls}><Icon name="chevronLeft" size={16} /></Link> : <span className={`${cls} opacity-40`}><Icon name="chevronLeft" size={16} /></span>}
      {list.map((p, i) =>
        p === "…" ? <span key={`e${i}`} className="px-1 text-muted">•••</span> :
        p === page ? <span key={p} aria-current="page" className="grid place-items-center w-10 h-10 rounded-full bg-brand text-white font-semibold">{p}</span> :
        <Link key={p} href={makeHref(p)} aria-label={`${labels.page} ${p}`} className={cls}>{p}</Link>
      )}
      {page < pages ? <Link aria-label={labels.next} href={makeHref(page + 1)} className={cls}><Icon name="chevronRight" size={16} /></Link> : <span className={`${cls} opacity-40`}><Icon name="chevronRight" size={16} /></span>}
    </nav>
  );
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <Icon name="chevronRight" size={12} />}
            {it.href ? <Link href={it.href} className="hover:text-brand">{it.name}</Link> : <span aria-current="page" className="text-ink-2">{it.name}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function StatusPill({ status, label }: { status: string; label: string }) {
  const color =
    ["APPROVED", "CONFIRMED", "COMPLETED", "SUCCEEDED", "PUBLISHED", "RESOLVED"].includes(status) ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    ["PENDING", "PENDING_PAYMENT", "PENDING_REVIEW", "OPEN", "DRAFT"].includes(status) ? "bg-amber-50 text-amber-700 border-amber-200" :
    "bg-rose-50 text-rose-700 border-rose-200";
  return <span className={`inline-block border rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${color}`}>{label}</span>;
}

export function Notice({ kind = "info", children }: { kind?: "info" | "success" | "error" | "warn"; children: React.ReactNode }) {
  const c = { info: "bg-teal-900/5 border-teal-900/15 text-teal-900", success: "bg-emerald-50 border-emerald-200 text-emerald-800", error: "bg-rose-50 border-rose-200 text-rose-800", warn: "bg-amber-50 border-amber-200 text-amber-800" }[kind];
  return <div role={kind === "error" ? "alert" : "status"} className={`border rounded-xl px-4 py-3 text-[14px] ${c}`}>{children}</div>;
}

export function EmptyState({ text, cta, href }: { text: string; cta?: string; href?: string }) {
  return (
    <div className="card p-8 text-center text-ink-2">
      <p>{text}</p>
      {cta && href && <Link href={href} className="btn btn-primary px-6 py-2.5 mt-4 text-[14px]">{cta}</Link>}
    </div>
  );
}

/** Lead CTA: inline card + sticky bottom bar on mobile. */
export function HubCta({ title, primary, primaryHref, secondary, secondaryHref, sticky = true, className = "container-x mt-10" }: { title: string; primary: string; primaryHref: string; secondary?: string; secondaryHref?: string; sticky?: boolean; className?: string }) {
  return (
    <>
      <section className={className}>
        <div className="card p-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <h2 className="text-[24px] md:text-[28px] leading-tight">{title}</h2>
          <div className="flex flex-wrap gap-3">
            <Link href={primaryHref} className="btn btn-primary px-6 py-3">{primary} <Icon name="arrowRight" size={18} /></Link>
            {secondary && secondaryHref && <Link href={secondaryHref} className="btn px-6 py-3 border border-line">{secondary}</Link>}
          </div>
        </div>
      </section>
      {sticky && <div className="md:hidden h-16" aria-hidden />}
      {sticky && <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-line p-3">
        <Link href={primaryHref} className="btn btn-primary w-full py-3">{primary} <Icon name="arrowRight" size={18} /></Link>
      </div>}
    </>
  );
}

/** Long-form hub text + FAQ accordion (native <details>, content stays in HTML for crawlers). */
export function HubContent({ title, body, faq, faqTitle }: { title: string; body: string; faq: { q: string; a: string }[]; faqTitle: string }) {
  const paras = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (!paras.length && !faq.length) return null;
  return (
    <section className="container-x mt-10 grid lg:grid-cols-[1.2fr_1fr] gap-8">
      {paras.length > 0 && (
        <div>
          <h2 className="text-[26px] md:text-[30px] leading-tight">{title}</h2>
          <div className="mt-3 space-y-3 text-[16px] leading-relaxed text-ink-2">{paras.map((p, i) => <p key={i}>{p}</p>)}</div>
        </div>
      )}
      {faq.length > 0 && (
        <div>
          <h2 className="text-[26px] md:text-[30px] leading-tight">{faqTitle}</h2>
          <div className="mt-3 space-y-2">
            {faq.map((f, i) => (
              <details key={i} className="card px-4 py-3 group">
                <summary className="cursor-pointer font-semibold text-[15px]">{f.q}</summary>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
