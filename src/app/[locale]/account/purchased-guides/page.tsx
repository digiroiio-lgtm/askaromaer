import Link from "next/link";
import Image from "next/image";
import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/config";
import { privateMetadata } from "@/lib/seo";
import { requireUser } from "@/lib/permissions";
import { db } from "@/lib/db";
import { date } from "@/lib/format";
import { accountNav } from "@/lib/nav";
import { DashShell, SideNav } from "@/components/SideNav";
import { EmptyState } from "@/components/ui";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) { const { t } = await resolveLocale(params); return privateMetadata(t.account.purchased); }

export default async function PurchasedGuidesPage({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const user = await requireUser(locale);
  const purchases = await db.guidePurchase.findMany({ where: { userId: user.id }, include: { guide: { include: { roamer: { include: { user: { select: { name: true } } } } } } }, orderBy: { createdAt: "desc" } });
  return (
    <DashShell nav={<SideNav title={t.account.title} items={accountNav(locale, t)} active="guides" />}>
      <h1 className="text-[36px]">{t.account.purchased}</h1>
      {purchases.length === 0 ? <EmptyState text={t.account.noGuides} cta={t.account.browseGuides} href={href(locale, "/guides")} /> : (
        <ul className="grid sm:grid-cols-2 gap-4">
          {purchases.map((p) => (
            <li key={p.id} className="card overflow-hidden flex">
              <div className="relative w-[110px] flex-none"><Image src={p.guide.coverUrl} alt="" fill sizes="110px" className="object-cover" /></div>
              <div className="p-4 flex flex-col">
                <h2 className="text-[19px] leading-tight">{p.guide.title}</h2>
                <p className="text-[13px] text-ink-2 mt-1">{t.common.by} {p.guide.roamer.user.name} · {date(p.createdAt, locale)}</p>
                <Link href={href(locale, `/guides/${p.guide.slug}/read`)} className="btn btn-primary px-4 py-2 text-[13px] mt-auto self-start">{t.guides.read}</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashShell>
  );
}
