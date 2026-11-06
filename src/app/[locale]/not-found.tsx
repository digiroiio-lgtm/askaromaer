import Link from "next/link";
import { headers } from "next/headers";
import { getDictionary } from "@/i18n";
import { href, isLocale, defaultLocale } from "@/i18n/config";

export default async function NotFound() {
  const h = await headers();
  const l = h.get("x-locale");
  const locale = isLocale(l) ? l : defaultLocale;
  const t = getDictionary(locale);
  return (
    <div className="container-x py-24 text-center">
      <p className="text-brand font-bold text-[14px] tracking-widest">404</p>
      <h1 className="text-[44px] mt-2">{t.errors.notFoundTitle}</h1>
      <p className="mt-3 text-ink-2">{t.errors.notFoundText}</p>
      <Link href={href(locale)} className="btn btn-primary px-6 py-3 mt-8">{t.errors.goHome}</Link>
    </div>
  );
}
