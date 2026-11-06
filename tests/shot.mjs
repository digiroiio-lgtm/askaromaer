// Usage: node tests/shot.mjs <path> <outfile> [width] [height|full] [mobile]
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const [, , path = "/tr/", out = "shot.png", width = "1199", height = "full", mobile] = process.argv;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: Number(width), height: height === "full" ? 900 : Number(height) }, deviceScaleFactor: 1, isMobile: !!mobile, hasTouch: !!mobile });
if (process.env.COOKIE) await ctx.addCookies([{ name: "ar_session", value: process.env.COOKIE, url: "http://localhost:3000" }]);
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
await page.screenshot({ path: out, fullPage: height === "full" });
if (errors.length) console.log("ERRORS:", errors.join("\n"));
await browser.close();
