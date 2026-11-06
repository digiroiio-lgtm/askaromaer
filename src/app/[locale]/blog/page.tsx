import Link from "next/link";
import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/config";
import { privateMetadata } from "@/lib/seo";

// Placeholder kept out of the index and sitemap until real articles exist
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) { const { t } = await resolveLocale(params); return privateMetadata(`${t.blog.title} | AskARoamer`); }

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  return (
    <div className="container-x max-w-[720px] py-20 text-center">
      <h1 className="text-[48px]">{t.blog.title}</h1>
      <p className="text-ink-2 mt-3 text-[17px]">{t.blog.text}</p>
      <div className="flex justify-center gap-3 mt-8"><Link href={href(locale, "/guides")} className="btn btn-primary px-6 py-3">{t.nav.guides}</Link><Link href={href(locale, "/questions")} className="btn btn-outline px-6 py-3">{t.nav.questions}</Link></div>
    </div>
  );
}
