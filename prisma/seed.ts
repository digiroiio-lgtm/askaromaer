/**
 * Demo seed for local development and design review.
 * Every seeded user is flagged isDemo=true. Do NOT ship demo users, questions or reviews to production:
 * run `DELETE` on isDemo users (cascade) or start production from an empty database + `SEED_MODE=base`.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const BASE_ONLY = process.env.SEED_MODE === "base";

type L = "tr" | "en" | "fr";
type Tr<T> = Record<L, T>;

const categories: { slug: string; image: string; tr: Tr<[string, string]> }[] = [
  { slug: "nomad-life", image: "/images/categories/nomad-life.jpg", tr: { tr: ["Nomad Life", "Dijital göçebe yaşamı"], en: ["Nomad Life", "Digital nomad living"], fr: ["Vie nomade", "Vivre en nomade digital"] } },
  { slug: "relocation", image: "/images/categories/relocation.jpg", tr: { tr: ["Relocation", "Taşınma, vize ve oturum"], en: ["Relocation", "Moving, visas and residency"], fr: ["Expatriation", "Déménagement, visas et résidence"] } },
  { slug: "travel", image: "/images/categories/travel.jpg", tr: { tr: ["Travel", "Seyahat planlama ve ipuçları"], en: ["Travel", "Trip planning and tips"], fr: ["Voyage", "Préparer son voyage, astuces"] } },
  { slug: "work-business", image: "/images/categories/work-business.jpg", tr: { tr: ["Work & Business", "Uzaktan çalışma, freelance, startup"], en: ["Work & Business", "Remote work, freelancing, startups"], fr: ["Travail & business", "Télétravail, freelance, startup"] } },
  { slug: "cost-of-living", image: "/images/categories/cost-of-living.jpg", tr: { tr: ["Cost of Living", "Yaşam maliyeti, kira, aylık bütçe"], en: ["Cost of Living", "Living costs, rent, monthly budget"], fr: ["Coût de la vie", "Loyer, dépenses, budget mensuel"] } },
];

type CitySeed = { slug: string; region: string; tz: string; featured?: boolean; tr: Tr<{ name: string; country: string; loc: string; intro: string }> };
const cities: CitySeed[] = [
  { slug: "bali", region: "asia", tz: "Asia/Makassar", featured: true, tr: {
    tr: { name: "Bali", country: "Endonezya", loc: "Bali’de", intro: "Canggu’nun kafeleri, Ubud’un pirinç terasları ve geniş nomad topluluğuyla Bali, uzaktan çalışanların en çok sorduğu adalardan biri. Kira, vize ve günlük yaşam hakkında adada yaşayanlardan güncel bilgi al." },
    en: { name: "Bali", country: "Indonesia", loc: "Bali", intro: "With Canggu’s cafés, Ubud’s rice terraces and a huge nomad community, Bali is one of the most asked-about islands for remote workers. Get current advice on rent, visas and daily life from people living there." },
    fr: { name: "Bali", country: "Indonésie", loc: "Bali", intro: "Entre les cafés de Canggu, les rizières d’Ubud et une grande communauté de nomades, Bali fait partie des îles les plus demandées par les télétravailleurs. Loyer, visas, quotidien : demandez à ceux qui y vivent." } } },
  { slug: "lisbon", region: "europe", tz: "Europe/Lisbon", featured: true, tr: {
    tr: { name: "Lizbon", country: "Portekiz", loc: "Lizbon’da", intro: "Ilıman iklimi, tepeleri ve büyüyen teknoloji sahnesiyle Lizbon, Avrupa’da taşınma planı yapanların gözdesi. Oturum izni, mahalle seçimi ve kira piyasası hakkında orada yaşayanlara danış." },
    en: { name: "Lisbon", country: "Portugal", loc: "Lisbon", intro: "Mild weather, steep hills and a growing tech scene make Lisbon a favourite for people planning a move within Europe. Ask locals about residence permits, neighbourhoods and the rental market." },
    fr: { name: "Lisbonne", country: "Portugal", loc: "Lisbonne", intro: "Climat doux, collines et scène tech en plein essor : Lisbonne attire ceux qui veulent s’installer en Europe. Titre de séjour, quartiers, marché locatif : posez vos questions aux habitants." } } },
  { slug: "berlin", region: "europe", tz: "Europe/Berlin", featured: true, tr: {
    tr: { name: "Berlin", country: "Almanya", loc: "Berlin’de", intro: "Freelance vizesi, startup ekosistemi ve kültürel çeşitliliğiyle Berlin, Avrupa’da çalışmak isteyenler için güçlü bir seçenek. Anmeldung’dan vergi numarasına kadar adımları yaşayanlardan öğren." },
    en: { name: "Berlin", country: "Germany", loc: "Berlin", intro: "Freelance visas, a startup ecosystem and cultural diversity make Berlin a strong choice for working in Europe. Learn the steps from Anmeldung to tax ID from people who have done it." },
    fr: { name: "Berlin", country: "Allemagne", loc: "Berlin", intro: "Visa freelance, écosystème startup et diversité culturelle : Berlin est un excellent choix pour travailler en Europe. De l’Anmeldung au numéro fiscal, apprenez les étapes auprès de ceux qui les ont vécues." } } },
  { slug: "barcelona", region: "europe", tz: "Europe/Madrid", featured: true, tr: {
    tr: { name: "Barselona", country: "İspanya", loc: "Barselona’da", intro: "Deniz, mimari ve canlı mahalle yaşamı… Barselona’da semt seçimi, NIE süreci ve dijital nomad vizesi hakkında şehri iyi bilen Roamerlardan pratik bilgi al." },
    en: { name: "Barcelona", country: "Spain", loc: "Barcelona", intro: "Sea, architecture and lively neighbourhood life. Get practical advice on choosing a barrio, the NIE process and Spain’s digital nomad visa from Roamers who know the city well." },
    fr: { name: "Barcelone", country: "Espagne", loc: "Barcelone", intro: "La mer, l’architecture et la vie de quartier. Choix du barrio, démarches NIE, visa nomade digital : obtenez des conseils concrets de Roamers qui connaissent bien la ville." } } },
  { slug: "bangkok", region: "asia", tz: "Asia/Bangkok", featured: true, tr: {
    tr: { name: "Bangkok", country: "Tayland", loc: "Bangkok’ta", intro: "Uygun yaşam maliyeti, sokak lezzetleri ve güçlü ulaşım ağıyla Bangkok, uzun süreli kalmak isteyenlerin listesinde üst sıralarda. Kondo kiralama ve vize seçeneklerini yaşayanlardan dinle." },
    en: { name: "Bangkok", country: "Thailand", loc: "Bangkok", intro: "Affordable living, street food and excellent transit put Bangkok high on long-stay lists. Hear from residents about renting a condo and visa options." },
    fr: { name: "Bangkok", country: "Thaïlande", loc: "Bangkok", intro: "Coût de la vie abordable, cuisine de rue et transports efficaces : Bangkok est en tête des séjours longue durée. Location de condo, options de visa : écoutez ceux qui y vivent." } } },
  { slug: "tokyo", region: "asia", tz: "Asia/Tokyo", tr: {
    tr: { name: "Tokyo", country: "Japonya", loc: "Tokyo’da", intro: "Düzeni, güvenliği ve sonsuz mahalleleriyle Tokyo’da ev bulmak, iş vizesi ve günlük yaşamın incelikleri hakkında şehirde yaşayan Roamerlara sor." },
    en: { name: "Tokyo", country: "Japan", loc: "Tokyo", intro: "Orderly, safe and endlessly varied. Ask Roamers in Tokyo about finding a flat, work visas and the details of daily life." },
    fr: { name: "Tokyo", country: "Japon", loc: "Tokyo", intro: "Ordonnée, sûre et infiniment variée. Logement, visa de travail, subtilités du quotidien : interrogez les Roamers qui vivent à Tokyo." } } },
  { slug: "chiang-mai", region: "asia", tz: "Asia/Bangkok", tr: {
    tr: { name: "Chiang Mai", country: "Tayland", loc: "Chiang Mai’de", intro: "Sakin tempo, dağ manzarası ve düşük maliyetli yaşamıyla Chiang Mai, nomad topluluğunun klasik duraklarından biri." },
    en: { name: "Chiang Mai", country: "Thailand", loc: "Chiang Mai", intro: "A slower pace, mountain views and low living costs make Chiang Mai a classic stop for the nomad community." },
    fr: { name: "Chiang Mai", country: "Thaïlande", loc: "Chiang Mai", intro: "Rythme paisible, montagnes et coût de la vie modéré : Chiang Mai est une étape classique des nomades digitaux." } } },
  { slug: "mexico-city", region: "north-america", tz: "America/Mexico_City", tr: {
    tr: { name: "Mexico City", country: "Meksika", loc: "Mexico City’de", intro: "Roma ve Condesa’nın yeşil sokakları, güçlü mutfak kültürü ve canlı sanat sahnesiyle Mexico City, uzaktan çalışanların yükselen adresi." },
    en: { name: "Mexico City", country: "Mexico", loc: "Mexico City", intro: "Leafy streets in Roma and Condesa, a world-class food culture and a lively art scene make Mexico City a rising base for remote workers." },
    fr: { name: "Mexico", country: "Mexique", loc: "Mexico", intro: "Rues arborées de Roma et Condesa, gastronomie renommée et scène artistique vivante : Mexico séduit de plus en plus de télétravailleurs." } } },
  { slug: "miami", region: "north-america", tz: "America/New_York", tr: {
    tr: { name: "Miami", country: "ABD", loc: "Miami’de", intro: "Plajları, Latin kültürü ve büyüyen iş dünyasıyla Miami’de yaşam, kira ve çalışma koşulları hakkında yerel deneyimlere ulaş." },
    en: { name: "Miami", country: "USA", loc: "Miami", intro: "Beaches, Latin culture and a growing business scene. Find first-hand experience of living, renting and working in Miami." },
    fr: { name: "Miami", country: "États-Unis", loc: "Miami", intro: "Plages, culture latine et monde des affaires en pleine croissance : retours d’expérience sur la vie, le logement et le travail à Miami." } } },
  { slug: "prague", region: "europe", tz: "Europe/Prague", tr: {
    tr: { name: "Prag", country: "Çekya", loc: "Prag’da", intro: "Tarihi merkezi, Avrupa’nın ortasındaki konumu ve makul maliyetleriyle Prag; öğrenciler, freelancer’lar ve aileler için dengeli bir seçenek." },
    en: { name: "Prague", country: "Czechia", loc: "Prague", intro: "A historic centre, a location at the heart of Europe and reasonable costs make Prague a balanced choice for students, freelancers and families." },
    fr: { name: "Prague", country: "Tchéquie", loc: "Prague", intro: "Centre historique, position au cœur de l’Europe et coûts raisonnables : Prague est un choix équilibré pour étudiants, freelances et familles." } } },
];

async function main() {
  console.log("Seeding base data (cities, categories, settings)…");
  for (const [i, c] of categories.entries()) {
    const cat = await db.category.upsert({ where: { slug: c.slug }, update: { imageUrl: c.image, sortOrder: i }, create: { slug: c.slug, imageUrl: c.image, sortOrder: i } });
    for (const l of ["tr", "en", "fr"] as L[]) {
      const [name, description] = c.tr[l];
      await db.categoryTranslation.upsert({ where: { categoryId_locale: { categoryId: cat.id, locale: l } }, update: { name, description }, create: { categoryId: cat.id, locale: l, name, description } });
    }
  }
  for (const [i, c] of cities.entries()) {
    const city = await db.city.upsert({
      where: { slug: c.slug },
      update: { region: c.region, imageUrl: `/images/cities/${c.slug}.jpg`, featured: !!c.featured, sortOrder: i, timezone: c.tz },
      create: { slug: c.slug, region: c.region, imageUrl: `/images/cities/${c.slug}.jpg`, featured: !!c.featured, sortOrder: i, timezone: c.tz },
    });
    for (const l of ["tr", "en", "fr"] as L[]) {
      const t = c.tr[l];
      await db.cityTranslation.upsert({
        where: { cityId_locale: { cityId: city.id, locale: l } },
        update: { name: t.name, country: t.country, locative: t.loc, intro: t.intro },
        create: { cityId: city.id, locale: l, name: t.name, country: t.country, locative: t.loc, intro: t.intro },
      });
    }
  }
  await db.platformSetting.upsert({ where: { key: "platformFeePercent" }, update: {}, create: { key: "platformFeePercent", value: process.env.PLATFORM_FEE_PERCENT ?? "20" } });

  // Admin account (password from env; never hardcode a production password)
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@askaroamer.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin12345!";
  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, name: "AskARoamer Admin", passwordHash: await bcrypt.hash(adminPassword, 11), isDemo: !process.env.SEED_ADMIN_PASSWORD },
  });
  for (const role of ["TRAVELER", "ADMIN"]) await db.userRole.upsert({ where: { userId_role: { userId: admin.id, role } }, update: {}, create: { userId: admin.id, role } });

  if (BASE_ONLY) return console.log("Base seed done.");
  await seedDemo();
}

/* ------------------------------------------------------------------ */
/*                               DEMO                                 */
/* ------------------------------------------------------------------ */

