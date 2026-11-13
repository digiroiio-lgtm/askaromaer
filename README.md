# AskARoamer — Know before you go.

Multilingual (TR / EN / FR), people-powered knowledge marketplace: community Q&A, 1:1 Roamer consultations and paid digital guides.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router, SSR, Server Actions), React 19, TypeScript |
| Styling | Tailwind CSS v4 + design tokens in `src/app/globals.css` (DM Serif Display + Inter, self-hosted via Fontsource) |
| Database | Prisma 6 — SQLite locally, switch `provider` to `postgresql` for production |
| Auth | Email + password (bcrypt), DB-backed sessions in an httpOnly cookie, server-side permission checks |
| Payments | Provider abstraction (`src/lib/payments.ts`); built-in **test** provider until Stripe keys exist |
| Validation | Zod (server-side, localized error messages) |

## Quick start

```bash
npm install
cp .env.example .env
npx prisma db push
npm run db:seed      # base data + demo content (all demo users are flagged isDemo)
npm run dev          # http://localhost:3000 → redirects to /tr/
```

Production: `npm run build && npm start`. Use `SEED_MODE=base npm run db:seed` for a production database (cities, categories, settings, admin only — no demo users, questions or reviews).

### Demo accounts (local only)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@askaroamer.local` (override with `SEED_ADMIN_EMAIL`) | `Admin12345!` (override with `SEED_ADMIN_PASSWORD`) |
| Approved Roamer | `ayse@demo.askaroamer.local` (also can, selin, mehmet, zeynep, emre) | `Demo12345!` |
| Pending Roamer applicant | `deniz@demo.askaroamer.local` | `Demo12345!` |
| Traveler | `demo@askaroamer.local` | `Demo12345!` |

## Routing & i18n

- Folders under `src/app/[locale]/` use internal English segment names; `src/middleware.ts` rewrites localized slugs (e.g. `/tr/sehirler/` → `cities`) and 301-redirects non-canonical slugs (e.g. `/tr/cities/` → `/tr/sehirler/`).
- Slug table: `src/i18n/config.ts` (`SEGMENTS`). Always build links with `href(locale, "/cities/bali")`.
- UI copy: `src/i18n/dictionaries/{tr,en,fr}.ts` (TR is the master; a unit test enforces identical keys).
- User-generated questions exist in one language: their page lives only under that locale (other locales 308-redirect) and carries no hreflang alternates.

## SEO / GEO

- Per-page metadata, canonical, reciprocal hreflang (`tr-TR`, `en-GB`, `fr-FR`, `x-default`) via `buildMetadata()` (`src/lib/seo.ts`).
- `/sitemap.xml` (index) → `/sitemaps/{tr,en,fr}.xml`; only pages with content are listed. `robots.txt` blocks private areas.
- JSON-LD: Organization, WebSite (+SearchAction), BreadcrumbList, ItemList, Place, ProfilePage/Person, QAPage (only when answers exist), Product/Offer (+AggregateRating only from real reviews), Article, FAQPage.
- **`SITE_INDEXABLE=false` (default) makes every page `noindex`.** Set it to `true` only after demo content is removed.

## Analytics (GA4 + Search Console)
Off by default. Set these env vars to switch it on:
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` (`G-XXXXXXXX`): loads GA4 with Consent Mode v2 (denied until the visitor accepts the cookie banner; the choice is kept in `localStorage`, footer link reopens it). Without it no script and no banner.
- `NEXT_PUBLIC_GSC_VERIFICATION`: token for Search Console "HTML tag" verification (adds `google-site-verification`).

Events (no personal data is sent): `page_view`, `cta_click` (any element with `data-track`; hub CTAs carry `data-track-page`), `generate_lead` (`lead_type` = `question` or `roamer_application`), `begin_checkout`, `purchase` (`item_type` = `booking` or `guide`). In GA4 mark `generate_lead` and `purchase` as key events. After verifying the domain in Search Console, submit `https://<site>/sitemap.xml`.

## Tests

```bash
npm run lint          # TypeScript check
npm test              # unit tests (routing, i18n parity, redirects safety, commission split)
npm run build && npm start &
npm run test:e2e      # 20 end-to-end marketplace flows (needs demo seed)
node tests/shot.mjs /tr/ out.png 1199 full   # screenshot helper for visual comparison
```

## Project map

```
prisma/schema.prisma      data model (users, roles, roamer profiles, cities, Q&A, bookings, guides, payments, reviews, moderation)
prisma/seed.ts            base + demo seed
src/middleware.ts         locale detection, localized slug rewrites
src/actions/*             server actions (auth, questions, roamer, commerce, guides, admin)
src/lib/                  db, auth, permissions, queries, payments, seo, sitemap, format
src/components/           design system (cards, ui, forms, filters, layout)
src/app/[locale]/         pages
public/images/            image assets (cropped from the design references — replace with originals)
```
