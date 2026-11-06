import "server-only";
import tr, { type Dictionary } from "./dictionaries/tr";
import en from "./dictionaries/en";
import fr from "./dictionaries/fr";
import { isLocale, type Locale } from "./config";
import { notFound } from "next/navigation";

const dictionaries: Record<Locale, Dictionary> = { tr, en, fr };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Validate the [locale] route param and return locale + dictionary */
export async function resolveLocale(params: Promise<{ locale: string }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { locale, t: dictionaries[locale] };
}

export type { Dictionary };
