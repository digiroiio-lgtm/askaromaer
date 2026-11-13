import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { fmt } from "@/lib/format";
import { requestGuideAction } from "@/actions/guides";
import { TrackOnMount } from "@/components/Analytics";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/tr";

/** Shown on city pages that have no published guide: collects demand and tells visitors a guide is wanted. */
export async function GuideGap({ locale, t, citySlug, cityName, back, justRequested }: { locale: Locale; t: Dictionary; citySlug: string; cityName: string; back: string; justRequested?: boolean }) {
  const user = await getCurrentUser();
  const mine = user ? await db.guideRequest.findFirst({ where: { userId: user.id, city: { slug: citySlug } }, select: { id: true } }) : null;
  const vars = { city: cityName };
  return (
    <section className="container-x mt-10">
      <div className="card p-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="max-w-[640px]">
          <h2 className="text-[24px] leading-tight">{fmt(t.guides.noneYet, vars)}</h2>
          <p className="text-[15px] text-ink-2 mt-1">{mine ? t.guides.requested : t.guides.noneYetText}</p>
        </div>
        {!mine && (
          <form action={requestGuideAction}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="city" value={citySlug} />
            <input type="hidden" name="back" value={back} />
            <button data-track="guide_request" className="btn btn-primary px-6 py-3">{t.guides.requestCta}</button>
          </form>
        )}
      </div>
      {justRequested && <TrackOnMount name="generate_lead" params={{ lead_type: "guide_request", city: citySlug }} stripParam="requested" />}
    </section>
  );
}
