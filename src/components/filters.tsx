import { ResponsiveDetails } from "./client";
import Link from "next/link";

export type SP = Record<string, string | string[] | undefined>;
export const arr = (sp: SP, k: string) => { const v = sp[k]; return (Array.isArray(v) ? v : v ? [v] : []).filter(Boolean) as string[]; };
export const one = (sp: SP, k: string) => { const v = sp[k]; return (Array.isArray(v) ? v[0] : v) ?? ""; };
export const pageNum = (sp: SP) => Math.max(1, Number.parseInt(one(sp, "page") || "1", 10) || 1);

export function FilterGroup({ title, name, options, selected, limit = 5, moreLabel }: { title: string; name: string; options: { value: string; label: string; count?: number }[]; selected: string[]; limit?: number; moreLabel?: string }) {
  const item = (o: { value: string; label: string; count?: number }) => (
    <label key={o.value} className="flex items-center gap-2.5 text-[14px] text-ink cursor-pointer py-1">
      <input type="checkbox" name={name} value={o.value} defaultChecked={selected.includes(o.value)} className="check" />
      <span>{o.label}{o.count !== undefined && <span className="text-ink-2"> ({o.count})</span>}</span>
    </label>
  );
  const head = options.slice(0, limit);
  const tail = options.slice(limit);
  const open = tail.some((o) => selected.includes(o.value));
  return (
    <fieldset className="py-4 border-b border-line">
      <legend className="font-display text-[19px] text-teal-900 mb-2">{title}</legend>
      <div className="space-y-0.5">{head.map(item)}</div>
      {tail.length > 0 && (
        <details open={open} className="group">
          <summary className="link-orange text-[13px] mt-2 cursor-pointer list-none">{moreLabel} <span className="group-open:rotate-180 transition">▾</span></summary>
          <div className="space-y-0.5 mt-1">{tail.map(item)}</div>
        </details>
      )}
    </fieldset>
  );
}

export function FilterAside({ title, clearHref, clearLabel, children }: { title: string; clearHref: string; clearLabel: string; children: React.ReactNode }) {
  return (
    <aside className="lg:pr-6 lg:border-r lg:border-line">
      <ResponsiveDetails summary={<h2 className="text-[22px] lg:text-[24px] pb-3 lg:border-b border-line inline lg:block">{title}</h2>}>
        {children}
        <Link href={clearHref} className="btn w-full py-3 mt-6 text-[14px] border border-[#d9cfc2] text-ink bg-white hover:bg-cream-2">↻ {clearLabel}</Link>
      </ResponsiveDetails>
    </aside>
  );
}
