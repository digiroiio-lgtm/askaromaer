"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useContext, useEffect, useRef, useState, useTransition } from "react";
import { PendingCtx } from "./forms";
import { useFormStatus } from "react-dom";
import { Icon } from "./Icon";

/** GET filter form that updates the URL on every change (no full reload). */
export function AutoFilterForm({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const ref = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const push = () => {
    const form = ref.current;
    if (!form) return;
    const fd = new FormData(form);
    const qs = new URLSearchParams();
    // keep params that are not part of this form (q, sort)
    for (const [k, v] of sp.entries()) if (!form.elements.namedItem(k) && k !== "page") qs.append(k, v);
    for (const [k, v] of fd.entries()) if (typeof v === "string" && v) qs.append(k, v);
    start(() => router.push(`${pathname}${qs.toString() ? `?${qs}` : ""}`, { scroll: false }));
  };
  return (
    <form ref={ref} id={id} method="get" className={className} onChange={push} onSubmit={(e) => { e.preventDefault(); push(); }} aria-busy={pending}>
      {children}
      <noscript><button className="btn btn-primary px-4 py-2 mt-3 text-sm">OK</button></noscript>
    </form>
  );
}

export function SortSelect({ options, label, value }: { options: { value: string; label: string }[]; label: string; value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  return (
    <label className="inline-flex items-center gap-2 text-[14px] text-ink">
      {label}:
      <span className="relative">
        <select
          value={value}
          onChange={(e) => {
            const qs = new URLSearchParams(sp.toString());
            qs.set("sort", e.target.value);
            qs.delete("page");
            router.push(`${pathname}?${qs}`, { scroll: false });
          }}
          className="appearance-none bg-transparent font-semibold pr-6 cursor-pointer focus:outline-none"
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Icon name="chevronDown" size={16} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
      </span>
    </label>
  );
}

export function FavoriteButton({ id, label, className = "" }: { id: string; label: string; className?: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    try { setOn((JSON.parse(localStorage.getItem("ar_favs") ?? "[]") as string[]).includes(id)); } catch {}
  }, [id]);
  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const list = new Set(JSON.parse(localStorage.getItem("ar_favs") ?? "[]") as string[]);
      if (list.has(id)) list.delete(id); else list.add(id);
      localStorage.setItem("ar_favs", JSON.stringify([...list]));
      setOn(list.has(id));
    } catch { setOn(!on); }
  };
  return (
    <button type="button" onClick={toggle} aria-pressed={on} aria-label={label} className={`grid place-items-center w-8 h-8 rounded-full text-white hover:scale-110 transition ${className}`}>
      <Icon name="heart" size={24} strokeWidth={1.8} fill={on ? "#e8641c" : "rgba(0,0,0,0.12)"} stroke={on ? "#e8641c" : "#fff"} />
    </button>
  );
}

export function SubmitButton({ children, className = "btn btn-primary px-6 py-3 text-[15px]", pendingText }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const status = useFormStatus();
  const ctxPending = useContext(PendingCtx);
  const pending = status.pending || ctxPending;
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingText ?? "…" : children}
    </button>
  );
}

export function ConfirmButton({ children, message, className }: { children: React.ReactNode; message: string; className?: string }) {
  return (
    <button type="submit" className={className} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>
      {children}
    </button>
  );
}

/** <details> that is open on desktop (lg) and collapsed on mobile */
export function ResponsiveDetails({ summary, children }: { summary: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  useEffect(() => { setOpen(window.matchMedia("(min-width: 1024px)").matches); }, []);
  return (
    <details open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)} className="card lg:bg-transparent lg:border-0 lg:shadow-none px-4 py-3 lg:p-0 mb-4 lg:mb-0">
      <summary className="cursor-pointer lg:cursor-default lg:pointer-events-none list-none">{summary}</summary>
      {children}
    </details>
  );
}
