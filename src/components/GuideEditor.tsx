import type { Locale } from "@/i18n/config";
import { locales } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/tr";
import { ActionForm, Input, Select, Textarea, FieldError } from "./forms";
import { SubmitButton } from "./client";
import { saveGuideAction } from "@/actions/guides";

type G = { id: string; title: string; summary: string; description: string; priceCents: number; locale: string; coverUrl: string; citySlug: string; categorySlug: string; chapters: { title: string; content: string; isPreview: boolean }[] };

export function GuideEditor({ locale, t, guide, cities, cats, defaultCity }: { locale: Locale; t: Dictionary; guide?: G; defaultCity?: string; cities: { slug: string; name: string; imageUrl: string }[]; cats: { slug: string; name: string; imageUrl: string }[] }) {
  const chapters = [...(guide?.chapters ?? []), { title: "", content: "", isPreview: false }, { title: "", content: "", isPreview: false }];
  const covers = [...cities.map((c) => ({ value: c.imageUrl, label: `${t.panel.guideCity}: ${c.name}` })), ...["bali", "lisbon", "berlin", "barcelona"].map((s) => ({ value: `/images/guides/${s}.jpg`, label: `Cover: ${s}` })), ...cats.map((c) => ({ value: c.imageUrl, label: `${t.panel.guideCategory}: ${c.name}` }))];
  return (
    <ActionForm action={saveGuideAction} locale={locale} hidden={guide ? { guideId: guide.id } : undefined} className="space-y-5">
      <Input name="title" label={t.panel.guideTitle} defaultValue={guide?.title} required />
      <Input name="summary" label={t.panel.guideSummary} defaultValue={guide?.summary} required />
      <Textarea name="description" label={t.panel.guideDescription} defaultValue={guide?.description} rows={5} required />
      <div className="grid sm:grid-cols-4 gap-4">
        <Input name="price" type="number" min={1} max={500} step="0.5" label={t.panel.guidePrice} defaultValue={guide ? guide.priceCents / 100 : 19} />
        <Select name="city" label={t.panel.guideCity} defaultValue={guide?.citySlug ?? defaultCity} options={cities.map((c) => ({ value: c.slug, label: c.name }))} />
        <Select name="category" label={t.panel.guideCategory} defaultValue={guide?.categorySlug} options={cats.map((c) => ({ value: c.slug, label: c.name }))} />
        <Select name="guideLocale" label={t.panel.guideLanguage} defaultValue={guide?.locale ?? locale} options={locales.map((l) => ({ value: l, label: t.languages[l] }))} />
      </div>
      <Select name="coverUrl" label="Cover" defaultValue={guide?.coverUrl} options={covers} />
      <fieldset className="space-y-4">
        <legend className="text-[22px] font-display text-teal-900">{t.panel.chapters}</legend>
        <FieldError name="chapters" />
        {chapters.map((c, i) => (
          <div key={i} className="rounded-xl border border-line p-4 bg-cream-2/40 space-y-3">
            <div>
              <label className="label" htmlFor={`ct-${i}`}>{i + 1}. {t.panel.chapterTitle}</label>
              <input id={`ct-${i}`} name="chapterTitle" defaultValue={c.title} className="input" />
            </div>
            <div>
              <label className="label" htmlFor={`cc-${i}`}>{t.panel.chapterContent}</label>
              <textarea id={`cc-${i}`} name="chapterContent" defaultValue={c.content} rows={4} className="input" />
            </div>
            <label className="flex items-center gap-2 text-[13.5px]"><input type="checkbox" name="chapterPreview" value={String(i)} defaultChecked={c.isPreview} className="check" />{t.panel.chapterPreview}</label>
          </div>
        ))}
      </fieldset>
      <SubmitButton>{t.common.save}</SubmitButton>
    </ActionForm>
  );
}
