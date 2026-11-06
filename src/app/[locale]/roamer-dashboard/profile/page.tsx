import { resolveLocale } from "@/i18n";
import { privateMetadata } from "@/lib/seo";
import { requireRoamer } from "@/lib/permissions";
import { db } from "@/lib/db";
import { getAllCities, getCategories } from "@/lib/queries";
import { SPOKEN_LANGUAGES, DURATIONS } from "@/lib/constants";
import { fmt } from "@/lib/format";
import { panelNav } from "@/lib/nav";
import { DashShell, SideNav } from "@/components/SideNav";
import { Notice, StatusPill } from "@/components/ui";
import { ActionForm, CheckGroup, Input, Select, Textarea } from "@/components/forms";
import { SubmitButton } from "@/components/client";
import { submitVerificationAction, updateRoamerProfileAction } from "@/actions/roamer";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) { const { t } = await resolveLocale(params); return privateMetadata(t.panel.profile); }

export default async function PanelProfilePage({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const user = await requireRoamer(locale);
  const [profile, cities, cats] = await Promise.all([
    db.roamerProfile.findUniqueOrThrow({ where: { id: user.roamer.id }, include: { city: true, expertise: true, offers: true, verifications: { orderBy: { createdAt: "desc" } } } }),
    getAllCities(locale), getCategories(locale),
  ]);
  const price = (d: number) => { const o = profile.offers.find((x) => x.durationMin === d && x.active); return o ? String(o.priceCents / 100) : ""; };
  return (
    <DashShell nav={<SideNav title={t.panel.title} items={panelNav(locale, t)} active="profile" />}>
      <h1 className="text-[36px]">{t.panel.profile}</h1>
      <div className="card p-6">
        <ActionForm action={updateRoamerProfileAction} locale={locale} className="space-y-5">
          <Input name="headline" label={t.panel.headline} defaultValue={profile.headline} maxLength={120} required />
          <Textarea name="bio" label={t.panel.bio} defaultValue={profile.bio} rows={6} required />
          <div className="grid sm:grid-cols-2 gap-4">
            <Select name="city" label={t.panel.city} defaultValue={profile.city.slug} options={cities.map((c) => ({ value: c.slug, label: c.name }))} />
            <Input name="years" type="number" min={0} max={80} label={t.panel.years} defaultValue={profile.yearsInCity} />
          </div>
          <CheckGroup name="expertise" label={t.panel.expertise} options={cats.map((c) => ({ value: c.slug, label: c.name }))} defaultValues={profile.expertise.map((e) => e.slug)} columns={3} />
          <CheckGroup name="languages" label={t.panel.languages} options={SPOKEN_LANGUAGES.map((l) => ({ value: l, label: t.languages[l] }))} defaultValues={profile.languages.split(",")} columns={3} />
          <fieldset>
            <legend className="label">{t.panel.offers}</legend>
            <div className="grid grid-cols-3 gap-3">{DURATIONS.map((d) => <Input key={d} name={`price${d}`} label={fmt(t.panel.minutes, { n: d })} inputMode="decimal" defaultValue={price(d)} />)}</div>
            <p className="text-[12.5px] text-muted mt-1">{t.panel.offerHint}</p>
          </fieldset>
          <SubmitButton>{t.common.save}</SubmitButton>
        </ActionForm>
      </div>
      <div className="card p-6">
        <h2 className="text-[24px]">{t.panel.verification}</h2>
        {profile.verified ? <div className="mt-2"><Notice kind="success">{t.panel.verified}</Notice></div> : <p className="text-[14px] text-ink-2 mt-1">{t.panel.verificationText}</p>}
        <ul className="mt-3 space-y-2">{profile.verifications.map((v) => <li key={v.id} className="text-[13.5px] flex gap-2 items-center"><StatusPill status={v.status} label={t.statuses[v.status as keyof typeof t.statuses]} /><span className="text-ink-2">{v.type} — {v.evidence}</span></li>)}</ul>
        {!profile.verified && (
          <ActionForm action={submitVerificationAction} locale={locale} className="mt-4 space-y-3" resetOnSuccess>
            <Input name="evidence" label={t.panel.verification} srLabel required />
            <SubmitButton className="btn btn-outline px-5 py-2.5 text-[14px]">{t.panel.submitVerification}</SubmitButton>
          </ActionForm>
        )}
      </div>
    </DashShell>
  );
}
