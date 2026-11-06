import Link from "next/link";
export function SideNav({ title, items, active }: { title: string; items: { key: string; label: string; href: string }[]; active: string }) {
  return (
    <nav aria-label={title} className="card p-2 lg:sticky lg:top-4">
      <p className="px-3 pt-2 pb-1 font-display text-[20px] text-teal-900">{title}</p>
      <ul className="flex lg:flex-col gap-1 overflow-x-auto scroll-x">
        {items.map((it) => (
          <li key={it.key}><Link href={it.href} aria-current={active === it.key ? "page" : undefined} className={`block whitespace-nowrap rounded-lg px-3 py-2.5 text-[14.5px] ${active === it.key ? "bg-brand-50 text-brand font-semibold" : "hover:bg-cream-2"}`}>{it.label}</Link></li>
        ))}
      </ul>
    </nav>
  );
}
export function DashShell({ nav, children }: { nav: React.ReactNode; children: React.ReactNode }) {
  return <div className="container-x py-8 grid lg:grid-cols-[230px_1fr] gap-6 items-start"><div>{nav}</div><div className="min-w-0 space-y-6">{children}</div></div>;
}
