// qa/parity/probe-urls.mjs — status + reason probe for a handful of paths (read-only).
//   node qa/parity/probe-urls.mjs [base] /path /path ...
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
  const res = await ctx.request.get(p, { maxRedirects: 0, timeout: 60_000 });
  const status = res.status();
  const loc = res.headers()["location"] ?? "";
  let marker = "";
  if (status === 404) {
    const t = await res.text().catch(() => "");
    marker = /This page could not be found|404/i.test(t) ? "next-not-found" : `body ${t.length}B`;
  } else if (res.ok()) {
    const t = await res.text().catch(() => "");
    const canon = /rel="canonical" href="([^"]+)"/.exec(t)?.[1] ?? "(none)";
    marker = `len=${t.length} canon=${canon.replace(/^https:\/\/www\.indianexaminfo\.com/, "")}`;
  }
  console.log(`${String(status).padEnd(4)} ${p}${loc ? `  -> ${loc}` : ""}  ${marker}`);
}
await browser.close();
