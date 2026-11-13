import Link from "next/link";
import { LogoMark } from "../Logo";
import { ConsentLink } from "../Analytics";
import { href, locales, localeLabels, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/tr";

export function Footer({ locale, t }: { locale: Locale; t: Dictionary }) {
  const col = (title: string, links: [string, string][]) => (
    <div>
      <h2 className="font-sans text-[13px] font-bold uppercase tracking-wider text-white/60 mb-3">{title}</h2>
      <ul className="space-y-2">{links.map(([l, h]) => <li key={h}><Link href={h} className="text-[14px] text-white/90 hover:text-white">{l}</Link></li>)}</ul>
    </div>
  );
  return (
    <footer className="bg-teal-950 text-white mt-6">
      <div className="container-x py-12 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <LogoMark size={36} />
            <span className="font-display text-[24px] text-white">AskARoamer</span>
          </div>
          <p className="mt-1 text-[10px] tracking-[0.28em] uppercase text-white/70">Know before you go.</p>
          <p className="mt-4 text-[14px] text-white/80 max-w-[340px] leading-relaxed">{t.footer.about}</p>
        </div>
        {col(t.footer.explore, [[t.nav.cities, href(locale, "/cities")], [t.nav.categories, href(locale, "/categories")], [t.nav.guides, href(locale, "/guides")]])}
        {col(t.footer.community, [[t.nav.questions, href(locale, "/questions")], [t.nav.roamers, href(locale, "/roamers")], [t.become.applyNow, href(locale, "/become-a-roamer")]])}
        <div>
          <h2 className="font-sans text-[13px] font-bold uppercase tracking-wider text-white/60 mb-3">{t.nav.language}</h2>
          <ul className="space-y-2">{locales.map((l) => <li key={l}><a href={href(l)} hrefLang={l} lang={l} className={`text-[14px] hover:text-white ${l === locale ? "text-brand font-semibold" : "text-white/90"}`}>{localeLabels[l]}</a></li>)}</ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x py-5 text-[13px] text-white/60 flex flex-col md:flex-row gap-2 justify-between">
          <span>© {new Date().getFullYear()} AskARoamer. {t.footer.rights}</span>
          <span className="flex gap-4"><ConsentLink label={t.consent.settings} /><span>askaroamer.com</span></span>
        </div>
      </div>
    </footer>
  );
}
