// qa/parity/page-shape.mjs — what does a page actually say? (read-only diagnostic)
//   node qa/parity/page-shape.mjs [base] /path /path ...
import { chromium } from "@playwright/test";

const argv = process.argv.slice(2);
const BASE = (argv[0] && !argv[0].startsWith("/") ? argv[0] : "http://localhost:3002").replace(/\/+$/, "");
const PATHS = argv.filter((a) => a.startsWith("/"));

async function launch() {
  try { return await chromium.launch(); } catch { return await chromium.launch({ channel: "chrome" }); }
}
const browser = await launch();
const ctx = await browser.newContext({ baseURL: BASE });
for (const p of PATHS) {
  const res = await ctx.request.get(p, { maxRedirects: 5, timeout: 60_000 });
  const t = await res.text().catch(() => "");
  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(t)?.[1] ?? "(no title)";
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(t)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "(no h1)";
  const canon = /rel="canonical" href="([^"]+)"/i.exec(t)?.[1] ?? "(no canonical)";
  const robots = /<meta name="robots" content="([^"]+)"/i.exec(t)?.[1] ?? "(none)";
  console.log([
    `${res.status()} ${p}`,
    `  title=${title.slice(0, 70)}`,
    `  h1=${h1.slice(0, 70)}`,
    `  canon=${canon.replace(/^https:\/\/www\.indianexaminfo\.com/, "")}`,
    `  robots=${robots}`,
    `  bytes=${t.length}`,
  ].join("\n"));
}
await browser.close();
