import { test } from "node:test";
import assert from "node:assert/strict";
import { href, toInternal, toLocalized, locales, SEGMENTS } from "../src/i18n/config";
import { safeNext, splitAmount } from "../src/lib/pure";
import { slugify, fmt, money } from "../src/lib/format";
import tr from "../src/i18n/dictionaries/tr";
import en from "../src/i18n/dictionaries/en";
import fr from "../src/i18n/dictionaries/fr";

test("localized hrefs match the spec", () => {
  assert.equal(href("tr", "/cities"), "/tr/sehirler/");
  assert.equal(href("en", "/become-a-roamer"), "/en/become-a-roamer/");
  assert.equal(href("fr", "/become-a-roamer"), "/fr/devenir-roamer/");
  assert.equal(href("tr", "/account/purchased-guides"), "/tr/hesabim/satin-aldigim-rehberler/");
  assert.equal(href("tr", "/roamers/bali"), "/tr/roamerlar/bali/");
  assert.equal(href("tr", "/questions", { city: "bali", x: undefined }), "/tr/sorular/?city=bali");
});

test("localized <-> internal segment mapping is reversible and unambiguous", () => {
  for (const l of locales) {
    const seen = new Set<string>();
    for (const [internal, map] of Object.entries(SEGMENTS)) {
      assert.ok(!seen.has(map[l]), `duplicate ${l} slug ${map[l]}`);
      seen.add(map[l]);
      assert.deepEqual(toInternal(l, toLocalized(l, [internal, "some-slug"])), [internal, "some-slug"]);
    }
  }
});

test("dictionaries have identical key structure", () => {
  const keys = (o: unknown, p = ""): string[] =>
    o && typeof o === "object" && !Array.isArray(o) ? Object.entries(o).flatMap(([k, v]) => keys(v, `${p}.${k}`)) : [p];
  assert.deepEqual(keys(en), keys(tr));
  assert.deepEqual(keys(fr), keys(tr));
});

test("safeNext blocks open redirects", () => {
  assert.equal(safeNext("/tr/hesabim/", "/x"), "/tr/hesabim/");
  assert.equal(safeNext("//evil.com", "/x"), "/x");
  assert.equal(safeNext("https://evil.com", "/x"), "/x");
  assert.equal(safeNext("/\\evil.com", "/x"), "/x");
  assert.equal(safeNext(undefined, "/x"), "/x");
});

test("commission split always sums to the amount", () => {
  for (const [a, f] of [[1500, 20], [1999, 20], [100, 0], [2500, 33]]) {
    const s = splitAmount(a, f);
    assert.equal(s.platformFeeCents + s.payeeEarningsCents, a);
  }
  assert.deepEqual(splitAmount(2500, 20), { platformFeeCents: 500, payeeEarningsCents: 2000 });
});

test("format helpers", () => {
  assert.equal(slugify("Lizbon’a taşınmak zor mu? İlk adımlar"), "lizbon-a-tasinmak-zor-mu-ilk-adimlar");
  assert.equal(fmt("{n} yıldır {cityIn} yaşıyor", { n: 4, cityIn: "Bali’de" }), "4 yıldır Bali’de yaşıyor");
  assert.match(money(1500, "EUR", "en"), /€15/);
});
