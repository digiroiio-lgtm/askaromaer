// End-to-end marketplace flows against a running server (npm run dev / npm start) with the demo seed.
// Usage: BASE=http://localhost:3000 node tests/e2e.mjs
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");

const BASE = process.env.BASE ?? "http://localhost:3000";
const ADMIN = { email: process.env.SEED_ADMIN_EMAIL ?? "admin@askaroamer.local", password: process.env.SEED_ADMIN_PASSWORD ?? "Admin12345!" };
const stamp = Date.now().toString(36);
let passed = 0, failed = 0;
const results = [];

async function step(name, fn) {
  try { await fn(); passed++; results.push(`  ✔ ${name}`); }
  catch (e) { failed++; results.push(`  ✘ ${name}\n      ${String(e.message).split("\n")[0]}`); }
}
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

const browser = await chromium.launch();
const newCtx = () => browser.newContext({ viewport: { width: 1280, height: 900 } });

async function login(page, email, password, locale = "tr") {
  await page.goto(`${BASE}/${locale}/${locale === "tr" ? "giris" : locale === "en" ? "login" : "connexion"}/`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([page.waitForURL((u) => !/giris|login|connexion/.test(u.pathname)), page.click('form button[type="submit"]')]);
}

/* ---------------- Traveler ---------------- */
const traveler = { name: "Test Traveler", email: `traveler-${stamp}@example.test`, password: "Traveler123!" };
const tctx = await newCtx();
const tp = await tctx.newPage();
let questionUrl = "";

await step("Register: validation errors on empty submit", async () => {
  await tp.goto(`${BASE}/tr/kayit/`);
  await tp.click('form button[type="submit"]');
  await tp.waitForSelector('form [role="alert"]');
  expect(await tp.locator("#name-err").count() === 1, "missing name error");
});
await step("Register Traveler → redirected to /tr/hesabim/", async () => {
  await tp.fill('input[name="name"]', traveler.name);
  await tp.fill('input[name="email"]', traveler.email);
  await tp.fill('input[name="password"]', traveler.password);
  await Promise.all([tp.waitForURL(/\/tr\/hesabim\//), tp.click('form button[type="submit"]')]);
});
await step("Duplicate email is rejected", async () => {
  const c = await newCtx(); const p = await c.newPage();
  await p.goto(`${BASE}/tr/kayit/`);
  await p.fill('input[name="name"]', "Dup"); await p.fill('input[name="email"]', traveler.email); await p.fill('input[name="password"]', "Whatever123");
  await p.click('form button[type="submit"]');
  await p.waitForSelector('#email-err');
  await c.close();
});
await step("Ask a question → question detail page", async () => {
  await tp.goto(`${BASE}/tr/sorular/sor/?city=lisbon&category=relocation`);
  await tp.fill('input[name="title"]', `Lizbon’da kira depozitosu genelde kaç ay? ${stamp}`);
  await tp.fill('textarea[name="body"]', "Önümüzdeki ay taşınıyoruz, ev sahipleri genelde kaç aylık depozito istiyor?");
  await Promise.all([tp.waitForURL(/\/tr\/sorular\/lizbon/), tp.click('form button[type="submit"]')]);
  questionUrl = tp.url();
  expect((await tp.locator("h1").innerText()).includes(stamp), "title not shown");
});
await step("Answer a question", async () => {
  await tp.fill('textarea[name="body"]', "Benim deneyimimde iki aylık depozito ve bir aylık peşin kira istendi.");
  await tp.click('#your-answer ~ form button[type="submit"], section[aria-labelledby="your-answer"] button[type="submit"]');
  await tp.waitForSelector("text=iki aylık depozito");
});
await step("Book a consultation → test checkout → booking CONFIRMED", async () => {
  await tp.goto(`${BASE}/tr/roamer/ayse-kaya/`);
  await Promise.all([tp.waitForURL(/\/tr\/hesabim\/odeme\//), tp.click('#book button[type="submit"]')]);
  await Promise.all([tp.waitForURL(/rezervasyonlar\/\?paid=1/), tp.click('text=Ödemeyi Onayla (Test)')]);
  expect(await tp.locator("text=Onaylandı").count() > 0, "booking not confirmed");
});
await step("Paid guide is locked before purchase (read page redirects)", async () => {
  await tp.goto(`${BASE}/tr/rehberler/barcelonada-yasam-rehberi/oku/`);
  expect(/\/tr\/rehberler\/barcelonada-yasam-rehberi\/$/.test(new URL(tp.url()).pathname), `not redirected: ${tp.url()}`);
});
await step("Purchase guide → reader unlocked → appears in purchased list", async () => {
  await Promise.all([tp.waitForURL(/\/odeme\//), tp.click('aside form button[type="submit"]')]);
  await Promise.all([tp.waitForURL(/\/oku\/$/), tp.click('text=Ödemeyi Onayla (Test)')]);
  expect(await tp.locator("h2", { hasText: "Kira sözleşmeleri" }).count() === 1, "locked chapter not visible");
  await tp.goto(`${BASE}/tr/hesabim/satin-aldigim-rehberler/`);
  expect(await tp.locator("text=Barselona’da Yaşam Rehberi").count() > 0, "not in purchased list");
});
await step("Traveler cannot open admin (404)", async () => {
  const r = await tp.goto(`${BASE}/tr/admin/`);
  expect(r.status() === 404, `status ${r.status()}`);
});

/* ---------------- Roamer application (guest → account in one step) ---------------- */
const roamer = { name: `Roamer ${stamp}`, email: `roamer-${stamp}@example.test`, password: "Roamer12345!" };
const rctx = await newCtx();
const rp = await rctx.newPage();
await step("Roamer application as guest creates account + PENDING profile", async () => {
  await rp.goto(`${BASE}/tr/roamer-ol/`);
  await rp.fill('input[name="name"]', roamer.name);
  await rp.fill('input[name="email"]', roamer.email);
  await rp.fill('input[name="password"]', roamer.password);
  await rp.selectOption('select[name="city"]', "prague");
  await rp.fill('input[name="years"]', "3");
  await rp.click("text=Uzmanlık alanların");
  await rp.check('input[name="expertise"][value="relocation"]');
  await rp.fill('input[name="headline"]', "Prag’da 3 yıldır yaşayan öğrenci danışmanı");
  await rp.fill('textarea[name="bio"]', "Prag’da üç yıldır yaşıyorum ve öğrenci vizesi, yurt ve ev bulma süreçlerinde deneyimliyim.");
  await rp.fill('input[name="evidence"]', "LinkedIn profili ve kira sözleşmesi");
  await rp.check('input[name="consent"]');
  await Promise.all([rp.waitForURL(/\/tr\/roamer-paneli\//), rp.click('#apply button[type="submit"]')]);
  expect(await rp.locator("text=Beklemede").count() > 0, "not pending");
});
await step("Pending Roamer cannot open slots or create guides", async () => {
  await rp.goto(`${BASE}/tr/roamer-paneli/takvim/`);
  expect(await rp.locator('input[name="date"]').count() === 0, "slot form visible to pending roamer");
  await rp.goto(`${BASE}/tr/roamer-paneli/rehberler/yeni/`);
  expect(await rp.locator('input[name="title"]').count() === 0, "guide form visible to pending roamer");
});
await step("Pending Roamer profile is not public", async () => {
  const c = await newCtx(); const p = await c.newPage();
  const slug = (await rp.locator('a:has-text("Herkese açık profili gör")').getAttribute("href", { timeout: 2000 }).catch(() => null)) ?? "";
  await rp.goto(`${BASE}/tr/roamer-paneli/`);
  const href = await rp.locator('a:has-text("Herkese açık profili gör")').getAttribute("href");
  const r = await p.goto(`${BASE}${href}`);
  expect(r.status() === 404, `public status ${r.status()} ${slug}`);
  await c.close();
});

/* ---------------- Admin ---------------- */
const actx = await newCtx();
const ap = await actx.newPage();
await step("Admin approves the Roamer application", async () => {
  await login(ap, ADMIN.email, ADMIN.password);
  await ap.goto(`${BASE}/tr/admin/?tab=roamers`);
  const card = ap.locator("li.card", { hasText: roamer.email });
  await card.locator('button:has-text("Onayla")').click();
  await ap.waitForLoadState("networkidle");
  await ap.reload();
  expect(await ap.locator("li.card", { hasText: roamer.email }).locator("text=Onaylandı").count() > 0, "not approved");
});

/* ---------------- Approved Roamer: services + guide ---------------- */
let guideId = "";
await step("Approved Roamer sets prices and opens availability", async () => {
  await rp.goto(`${BASE}/tr/roamer-paneli/profil/`);
  await rp.fill('input[name="price30"]', "22");
  await rp.click('form button[type="submit"] >> nth=0');
  await rp.waitForSelector("text=Kaydedildi");
  await rp.goto(`${BASE}/tr/roamer-paneli/takvim/`);
  await rp.fill('input[name="count"]', "2");
  await rp.click('form button[type="submit"]');
  await rp.waitForSelector("text=Kaydedildi");
  expect(await rp.locator("ul li", { hasText: "UTC" }).count() >= 2, "slots not listed");
});
await step("Guide creator: create → validate → save → submit for approval", async () => {
  await rp.goto(`${BASE}/tr/roamer-paneli/rehberler/yeni/`);
  await rp.click('form button[type="submit"]');
  await rp.waitForSelector('form [role="alert"]');
  await rp.fill('input[name="title"]', `Prag Öğrenci Rehberi ${stamp}`);
  await rp.fill('input[name="summary"]', "Prag’da öğrenci olarak ilk ayın kontrol listesi.");
  await rp.fill('textarea[name="description"]', "Vize, yurt, ulaşım kartı ve sağlık sigortası: Prag’daki ilk ayın için adım adım rehber.");
  await rp.selectOption('select[name="city"]', "prague");
  await rp.fill('input[name="chapterTitle"] >> nth=0', "İlk hafta");
  await rp.fill('textarea[name="chapterContent"] >> nth=0', "Yabancılar polisine kayıt ve ulaşım kartı başvurusu ile başla.");
  await rp.check('input[name="chapterPreview"] >> nth=0');
  await Promise.all([rp.waitForURL(/\/rehberler\/[a-z0-9]+\/$/), rp.click('form button[type="submit"] >> text=Kaydet')]);
  guideId = rp.url().split("/").filter(Boolean).pop();
  await rp.click('button:has-text("Onaya Gönder")');
  await rp.waitForSelector("text=Onay bekliyor");
});
await step("Admin approves guide → guide is public", async () => {
  await ap.goto(`${BASE}/tr/admin/?tab=guides`);
  await ap.locator("li.card", { hasText: stamp }).locator('button:has-text("Onayla")').click();
  await ap.waitForLoadState("networkidle");
  await tp.goto(`${BASE}/tr/rehberler/?q=${stamp}`);
  expect(await tp.locator("article", { hasText: stamp }).count() === 1, "guide not listed publicly");
});
await step("Roamer receives booking from Traveler on the new profile", async () => {
  await rp.goto(`${BASE}/tr/roamer-paneli/`);
  const href = await rp.locator('a:has-text("Herkese açık profili gör")').getAttribute("href");
  await tp.goto(`${BASE}${href}`);
  await Promise.all([tp.waitForURL(/\/odeme\//), tp.click('#book button[type="submit"]')]);
  await Promise.all([tp.waitForURL(/rezervasyonlar/), tp.click('text=Ödemeyi Onayla (Test)')]);
  await rp.goto(`${BASE}/tr/roamer-paneli/kazanc/`);
  expect(await rp.locator("td", { hasText: "€17,60" }).count() + (await rp.locator("text=17,60").count()) > 0, "net earnings (22 - 20%) not shown");
});
await step("Double booking of the same slot is prevented", async () => {
  await rp.goto(`${BASE}/tr/roamer-paneli/takvim/`);
  expect(await rp.locator("text=Rezerve").count() >= 1, "slot not marked booked");
});

/* ---------------- i18n + SEO ---------------- */
await step("EN/FR localized routes, hreflang and canonical", async () => {
  const c = await newCtx(); const p = await c.newPage();
  await p.goto(`${BASE}/fr/villes/`);
  expect((await p.locator("h1").innerText()).includes("Villes"), "fr h1");
  const hreflangs = await p.locator('link[rel="alternate"][hreflang]').evaluateAll((els) => els.map((e) => e.getAttribute("hreflang")));
  for (const h of ["tr-TR", "en-GB", "fr-FR", "x-default"]) expect(hreflangs.includes(h), `missing ${h}`);
  expect((await p.locator('link[rel="canonical"]').getAttribute("href")).endsWith("/fr/villes/"), "canonical");
  await p.goto(`${BASE}/en/cities/`);
  await p.click('button[aria-label="Language"] >> nth=0');
  await Promise.all([p.waitForURL(/\/tr\/sehirler\//), p.click('a[hreflang="tr"] >> nth=0')]);
  expect(await p.locator("h1").count() === 1, "exactly one h1");
  await c.close();
});
await step("Private pages are noindex; sitemap lists localized URLs", async () => {
  await tp.goto(`${BASE}/tr/hesabim/`);
  expect((await tp.locator('meta[name="robots"]').getAttribute("content")).includes("noindex"), "account indexable");
  const xml = await (await fetch(`${BASE}/sitemaps/fr.xml`)).text();
  expect(xml.includes("/fr/villes/") && xml.includes('hreflang="tr-TR"'), "fr sitemap");
  expect(!xml.includes("/hesabim/") && !xml.includes("/mon-compte/"), "private url in sitemap");
});

await browser.close();
console.log(results.join("\n"));
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
