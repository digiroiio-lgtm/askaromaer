import Link from "next/link";
import Image from "next/image";
import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/config";
import { buildMetadata, breadcrumbLd } from "@/lib/seo";
import { getCategories } from "@/lib/queries";
import { JsonLd } from "@/components/ui";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  return buildMetadata({ locale, path: "/categories", title: t.categories.metaTitle, description: t.categories.metaDescription });
}

export default async function CategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const cats = await getCategories(locale);
  return (
    <div className="container-x py-10">
      <JsonLd data={breadcrumbLd([{ name: t.nav.home, url: href(locale) }, { name: t.categories.title, url: href(locale, "/categories") }])} />
      <h1 className="text-[48px]">{t.categories.title}</h1>
      <p className="text-ink-2 mt-2 text-[17px]">{t.categories.subtitle}</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        {cats.map((c) => (
          <article key={c.id} className="card overflow-hidden">
            <div className="relative h-[150px]"><Image src={c.imageUrl} alt="" fill sizes="33vw" className="object-cover" /></div>
            <div className="p-5">
              <h2 className="text-[26px]">{c.name}</h2>
              <p className="text-ink-2 text-[14px]">{c.description}</p>
              <div className="flex flex-wrap gap-2 mt-4 text-[13px]">
                <Link className="chip hover:bg-brand-50" href={href(locale, "/questions", { category: c.slug })}>{t.nav.questions} ({c.questionCount})</Link>
                <Link className="chip hover:bg-brand-50" href={href(locale, "/roamers", { expertise: c.slug })}>{t.nav.roamers}</Link>
                <Link className="chip hover:bg-brand-50" href={href(locale, "/guides", { category: c.slug })}>{t.nav.guides} ({c.guideCount})</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
