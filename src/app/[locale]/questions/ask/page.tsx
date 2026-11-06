import Link from "next/link";
import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/config";
import { getCurrentUser } from "@/lib/auth";
import { getAllCities, getCategories } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { ActionForm, Input, Select, Textarea } from "@/components/forms";
import { SubmitButton } from "@/components/client";
import { askQuestionAction } from "@/actions/questions";
import { one, type SP } from "@/components/filters";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<SP> };

export async function generateMetadata({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  return buildMetadata({ locale, path: "/questions/ask", title: t.questions.askMetaTitle, description: t.questions.askIntro, noindex: true });
}

export default async function AskPage({ params, searchParams }: Props) {
  const { locale, t } = await resolveLocale(params);
  const sp = await searchParams;
  const [user, cities, cats] = await Promise.all([getCurrentUser(), getAllCities(locale), getCategories(locale)]);
  const self = href(locale, "/questions/ask", { city: one(sp, "city") || undefined, category: one(sp, "category") || undefined, title: one(sp, "title") || undefined });
  return (
    <div className="container-x max-w-[760px] py-10">
      <h1 className="text-[38px] md:text-[46px] leading-tight">{t.questions.askTitle}</h1>
      <p className="text-ink-2 mt-2">{t.questions.askIntro}</p>
      <div className="card p-5 md:p-7 mt-6">
        {user ? (
          <ActionForm action={askQuestionAction} locale={locale} className="space-y-5">
            <Input name="title" label={t.questions.fieldTitle} placeholder={t.questions.fieldTitleHint} defaultValue={one(sp, "title")} required minLength={12} maxLength={160} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Select name="city" label={t.questions.fieldCity} defaultValue={one(sp, "city") || cities[0]?.slug} options={cities.map((c) => ({ value: c.slug, label: c.name }))} />
              <Select name="category" label={t.questions.fieldCategory} defaultValue={one(sp, "category") || cats[0]?.slug} options={cats.map((c) => ({ value: c.slug, label: c.name }))} />
            </div>
            <Textarea name="body" label={t.questions.fieldBody} hint={t.questions.fieldBodyHint} rows={7} required minLength={20} />
            <SubmitButton>{t.questions.publish}</SubmitButton>
          </ActionForm>
        ) : (
          <div className="text-center py-4">
            <p className="text-ink-2">{t.questions.loginToAsk}</p>
            <div className="flex justify-center gap-3 mt-5">
              <Link href={href(locale, "/login", { next: self })} className="btn btn-outline px-6 py-2.5">{t.nav.login}</Link>
              <Link href={href(locale, "/register", { next: self })} className="btn btn-primary px-6 py-2.5">{t.nav.join}</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
