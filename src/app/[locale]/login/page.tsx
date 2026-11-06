import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/config";
import { privateMetadata } from "@/lib/seo";
import { getCurrentUser } from "@/lib/auth";
import { safeNext } from "@/lib/permissions";
import { AuthShell } from "@/components/AuthCard";
import { ActionForm, Input } from "@/components/forms";
import { SubmitButton } from "@/components/client";
import { Icon } from "@/components/Icon";
import { loginAction } from "@/actions/auth";
import { one, type SP } from "@/components/filters";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<SP> };
export async function generateMetadata({ params }: Props) { const { t } = await resolveLocale(params); return privateMetadata(t.auth.loginMetaTitle); }

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale, t } = await resolveLocale(params);
  const next = safeNext(one(await searchParams, "next"), "");
  if (await getCurrentUser()) redirect(next || href(locale, "/account"));
  return (
    <AuthShell title={t.auth.loginTitle} text={t.auth.loginText}>
      <ActionForm action={loginAction} locale={locale} hidden={next ? { next } : undefined}>
        <Input name="email" type="email" label={t.auth.email} autoComplete="email" icon={<Icon name="mail" size={18} />} required />
        <Input name="password" type="password" label={t.auth.password} autoComplete="current-password" icon={<Icon name="lock" size={18} />} required />
        <SubmitButton className="btn btn-primary w-full py-3.5 text-[16px]">{t.auth.submitLogin}</SubmitButton>
      </ActionForm>
      <p className="text-[14px] text-ink-2 mt-5 text-center">{t.auth.noAccount} <Link href={href(locale, "/register", next ? { next } : undefined)} className="link-orange">{t.nav.join}</Link></p>
    </AuthShell>
  );
}
