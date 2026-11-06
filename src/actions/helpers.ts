import "server-only";
import { z } from "zod";
import { getDictionary } from "@/i18n";
import { isLocale, type Locale, defaultLocale } from "@/i18n/config";
import { fmt } from "@/lib/format";
import type { FormState } from "./state";

export function formLocale(fd: FormData): Locale {
  const l = String(fd.get("locale") ?? "");
  return isLocale(l) ? l : defaultLocale;
}

/** Map zod issues to localized field errors */
export function zodErrors(err: z.ZodError, locale: Locale): FormState {
  const e = getDictionary(locale).errors;
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    if (fields[key]) continue;
    if (issue.code === "too_small") fields[key] = issue.type === "string" ? (issue.minimum === 1 ? e.required : fmt(e.min, { n: Number(issue.minimum) })) : issue.type === "array" ? e.selectOne : e.number;
    else if (issue.code === "too_big") fields[key] = issue.type === "string" ? fmt(e.max, { n: Number(issue.maximum) }) : e.number;
    else if (issue.code === "invalid_string" && issue.validation === "email") fields[key] = e.email;
    else if (issue.code === "invalid_literal") fields[key] = e.consent;
    else if (issue.code === "invalid_type" && issue.received === "undefined") fields[key] = e.required;
    else fields[key] = e.required;
  }
  return { error: getDictionary(locale).common.genericError, fields };
}

export const str = (min: number, max: number) => z.string().trim().min(min).max(max);
