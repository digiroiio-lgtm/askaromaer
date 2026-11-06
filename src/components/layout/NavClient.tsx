"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import { locales, localeLabels, toInternal, toLocalized, isLocale, type Locale } from "@/i18n/config";

export type NavItem = { key: string; label: string; href: string };

function activeKey(pathname: string): string | null {
  const segs = pathname.split("/").filter(Boolean);
  const l = segs[0];
  if (!isLocale(l)) return null;
  const internal = toInternal(l, segs.slice(1));
  const first = internal[0];
  if (first === "roamer") return "roamers";
  return first ?? "home";
}

export function NavLinks({ items, categories, categoriesLabel, allLabel, allHref }: { items: NavItem[]; categories: { label: string; href: string }[]; categoriesLabel: string; allLabel: string; allHref: string }) {
  const pathname = usePathname();
  const active = activeKey(pathname);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  useEffect(() => setOpen(false), [pathname]);
  const cls = (k: string) => `relative py-2 text-[14.5px] font-semibold text-ink hover:text-brand ${active === k ? "after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-[3px] after:rounded-full after:bg-brand" : ""}`;
  return (
    <ul className="hidden lg:flex items-center gap-7">
      <li><Link href={items[0].href} className={cls(items[0].key)} aria-current={active === items[0].key ? "page" : undefined}>{items[0].label}</Link></li>
      <li ref={ref} className="relative">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={`${cls("categories")} inline-flex items-center gap-1`}>
          {categoriesLabel} <Icon name="chevronDown" size={15} strokeWidth={2.2} />
        </button>
        {open && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-64 card p-2 z-50">
            {categories.map((c) => <Link key={c.href} href={c.href} className="block rounded-lg px-3 py-2 text-[14px] hover:bg-cream-2">{c.label}</Link>)}
            <Link href={allHref} className="link-orange text-[13px] px-3 py-2">{allLabel} <Icon name="arrowRight" size={14} /></Link>
          </div>
        )}
      </li>
      {items.slice(1).map((it) => (
        <li key={it.key}><Link href={it.href} className={cls(it.key)} aria-current={active === it.key ? "page" : undefined}>{it.label}</Link></li>
      ))}
    </ul>
  );
}

export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  const target = (l: Locale) => {
    const segs = pathname.split("/").filter(Boolean);
    const cur = isLocale(segs[0]) ? segs[0] : locale;
    const internal = toInternal(cur, segs.slice(1));
    const localized = toLocalized(l, internal);
    const qs = sp.toString();
    return `/${l}/${localized.join("/")}${localized.length ? "/" : ""}${qs ? `?${qs}` : ""}`;
  };
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={label} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink py-2">
        <Icon name="globe" size={18} /> {locale.toUpperCase()} <Icon name="chevronDown" size={14} strokeWidth={2.2} />
      </button>
      {open && (
        <ul className="absolute right-0 top-full mt-2 w-40 card p-1.5 z-50" role="menu">
          {locales.map((l) => (
            <li key={l}>
              <a href={target(l)} hrefLang={l} lang={l} role="menuitem" className={`flex justify-between rounded-lg px-3 py-2 text-[14px] hover:bg-cream-2 ${l === locale ? "font-semibold text-brand" : ""}`}>
                {localeLabels[l]} <span className="text-muted">{l.toUpperCase()}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MobileMenu({ items, extra, label }: { items: NavItem[]; extra: React.ReactNode; label: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; }, [open]);
  return (
    <div className="lg:hidden">
      <button type="button" onClick={() => setOpen(true)} aria-label={label} aria-expanded={open} className="grid place-items-center w-10 h-10 rounded-full border border-line bg-white">
        <Icon name="menu" size={20} />
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] bg-black/40" onClick={() => setOpen(false)}>
          <nav className="absolute right-0 top-0 h-full w-[84%] max-w-[340px] bg-cream p-5 overflow-y-auto" onClick={(e) => e.stopPropagation()} aria-label={label}>
            <div className="flex justify-end">
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid place-items-center w-10 h-10 rounded-full border border-line bg-white"><Icon name="x" size={18} /></button>
            </div>
            <ul className="mt-4 space-y-1">
              {items.map((it) => <li key={it.key}><Link href={it.href} className="block rounded-lg px-3 py-3 text-[16px] font-semibold hover:bg-cream-2">{it.label}</Link></li>)}
            </ul>
            <div className="mt-6 border-t border-line pt-6 space-y-3">{extra}</div>
          </nav>
        </div>
      )}
    </div>
  );
}

export function UserMenu({ name, avatar, links, logout }: { name: string; avatar: React.ReactNode; links: { label: string; href: string }[]; logout: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="inline-flex items-center gap-2 rounded-full border border-line bg-white pl-1 pr-3 py-1 text-[14px] font-semibold">
        {avatar}
        <span className="max-w-[110px] truncate">{name}</span>
        <Icon name="chevronDown" size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 card p-1.5 z-50">
          {links.map((l) => <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2 text-[14px] hover:bg-cream-2">{l.label}</Link>)}
          <div className="border-t border-line mt-1 pt-1">{logout}</div>
        </div>
      )}
    </div>
  );
}
