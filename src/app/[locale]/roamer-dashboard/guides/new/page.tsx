import { resolveLocale } from "@/i18n";
import { privateMetadata } from "@/lib/seo";
import { requireRoamer } from "@/lib/permissions";
import { getAllCities, getCategories } from "@/lib/queries";
import { panelNav } from "@/lib/nav";
import { DashShell, SideNav } from "@/components/SideNav";
import { Notice } from "@/components/ui";
import { GuideEditor } from "@/components/GuideEditor";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ city?: string }> };
export async function generateMetadata({ params }: Props) { const { t } = await resolveLocale(params); return privateMetadata(t.panel.newGuide); }

export default async function NewGuidePage({ params, searchParams }: Props) {
  const { locale, t } = await resolveLocale(params);
  const user = await requireRoamer(locale);
  const [cities, cats] = await Promise.all([getAllCities(locale), getCategories(locale)]);
  return (
    <DashShell nav={<SideNav title={t.panel.title} items={panelNav(locale, t)} active="guides" />}>
      <h1 className="text-[36px]">{t.panel.newGuide}</h1>
      {user.roamer.status !== "APPROVED" ? <Notice kind="warn">{t.panel.onlyApproved}</Notice> : <div className="card p-6"><GuideEditor locale={locale} t={t} cities={cities} cats={cats} defaultCity={(await searchParams).city} /></div>}
    </DashShell>
  );
}
