import "server-only";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser, type CurrentUser } from "./auth";
import { href, type Locale } from "@/i18n/config";

/** Pure capability checks — used by pages, actions and tests */
export const can = {
  isAdmin: (u: Pick<CurrentUser, "roles"> | null) => !!u?.roles.includes("ADMIN"),
  isRoamer: (u: Pick<CurrentUser, "roamer"> | null) => !!u?.roamer,
  isApprovedRoamer: (u: Pick<CurrentUser, "roamer"> | null) => u?.roamer?.status === "APPROVED",
  ask: (u: CurrentUser | null) => !!u,
  answer: (u: CurrentUser | null) => !!u,
  book: (u: CurrentUser | null, roamerUserId: string) => !!u && u.id !== roamerUserId,
  buyGuide: (u: CurrentUser | null) => !!u,
  publishServices: (u: Pick<CurrentUser, "roamer"> | null) => u?.roamer?.status === "APPROVED",
};

async function currentPath() {
  return (await headers()).get("x-pathname") ?? "/";
}

/** Require a logged-in user; otherwise redirect to the localized login page with ?next= */
export async function requireUser(locale: Locale): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(href(locale, "/login", { next: await currentPath() }));
  return user;
}

export async function requireRoamer(locale: Locale): Promise<CurrentUser & { roamer: NonNullable<CurrentUser["roamer"]> }> {
  const user = await requireUser(locale);
  if (!user.roamer) redirect(href(locale, "/become-a-roamer"));
  return user as CurrentUser & { roamer: NonNullable<CurrentUser["roamer"]> };
}

export async function requireAdmin(locale: Locale): Promise<CurrentUser> {
  const user = await requireUser(locale);
  if (!can.isAdmin(user)) notFound();
  return user;
}

export { safeNext } from "./pure";