const DEMO_PW = "Demo12345!";
const daysAgo = (n: number) => new Date(Date.now() - n * 86400_000);

async function user(email: string, name: string, avatar: string | null, roles: string[] = ["TRAVELER"]) {
  const u = await db.user.upsert({
    where: { email },
    update: { name, avatarUrl: avatar },
    create: { email, name, avatarUrl: avatar, passwordHash: await bcrypt.hash(DEMO_PW, 10), isDemo: true, createdAt: daysAgo(200) },
  });
  for (const role of roles) await db.userRole.upsert({ where: { userId_role: { userId: u.id, role } }, update: {}, create: { userId: u.id, role } });
  return u;
}

async function seedDemo() {
  console.log("Seeding demo content (isDemo=true)…");
  const city = Object.fromEntries((await db.city.findMany()).map((c) => [c.slug, c]));
  const cat = Object.fromEntries((await db.category.findMany()).map((c) => [c.slug, c]));

  const roamerSeeds = [
    { email: "ayse@demo.askaroamer.local", name: "Ayşe Kaya", slug: "ayse-kaya", city: "lisbon", years: 5, avatar: "ayse", langs: "tr,en,pt", exp: ["relocation", "cost-of-living", "nomad-life"], prices: [15, 25, 45],
      headline: "Lizbon’da 5 yıldır yaşayan relocation danışmanı",
      bio: "2020’de İstanbul’dan Lizbon’a taşındım. D7 ve dijital nomad vizesi süreçlerini bizzat yaşadım; NIF, banka hesabı, ev kiralama ve okul seçimi konularında onlarca aileye yardımcı oldum. Arroios’ta yaşıyorum ve şehrin mahallelerini iyi tanıyorum.",
      quote: "Bali’deki deneyimlerimi paylaşırken hem harika insanlarla tanıştım hem de düzenli gelir elde etmeye başladım." },
    { email: "can@demo.askaroamer.local", name: "Can Demir", slug: "can-demir", city: "bali", years: 3, avatar: "can", langs: "tr,en,id", exp: ["nomad-life", "cost-of-living", "work-business"], prices: [15, 25, 40],
      headline: "Canggu’da yaşayan yazılımcı ve nomad topluluk organizatörü",
      bio: "Üç yıldır Bali’de, çoğunlukla Canggu ve Ubud arasında yaşıyorum. Uzun dönem villa kiralama, scooter, coworking alanları, internet ve vize uzatma süreçlerini birinci elden biliyorum.",
      quote: "Taşınma ve vize süreçlerinde bana sorulan sorulara yanıt vermek çok keyifli. Gerçekten ihtiyacı olan insanlara yardımcı oluyorum." },
    { email: "selin@demo.askaroamer.local", name: "Selin Arslan", slug: "selin-arslan", city: "barcelona", years: 6, avatar: "selin", langs: "tr,en,es", exp: ["cost-of-living", "travel", "relocation"], prices: [20, 30, 50],
      headline: "Barselona’da 6 yıldır yaşayan UX tasarımcı",
      bio: "Gràcia’da yaşıyorum. NIE, empadronamiento ve dijital nomad vizesi başvurularını tamamladım. Semt seçimi, kira sözleşmeleri ve şehirde sosyal hayat konusunda pratik öneriler veririm.",
      quote: "Rehberimi yayınladıktan sonra sadece birkaç hafta içinde yüzlerce kişi yararlandı. Bilgimin değerli olduğunu görmek harika." },
    { email: "mehmet@demo.askaroamer.local", name: "Mehmet Yılmaz", slug: "mehmet-yilmaz", city: "berlin", years: 4, avatar: "mehmet", langs: "tr,en,de", exp: ["work-business", "cost-of-living", "relocation"], prices: [15, 25, 45],
      headline: "Berlin’de freelance yazılım geliştirici",
      bio: "Dört yıldır Berlin’de freelance (Freiberufler) olarak çalışıyorum. Freelance oturum izni, Anmeldung, Steuernummer ve sağlık sigortası seçimi konularında deneyimliyim.",
      quote: null },
    { email: "zeynep@demo.askaroamer.local", name: "Zeynep Erden", slug: "zeynep-erden", city: "bangkok", years: 3, avatar: "zeynep", langs: "tr,en,th", exp: ["cost-of-living", "relocation", "travel"], prices: [15, 22, 40],
      headline: "Bangkok’ta yaşayan içerik üreticisi",
      bio: "Üç yıldır Bangkok’ta, Ari ve Sukhumvit bölgelerinde yaşadım. Kondo kiralama, uzun süreli vize seçenekleri, sağlık sigortası ve günlük bütçe konusunda deneyimlerimi paylaşıyorum.",
      quote: null },
    { email: "emre@demo.askaroamer.local", name: "Emre Can", slug: "emre-can", city: "tokyo", years: 5, avatar: "emre", langs: "tr,en,ja", exp: ["work-business", "travel", "cost-of-living"], prices: [25, 35, 60],
      headline: "Tokyo’da 5 yıldır çalışan ürün yöneticisi",
      bio: "Tokyo’da bir teknoloji şirketinde çalışıyorum. Çalışma vizesi, ev bulma (shikikin/reikin), banka ve telefon hattı açma gibi ilk ay işlerini adım adım anlatabilirim.",
      quote: null },
  ];

  const roamers: Record<string, { id: string; userId: string }> = {};
  for (const r of roamerSeeds) {
    const u = await user(r.email, r.name, `/images/roamers/avatar-${r.avatar}.jpg`, ["TRAVELER", "ROAMER"]);
    const p = await db.roamerProfile.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id, slug: r.slug, cityId: city[r.city].id, headline: r.headline, bio: r.bio, yearsInCity: r.years, languages: r.langs,
        photoUrl: `/images/roamers/${r.avatar}.jpg`, status: "APPROVED", verified: true, verifiedAt: daysAgo(120), motivation: r.quote,
        expertise: { connect: r.exp.map((e) => ({ id: cat[e].id })) }, createdAt: daysAgo(150),
      },
    });
    roamers[r.slug] = { id: p.id, userId: u.id };
    for (const [i, d] of [15, 30, 60].entries())
      await db.consultationOffer.upsert({ where: { roamerId_durationMin: { roamerId: p.id, durationMin: d } }, update: {}, create: { roamerId: p.id, durationMin: d, priceCents: r.prices[i] * 100 } });
    // future availability: weekdays for the next 14 days at 09:00, 11:00, 16:00 UTC
    for (let day = 1; day <= 14; day++) {
      const base = new Date();
      base.setUTCDate(base.getUTCDate() + day);
      if ([0, 6].includes(base.getUTCDay())) continue;
      for (const h of [9, 11, 16]) {
        const s = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), h));
        await db.availabilitySlot.upsert({ where: { roamerId_startsAt: { roamerId: p.id, startsAt: s } }, update: {}, create: { roamerId: p.id, startsAt: s, endsAt: new Date(s.getTime() + 3600_000) } });
      }
    }
    await db.verificationRecord.create({ data: { roamerId: p.id, type: "RESIDENCE", evidence: "Demo: residence document checked", status: "APPROVED", reviewedAt: daysAgo(120) } });
  }

  // A pending applicant to exercise the admin flow
  const pend = await user("deniz@demo.askaroamer.local", "Deniz Aydın", null, ["TRAVELER", "ROAMER"]);
  await db.roamerProfile.upsert({
    where: { userId: pend.id },
    update: {},
    create: { userId: pend.id, slug: "deniz-aydin", cityId: city["prague"].id, headline: "Prag’da yüksek lisans öğrencisi", bio: "İki yıldır Prag’da yaşıyorum; öğrenci vizesi, yurt ve paylaşımlı ev bulma konusunda deneyimliyim.", yearsInCity: 2, languages: "tr,en,cs", status: "PENDING", expertise: { connect: [{ id: cat["relocation"].id }] } },
  });

  const travelers = {
    elif: await user("elif@demo.askaroamer.local", "Elif A.", "/images/roamers/avatar-elif.jpg"),
    mert: await user("mert@demo.askaroamer.local", "Mert K.", "/images/roamers/avatar-mert.jpg"),
    derya: await user("derya@demo.askaroamer.local", "Derya S.", "/images/roamers/avatar-derya.jpg"),
    cant: await user("cant@demo.askaroamer.local", "Can T.", "/images/roamers/avatar-cant.jpg"),
    selinr: await user("selinr@demo.askaroamer.local", "Selin R.", "/images/roamers/avatar-selinr.jpg"),
    demo: await user("demo@askaroamer.local", "Demo Traveler", null),
  };

  /* ---------- questions & answers ---------- */
  type QA = { slug: string; locale: L; title: string; body: string; author: string; city: string; cat: string; days: number; answers: { by: string; body: string; days: number }[] };
  const qas: QA[] = [
    { slug: "balide-aylik-yasam-maliyeti-ne-kadar", locale: "tr", title: "Bali’de aylık yaşam maliyeti ne kadar?", body: "Tek kişi için kira, yaşam giderleri ve ortalama aylık bütçe hakkında güncel deneyimlerinizi paylaşır mısınız? Canggu veya Ubud düşünüyorum.", author: "elif", city: "bali", cat: "cost-of-living", days: 2,
      answers: [
        { by: "can-demir", days: 2, body: "Bali’de tek kişi için ortalama aylık yaşam maliyeti, tercihlere göre yaklaşık 900–1.500 USD arasında. Kira, konum ve yaşam tarzına göre değişiyor. Canggu’da havuzlu tek odalı bir guesthouse/villa odası aylık 450–800 USD; Ubud genelde %15–20 daha uygun. Scooter kiralama 60–80 USD, coworking üyeliği 100–180 USD, yemeğin çoğunu warunglarda yersen 250–350 USD yeterli. Uzun dönem kiralarda 3–6 aylık peşin ödeme istenebiliyor, pazarlık payı var." },
        { by: "zeynep-erden", days: 1, body: "Bangkok’la kıyaslayınca Bali’de kira daha pahalı ama günlük yemek benzer. Sağlık sigortasını unutma: uluslararası bir nomad sigortası aylık 50–120 USD civarında." },
      ] },
    { slug: "lizbona-tasinmak-zor-mu-ilk-adimlar-neler", locale: "tr", title: "Lizbon’a taşınmak zor mu? İlk adımlar neler?", body: "Oturum, vize, kira ve adaptasyon sürecinde nelere dikkat etmeliyim? Uzaktan çalışıyorum ve eşimle birlikte gelmeyi düşünüyoruz.", author: "mert", city: "lisbon", cat: "relocation", days: 3,
      answers: [
        { by: "ayse-kaya", days: 3, body: "Zor değil ama sıralama önemli. 1) Türkiye’deyken vize türüne karar ver: uzaktan çalışanlar için dijital nomad vizesi, pasif geliri olanlar için D7. 2) Portekiz’e gelince ilk iş NIF (vergi numarası) al; ev kiralamak ve banka hesabı için şart. 3) Kira: Lizbon merkezde 1+1 daireler son dönemde aylık 1.100–1.600 EUR bandında, ilk etapta 1–3 ay geçici konaklama ayarlayıp mahalleleri gezerek karar vermeni öneririm. 4) AIMA randevuları uzun sürebiliyor, belgelerinin apostilli kopyalarını yanında getir." },
      ] },
    { slug: "berlinde-freelance-calismak-icin-ne-gerekiyor", locale: "tr", title: "Berlin’de freelance çalışmak için ne gerekiyor?", body: "Vergi, ikamet, müşteri bulma ve yaşam maliyetleri hakkında deneyim paylaşabilecek var mı?", author: "derya", city: "berlin", cat: "work-business", days: 4,
      answers: [
        { by: "mehmet-yilmaz", days: 4, body: "Benim sürecim şöyleydi: Anmeldung (adres kaydı) → freelance oturum izni başvurusu (en az iki Alman müşteriden niyet mektubu, iş planı ve gelir tablosu istendi) → Finanzamt’tan Steuernummer. Sağlık sigortası başvurudan önce hazır olmalı. Kira tarafında WG odaları 600–900 EUR, tek kişilik daireler 1.000 EUR üzeri. İlk yıl vergi danışmanı (Steuerberater) ile çalışmanı tavsiye ederim." },
      ] },
    { slug: "bangkokta-uzun-sureli-yasamak-nasil-bir-deneyim", locale: "tr", title: "Bangkok’ta uzun süreli yaşamak nasıl bir deneyim?", body: "Artılar, eksiler, güvenlik ve günlük yaşam hakkında gerçek görüşler?", author: "cant", city: "bangkok", cat: "nomad-life", days: 5,
      answers: [
        { by: "zeynep-erden", days: 5, body: "Artılar: BTS/MRT ile ulaşım çok kolay, yemek ucuz ve çeşitli, sağlık hizmetleri kaliteli. Eksiler: Mart–Mayıs arası sıcak ve nem zorlayıcı, bazı dönemlerde hava kirliliği yükseliyor. Güvenlik açısından genel olarak rahat bir şehir. Ari veya On Nut gibi bölgelerde 1+1 kondo aylık 12.000–20.000 THB." },
      ] },
    { slug: "barcelonada-nerede-yasamak-daha-mantikli", locale: "tr", title: "Barselona’da nerede yaşamak daha mantıklı?", body: "Dijital nomad olarak hem merkezi hem de uygun bütçeli semt önerileriniz?", author: "selinr", city: "barcelona", cat: "cost-of-living", days: 5,
      answers: [
        { by: "selin-arslan", days: 5, body: "Gràcia (köy havası, kafeler), Sant Antoni (pazar ve restoranlar) ve Poblenou (sahile yakın, coworking yoğun) ilk üç önerim. Daha uygun bütçe için Sants veya El Clot’a bakabilirsin. Oda kiraları 550–800 EUR, stüdyolar 1.000 EUR civarından başlıyor." },
      ] },
    { slug: "tokyoda-ev-bulmak-icin-ne-kadar-butce-gerekir", locale: "tr", title: "Tokyo’da ev bulmak için ne kadar bütçe gerekir?", body: "Depozito, key money ve aylık kira hakkında bilgi alabilir miyim?", author: "elif", city: "tokyo", cat: "relocation", days: 8,
      answers: [
        { by: "emre-can", days: 7, body: "Giriş maliyeti genelde 4–6 aylık kira ediyor: shikikin (depozito) 1–2 ay, reikin (key money) 0–1 ay, emlakçı ücreti 1 ay, garantör şirketi ücreti ve sigorta. Merkeze 30 dk mesafede 1K/1DK daireler aylık 80.000–120.000 JPY. Yabancılara kiralayan ajansları tercih etmek süreci hızlandırıyor." },
      ] },
    { slug: "chiang-maide-coworking-onerileri", locale: "tr", title: "Chiang Mai’de coworking önerileri?", body: "Nimman bölgesinde kalacağım, hızlı interneti olan coworking alanları hangileri?", author: "mert", city: "chiang-mai", cat: "nomad-life", days: 9, answers: [] },
    { slug: "prag-ogrenci-vizesi-sureci", locale: "tr", title: "Prag’da öğrenci vizesi süreci ne kadar sürüyor?", body: "Başvurudan randevuya kadar geçen süre ve gerekli belgeler hakkında deneyimi olan var mı?", author: "derya", city: "prague", cat: "relocation", days: 12, answers: [] },
    { slug: "mexico-city-safe-neighbourhoods", locale: "en", title: "Which Mexico City neighbourhoods are best for a first stay?", body: "Planning three months in CDMX while working remotely. Roma, Condesa or somewhere quieter?", author: "demo", city: "mexico-city", cat: "travel", days: 6, answers: [] },
    { slug: "lisbon-digital-nomad-visa-income", locale: "en", title: "What income do you need for Portugal’s digital nomad visa?", body: "I work for a UK company. How did you prove your income and how long did the process take?", author: "demo", city: "lisbon", cat: "relocation", days: 10,
      answers: [{ by: "ayse-kaya", days: 9, body: "The threshold is tied to four times the Portuguese minimum wage, so check the current figure on the consulate site before you apply. I submitted three months of payslips, my employment contract and a letter confirming remote work. From consulate appointment to visa took about two months for me." }] },
    { slug: "vivre-a-bali-budget-mensuel", locale: "fr", title: "Quel budget mensuel pour vivre à Bali en couple ?", body: "Nous envisageons six mois à Ubud. Logement, scooter, nourriture : combien prévoir ?", author: "demo", city: "bali", cat: "cost-of-living", days: 7,
      answers: [{ by: "can-demir", days: 6, body: "Pour un couple à Ubud, comptez environ 1 600 à 2 400 USD par mois : 700 à 1 100 USD pour une petite villa avec piscine en location longue durée, 70 USD par scooter, et 400 à 600 USD de nourriture si vous mangez surtout dans les warungs." }] },
    { slug: "berlin-anmeldung-rendez-vous", locale: "fr", title: "Comment obtenir rapidement un rendez-vous pour l’Anmeldung à Berlin ?", body: "Tous les créneaux sont pris. Des astuces ?", author: "demo", city: "berlin", cat: "relocation", days: 11,
      answers: [{ by: "mehmet-yilmaz", days: 10, body: "Consultez le portail des Bürgerämter tôt le matin : des créneaux libérés par des annulations apparaissent souvent entre 7 h et 8 h. Vous pouvez aussi prendre rendez-vous dans n’importe quel Bürgeramt de la ville, pas seulement celui de votre quartier." }] },
  ];

  const qIds: Record<string, string> = {};
  for (const q of qas) {
    const created = await db.question.upsert({
      where: { slug: q.slug },
      update: {},
      create: { slug: q.slug, locale: q.locale, title: q.title, body: q.body, authorId: travelers[q.author as keyof typeof travelers].id, cityId: city[q.city].id, categoryId: cat[q.cat].id, createdAt: daysAgo(q.days), updatedAt: daysAgo(q.answers.length ? q.answers[q.answers.length - 1].days : q.days) },
    });
    qIds[q.slug] = created.id;
    const existing = await db.answer.count({ where: { questionId: created.id } });
    if (!existing) for (const a of q.answers) await db.answer.create({ data: { questionId: created.id, authorId: roamers[a.by].userId, body: a.body, createdAt: daysAgo(a.days) } });
  }

  /* ---------- guides ---------- */
  type GuideSeed = { slug: string; locale: L; by: string; city: string; cat: string; price: number; cover: string; title: string; summary: string; description: string; chapters: [string, string, boolean][] };
  const guides: GuideSeed[] = [
    { slug: "balide-yasam-rehberi", locale: "tr", by: "can-demir", city: "bali", cat: "nomad-life", price: 19, cover: "/images/guides/bali.jpg", title: "Bali’de Yaşam Rehberi",
      summary: "Bölge seçimi, uzun dönem kiralama, vize, ulaşım ve aylık bütçe: Bali’ye taşınmadan önce bilmen gereken her şey.",
      description: "Üç yıldır Bali’de yaşayan Can Demir’in hazırladığı bu rehber; Canggu, Ubud, Sanur ve Uluwatu’yu yaşam kalitesi, maliyet ve topluluk açısından karşılaştırır. Ev ararken sorulacak sorular, sözleşme kontrol listesi ve örnek aylık bütçe tabloları içerir.",
      chapters: [["Bölgeleri tanıyalım: Canggu, Ubud, Sanur, Uluwatu", "Canggu sosyal ve hareketli; Ubud sakin ve doğayla iç içe; Sanur aileler için ideal; Uluwatu ise sörf ve manzara arayanlar için. Bu bölümde her bölgeyi kira, internet hızı, trafik ve topluluk açısından puanlıyoruz.", true], ["Uzun dönem ev kiralama", "Facebook grupları, yerel emlakçılar ve yürüyerek bulunan ilanlar… Pazarlık nasıl yapılır, peşin ödeme ne zaman mantıklıdır, sözleşmede nelere bakılır?", false], ["Vize seçenekleri ve uzatma", "Varışta vize, tek girişli turist vizesi ve uzun süreli seçeneklerin pratikte nasıl işlediği ve ajans seçerken dikkat edilmesi gerekenler.", false], ["Ulaşım, internet ve coworking", "Scooter ehliyeti, araç kiralama, Grab/Gojek kullanımı; ev internetinin yedeklenmesi ve en iyi coworking alanları.", false], ["Örnek aylık bütçeler", "Tasarruflu, orta ve konforlu yaşam için üç ayrı aylık bütçe tablosu.", false]] },
    { slug: "lizbona-tasinma-rehberi", locale: "tr", by: "ayse-kaya", city: "lisbon", cat: "relocation", price: 24, cover: "/images/guides/lisbon.jpg", title: "Lizbon’a Taşınma Rehberi",
      summary: "Vize türleri, NIF, banka hesabı, ev bulma ve AIMA süreci: Lizbon’a taşınma adımları sırasıyla.",
      description: "Ayşe Kaya’nın beş yıllık deneyimine dayanan bu rehber, Türkiye’den Lizbon’a taşınma sürecini kontrol listeleriyle birlikte adım adım anlatır.",
      chapters: [["Hangi vize sana uygun?", "D7, dijital nomad vizesi ve iş vizesinin farkları; kimler hangi vizeye başvurmalı?", true], ["İlk hafta: NIF, banka ve telefon", "NIF almak için gerekenler, temsilci (fiscal representative) ihtiyacı, banka hesabı açılışı.", false], ["Ev bulma ve mahalle seçimi", "Arroios, Alvalade, Campo de Ourique, Parque das Nações: bütçe ve yaşam tarzına göre karşılaştırma.", false], ["AIMA randevusu ve oturum kartı", "Belgeler, apostil, randevu takibi ve sık yapılan hatalar.", false]] },
    { slug: "berlinde-freelance-rehberi", locale: "tr", by: "mehmet-yilmaz", city: "berlin", cat: "work-business", price: 19, cover: "/images/guides/berlin.jpg", title: "Berlin’de Freelance Rehberi",
      summary: "Freelance oturum izni, vergi kaydı, sağlık sigortası ve müşteri bulma üzerine pratik rehber.",
      description: "Berlin’de dört yıldır freelance çalışan Mehmet Yılmaz’ın başvuru dosyası şablonları ve vergi takvimini içeren rehberi.",
      chapters: [["Freiberufler mi Gewerbe mi?", "İki statünün farkı ve hangisinin sana uygun olduğu.", true], ["Oturum izni başvuru dosyası", "Niyet mektupları, iş planı ve gelir tablosu nasıl hazırlanır?", false], ["Vergi ve muhasebe", "Steuernummer, KDV (Umsatzsteuer) ve yıllık beyanname takvimi.", false], ["Sağlık sigortası", "Kamu ve özel sigorta arasında seçim.", false]] },
    { slug: "barcelonada-yasam-rehberi", locale: "tr", by: "selin-arslan", city: "barcelona", cat: "cost-of-living", price: 22, cover: "/images/guides/barcelona.jpg", title: "Barselona’da Yaşam Rehberi",
      summary: "Semtler, NIE ve empadronamiento, kira piyasası ve günlük yaşam ipuçları.",
      description: "Barselona’da altı yıldır yaşayan Selin Arslan’dan şehre yerleşmenin pratik yol haritası.",
      chapters: [["Semt semt Barselona", "Gràcia, Eixample, Poblenou, Sant Antoni ve Sants karşılaştırması.", true], ["NIE ve empadronamiento", "Randevu alma, gerekli belgeler ve süreler.", false], ["Kira sözleşmeleri", "Depozito, ajans ücreti ve dikkat edilmesi gereken maddeler.", false]] },
    { slug: "bangkok-condo-renting-guide", locale: "en", by: "zeynep-erden", city: "bangkok", cat: "cost-of-living", price: 15, cover: "/images/cities/bangkok.jpg", title: "Renting a Condo in Bangkok",
      summary: "Areas, prices, contracts and deposits: how to rent your first condo in Bangkok without surprises.",
      description: "A practical, checklist-driven guide by Zeynep Erden, based on three years and four condo rentals in Bangkok.",
      chapters: [["Choosing an area", "Ari, Phrom Phong, On Nut and Silom compared by price, transit and lifestyle.", true], ["Viewing checklist", "What to test in a viewing: water pressure, AC, internet, noise.", false], ["Contracts and deposits", "Standard terms, the two-month deposit and how to get it back.", false]] },
  ];
  const guideIds: Record<string, string> = {};
  for (const g of guides) {
    const created = await db.guide.upsert({
      where: { slug: g.slug },
      update: {},
      create: { slug: g.slug, locale: g.locale, roamerId: roamers[g.by].id, cityId: city[g.city].id, categoryId: cat[g.cat].id, title: g.title, summary: g.summary, description: g.description, coverUrl: g.cover, priceCents: g.price * 100, status: "PUBLISHED", publishedAt: daysAgo(60), updatedAt: daysAgo(14) },
    });
    guideIds[g.slug] = created.id;
    for (const [i, [title, content, isPreview]] of g.chapters.entries())
      await db.guideChapter.upsert({ where: { guideId_position: { guideId: created.id, position: i + 1 } }, update: {}, create: { guideId: created.id, position: i + 1, title, content, isPreview } });
  }

  /* ---------- demo purchases, completed bookings and reviews ---------- */
  const reviewers = [travelers.elif, travelers.mert, travelers.derya, travelers.cant, travelers.selinr];
  const reviewTexts = [
    "Çok net ve pratik bilgiler verdi, taşınma planımı netleştirdim.",
    "Sorularımı sabırla yanıtladı, önerdiği mahalle tam bize göreydi.",
    "Görüşme öncesi hazırlık yapmıştı, çok verimli geçti.",
    "Bütçe tablosu ve kontrol listesi çok işime yaradı.",
    "Gerçek deneyim, abartı yok. Kesinlikle tavsiye ederim.",
  ];
  if ((await db.review.count()) === 0) {
    for (const [slug, r] of Object.entries(roamers)) {
      const offer = await db.consultationOffer.findFirstOrThrow({ where: { roamerId: r.id, durationMin: 30 } });
      for (const [i, traveler] of reviewers.entries()) {
        const startsAt = daysAgo(20 + i * 5);
        const booking = await db.booking.create({ data: { travelerId: traveler.id, roamerId: r.id, offerId: offer.id, startsAt, durationMin: 30, priceCents: offer.priceCents, currency: "EUR", status: "COMPLETED", createdAt: daysAgo(25 + i * 5) } });
        const fee = Math.round(offer.priceCents * 0.2);
        await db.payment.create({ data: { userId: traveler.id, purpose: "BOOKING", bookingId: booking.id, amountCents: offer.priceCents, platformFeeCents: fee, payeeEarningsCents: offer.priceCents - fee, payeeRoamerId: r.id, currency: "EUR", provider: "test", status: "SUCCEEDED", createdAt: daysAgo(25 + i * 5) } });
        const rating = (slug.length + i) % 5 === 0 ? 4 : 5;
        await db.review.create({ data: { authorId: traveler.id, roamerId: r.id, bookingId: booking.id, rating, comment: reviewTexts[i], createdAt: startsAt } });
      }
    }
    for (const [gi, [slug, gid]] of Object.entries(guideIds).entries()) {
      const g = guides.find((x) => x.slug === slug)!;
      for (const [i, traveler] of reviewers.slice(0, 3 + (gi % 3)).entries()) {
        const fee = Math.round(g.price * 100 * 0.2);
        const pay = await db.payment.create({ data: { userId: traveler.id, purpose: "GUIDE", amountCents: g.price * 100, platformFeeCents: fee, payeeEarningsCents: g.price * 100 - fee, payeeRoamerId: roamers[g.by].id, currency: "EUR", provider: "test", providerRef: `guide:${gid}`, status: "SUCCEEDED", createdAt: daysAgo(30 - i) } });
        await db.guidePurchase.create({ data: { guideId: gid, userId: traveler.id, paymentId: pay.id, createdAt: daysAgo(30 - i) } });
        await db.review.create({ data: { authorId: traveler.id, guideId: gid, rating: i === 2 ? 4 : 5, comment: reviewTexts[(i + 3) % 5], createdAt: daysAgo(20 - i) } });
      }
    }
  }
  console.log("Demo seed done. Demo password for all demo users:", DEMO_PW);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
