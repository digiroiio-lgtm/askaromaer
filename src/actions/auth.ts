"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { safeNext } from "@/lib/permissions";
import { getDictionary } from "@/i18n";
import { href } from "@/i18n/config";
import { formLocale, zodErrors, str } from "./helpers";
import type { FormState } from "./state";

const registerSchema = z.object({
  name: str(2, 80),
  email: z.string().trim().toLowerCase().email().max(160),
  password: z.string().min(8).max(200),
});

export async function registerAction(_: FormState, fd: FormData): Promise<FormState> {
  const locale = formLocale(fd);
  const t = getDictionary(locale);
  const parsed = registerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodErrors(parsed.error, locale);
  const { name, email, password } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) return { error: t.auth.emailTaken, fields: { email: t.auth.emailTaken } };
  const user = await db.user.create({
    data: { name, email, passwordHash: await hashPassword(password), locale, roles: { create: [{ role: "TRAVELER" }] } },
  });
  await createSession(user.id);
  redirect(safeNext(String(fd.get("next") ?? ""), href(locale, "/account")));
}

const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const locale = formLocale(fd);
  const t = getDictionary(locale);
  const parsed = loginSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodErrors(parsed.error, locale);
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  // constant-ish time: always run a bcrypt compare
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? "$2a$11$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
  if (!user || !ok) return { error: t.auth.invalid };
  if (user.suspended) return { error: t.auth.suspended };
  await createSession(user.id);
  redirect(safeNext(String(fd.get("next") ?? ""), href(locale, "/account")));
}

export async function logoutAction(fd: FormData) {
  const locale = formLocale(fd);
  await destroySession();
  redirect(href(locale));
}
