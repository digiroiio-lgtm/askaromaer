import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/config";
import { buildMetadata } from "@/lib/seo";
import { getCurrentUser } from "@/lib/auth";
import { safeNext } from "@/lib/permissions";
import { AuthShell } from "@/components/AuthCard";
import { ActionForm, Input } from "@/components/forms";
import { SubmitButton } from "@/components/client";
import { Icon } from "@/components/Icon";
import { registerAction } from "@/actions/auth";
import { one, type SP } from "@/components/filters";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<SP> };
export async function generateMetadata({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  return buildMetadata({ locale, path: "/register", title: t.auth.registerMetaTitle, description: t.auth.registerText, noindex: true });
}

export default async function RegisterPage({ params, searchParams }: Props) {
  const { locale, t } = await resolveLocale(params);
  const next = safeNext(one(await searchParams, "next"), "");
  if (await getCurrentUser()) redirect(next || href(locale, "/account"));
  return (
    <AuthShell title={t.auth.registerTitle} text={t.auth.registerText}>
      <ActionForm action={registerAction} locale={locale} hidden={next ? { next } : undefined}>
        <Input name="name" label={t.auth.name} autoComplete="name" icon={<Icon name="user" size={18} />} required />
        <Input name="email" type="email" label={t.auth.email} autoComplete="email" icon={<Icon name="mail" size={18} />} required />
        <Input name="password" type="password" label={t.auth.password} hint={t.auth.passwordHint} autoComplete="new-password" minLength={8} icon={<Icon name="lock" size={18} />} required />
        <SubmitButton className="btn btn-primary w-full py-3.5 text-[16px]">{t.auth.submitRegister}</SubmitButton>
        <p className="text-[12px] text-muted text-center">{t.auth.terms}</p>
      </ActionForm>
      <p className="text-[14px] text-ink-2 mt-5 text-center">{t.auth.haveAccount} <Link href={href(locale, "/login", next ? { next } : undefined)} className="link-orange">{t.nav.login}</Link></p>
    </AuthShell>
  );
}
