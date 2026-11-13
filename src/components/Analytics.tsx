"use client";
import { useEffect, useState } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { GA_ID, track } from "@/lib/track";
import type { Dictionary } from "@/i18n/dictionaries/tr";

const KEY = "ar_consent";
type Choice = "granted" | "denied" | null;

function readChoice(): Choice {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}
function saveChoice(v: Exclude<Choice, null>) {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* storage unavailable: choice lasts for this page view only */
  }
}

/** GA4 (Consent Mode v2) + cookie banner. Renders nothing when NEXT_PUBLIC_GA_MEASUREMENT_ID is not set. */
export function Analytics({ t }: { t: Dictionary["consent"] }) {
  const [choice, setChoice] = useState<Choice>(null);
  const [ready, setReady] = useState(false);
  const [reopen, setReopen] = useState(false);
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    setChoice(readChoice());
    setReady(true);
    const open = () => setReopen(true);
    window.addEventListener("ar-consent-open", open);
    return () => window.removeEventListener("ar-consent-open", open);
  }, []);

  // consent state -> gtag
  useEffect(() => {
    if (!GA_ID || !ready || !window.gtag) return;
    window.gtag("consent", "update", { analytics_storage: choice === "granted" ? "granted" : "denied" });
  }, [choice, ready]);

  // page views on route change
  useEffect(() => {
    if (!GA_ID || choice !== "granted") return;
    track("page_view", { page_path: pathname + (search ? `?${search}` : ""), page_location: window.location.href });
  }, [pathname, search, choice]);

  // delegated CTA clicks: <a data-track="name" data-track-page="city">
  useEffect(() => {
    if (!GA_ID) return;
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-track]") as HTMLElement | null;
      if (el) track("cta_click", { cta: el.dataset.track, page_type: el.dataset.trackPage, link_url: el.getAttribute("href") ?? undefined });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (!GA_ID) return null;
  const show = ready && (choice === null || reopen);
  const decide = (v: "granted" | "denied") => {
    saveChoice(v);
    setChoice(v);
    setReopen(false);
  };
  return (
    <>
      <Script id="ga-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        window.gtag = function(){ dataLayer.push(arguments); };
        gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
        gtag('js', new Date());
        gtag('config', '${GA_ID}', { send_page_view: false });
      `}</Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      {show && (
        <div role="dialog" aria-label={t.title} className="fixed bottom-0 inset-x-0 z-[100] bg-white border-t border-line shadow-lg p-4">
          <div className="container-x flex flex-col md:flex-row md:items-center gap-3 justify-between">
            <p className="text-[14px] text-ink-2 max-w-[760px]"><b className="text-ink">{t.title}</b> {t.text}</p>
            <div className="flex gap-2 shrink-0">
              <button type="button" onClick={() => decide("denied")} className="btn px-5 py-2.5 border border-line">{t.reject}</button>
              <button type="button" onClick={() => decide("granted")} className="btn btn-primary px-5 py-2.5">{t.accept}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ConsentLink({ label }: { label: string }) {
  if (!GA_ID) return null;
  return (
    <button type="button" className="hover:text-white underline" onClick={() => window.dispatchEvent(new Event("ar-consent-open"))}>{label}</button>
  );
}

/** Fires an event once on mount and removes a one-shot query param (e.g. ?posted=1) so a refresh does not repeat it. */
export function TrackOnMount({ name, params, stripParam }: { name: string; params?: Record<string, string | number | undefined>; stripParam?: string }) {
  useEffect(() => {
    let tries = 0;
    const fire = () => {
      if (window.gtag) track(name, params);
      else if (tries++ < 20) setTimeout(fire, 250);
    };
    fire();
    if (stripParam) {
      const u = new URL(window.location.href);
      if (u.searchParams.has(stripParam)) {
        u.searchParams.delete(stripParam);
        window.history.replaceState(null, "", u.pathname + (u.search || "") + u.hash);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
