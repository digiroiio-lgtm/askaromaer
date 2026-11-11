import Link from "next/link";
import { fmt } from "@/lib/format";
import { href, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/tr";

/** Shown when at least half of the listed questions are written in another language than the visitor's. */
export function LanguageNote({ locale, t, items, city, category, className = "container-x mt-6" }: { locale: Locale; t: Dictionary; items: { locale: string }[]; city?: string; category?: string; className?: string }) {
  if (!items.length || items.filter((q) => q.locale !== locale).length * 2 < items.length) return null;
  const language = t.languages[locale];
  return (
    <div className={className}>
      <div className="card px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between bg-brand-50">
        <p className="text-[14.5px] text-ink-2">{fmt(t.common.langNote, { language })}</p>
        <Link href={href(locale, "/questions/ask", { city, category })} data-track="lang_ask" data-track-page="language_note" className="btn btn-primary px-5 py-2.5 text-[14px] shrink-0">{fmt(t.common.langNoteCta, { language })}</Link>
      </div>
    </div>
  );
}
