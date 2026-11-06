import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "../Logo";
import { Icon } from "../Icon";
import { Avatar } from "../ui";
import { NavLinks, LanguageSwitcher, MobileMenu, UserMenu, type NavItem } from "./NavClient";
import { href, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/tr";
import { getCurrentUser } from "@/lib/auth";
import { getCategories } from "@/lib/queries";
import { can } from "@/lib/permissions";
import { logoutAction } from "@/actions/auth";

export async function Header({ locale, t }: { locale: Locale; t: Dictionary }) {
  const [user, cats] = await Promise.all([getCurrentUser(), getCategories(locale)]);
  const items: NavItem[] = [
    { key: "cities", label: t.nav.cities, href: href(locale, "/cities") },
    { key: "questions", label: t.nav.questions, href: href(locale, "/questions") },
    { key: "roamers", label: t.nav.roamers, href: href(locale, "/roamers") },
    { key: "guides", label: t.nav.guides, href: href(locale, "/guides") },
    { key: "blog", label: t.nav.blog, href: href(locale, "/blog") },
  ];
  const userLinks = user
    ? [
        { label: t.nav.account, href: href(locale, "/account") },
        { label: t.account.bookings, href: href(locale, "/account/bookings") },
        { label: t.account.purchased, href: href(locale, "/account/purchased-guides") },
        ...(user.roamer ? [{ label: t.nav.roamerPanel, href: href(locale, "/roamer-dashboard") }] : []),
        ...(can.isAdmin(user) ? [{ label: t.nav.admin, href: href(locale, "/admin") }] : []),
      ]
    : [];
  const logout = (
    <form action={logoutAction}>
      <input type="hidden" name="locale" value={locale} />
      <button className="w-full text-left rounded-lg px-3 py-2 text-[14px] hover:bg-cream-2 text-ink-2">{t.nav.logout}</button>
    </form>
  );
  const authButtons = (
    <>
      <Link href={href(locale, "/login")} className="btn btn-outline bg-white px-5 py-2 text-[14px]">{t.nav.login}</Link>
      <Link href={href(locale, "/register")} className="btn btn-primary px-5 py-2.5 text-[14px]">{t.nav.join}</Link>
    </>
  );
  return (
    <header className="relative z-40">
      <div className="container-x flex items-center gap-6 h-[72px]">
        <Link href={href(locale)} aria-label="AskARoamer — Home" className="shrink-0"><Logo /></Link>
        <nav aria-label="Main" className="flex-1 flex justify-center">
          <Suspense><NavLinks items={items} categories={cats.map((c) => ({ label: c.name, href: href(locale, "/questions", { category: c.slug }) }))} categoriesLabel={t.nav.categories} allLabel={t.nav.allCategories} allHref={href(locale, "/categories")} /></Suspense>
        </nav>
        <div className="hidden lg:flex items-center gap-3">
          <Link href={href(locale, "/questions")} aria-label={t.nav.search} className="grid place-items-center w-9 h-9 text-ink hover:text-brand"><Icon name="search" size={21} /></Link>
          {user ? <UserMenu name={user.name.split(" ")[0]} avatar={<Avatar src={user.avatarUrl} name={user.name} size={30} />} links={userLinks} logout={logout} /> : authButtons}
          <Suspense><LanguageSwitcher locale={locale} label={t.nav.language} /></Suspense>
        </div>
        <div className="lg:hidden flex items-center gap-2 ml-auto">
          <Suspense><LanguageSwitcher locale={locale} label={t.nav.language} /></Suspense>
          <MobileMenu
            label={t.nav.menu}
            items={[...items.slice(0, 1), { key: "categories", label: t.nav.categories, href: href(locale, "/categories") }, ...items.slice(1)]}
            extra={user ? <div className="space-y-1">{userLinks.map((l) => <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2.5 text-[15px] hover:bg-cream-2">{l.label}</Link>)}{logout}</div> : <div className="flex flex-col gap-3">{authButtons}</div>}
          />
        </div>
      </div>
    </header>
  );
}
