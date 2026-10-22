// qa/parity/crawl-test-tabs.mjs — for each zz-test reference page, read the tab
// links it ACTUALLY renders and fetch every one (status + TEST banner + noindex).
// Local QA only. Not shipped.
import { chromium } from "@playwright/test";

const BASE = process.env.SITE_URL || "https://www.indianexaminfo.com";
const pages = [
  ["entrance", "/admission/management/zz-test-entrance-exam"],
  ["government", "/sarkari-naukri/zz-test-government-exam"],
  ["govt-vacancy", "/sarkari-naukri/zz-test-govt-vacancy"],
  ["board", "/board-exam/state/uttar-pradesh/zz-test-board-exam"],
  ["university", "/university-exam/state-university/zz-test-university-exam"],
];

async function probe(url) {
  try {
    const r = await fetch(url, { headers: { "user-agent": "crawl/1" }, redirect: "manual" });
    let loc = r.headers.get("location") || "";
    if (r.status >= 300 && r.status < 400) return { status: r.status, redirect: loc, banner: false, noindex: false };
    const b = await r.text();
    const robots = ((b.match(/<meta[^>]+name=["']robots["'][^>]*>/i) || [""])[0].match(/content=["']([^"']+)["']/i) || ["", ""])[1];
    return { status: r.status, banner: /TEST PAGE/.test(b), noindex: /noindex/i.test(robots || "") };
  } catch (e) { return { status: "ERR", err: e.message }; }
}

const browser = await chromium.launch();
for (const [name, path] of pages) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 45000 });
  const slug = path.split("/").pop();
  // every same-origin link the page renders that points at this record (main + CT tabs + sidebar quick links)
  const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href") || ""));
  const links = [...new Set(hrefs.filter((h) => h.includes(slug)))].map((h) => (h.startsWith("http") ? h : BASE + h));
  console.log(`\n### ${name}  main=${path}`);
  for (const l of links) {
    const p = await probe(l);
    const rel = l.replace(BASE, "");
    const flag = p.status === 200 ? (p.banner && p.noindex ? "OK" : "CHECK") : (p.status >= 300 && p.status < 400 ? "REDIR" : "FAIL");
    console.log(`  [${flag}] ${p.status}  banner=${p.banner ?? "-"}  noindex=${p.noindex ?? "-"}  ${rel}${p.redirect ? " -> " + p.redirect : ""}`);
  }
  await ctx.close();
}
await browser.close();
console.log("\nDONE");
