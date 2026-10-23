// qa/parity/live-check.mjs — item 6 of the reference-pages review: verify a DEPLOYED
// build the way a reader meets it, in a real browser.
//
// The HTML-regex audits (heading-audit.mjs) answer "what did the server print". This
// answers the two things only a browser can: what did the console say, and what is
// actually in the DOM after hydration. For each page it reports:
//   • HTTP status, plus any redirect hop
//   • every <h1>/<h2> the reader sees, and any heading text appearing more than once
//   • every <section> that has a heading and nothing else (an empty shell)
//   • console errors/warnings, uncaught page errors, and failed network requests
//   • whether the TEST banner is present (reference records must always show it)
// Read-only. Local QA tool; not shipped.
//
//   node qa/parity/live-check.mjs                       # the five reference pages + 3 CT pages
//   node qa/parity/live-check.mjs "name=/path" ...      # your own list
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.SITE_URL || "https://www.indianexaminfo.com";

const DEFAULT_PAGES = [
  ["entrance", "/admission/management/zz-test-entrance-exam"],
  ["government", "/sarkari-naukri/central-government-jobs/zz-test-government-exam"],
  ["govt-vacancy", "/sarkari-naukri/agriculture-recruitment/zz-test-govt-vacancy"],
  ["board", "/board-exam/state/up-board/zz-test-board-exam"],
  ["university", "/university-exam/state-university/zz-test-university-exam"],
  ["entrance/admit-card", "/admission/management/zz-test-entrance-exam/admit-card"],
  ["entrance/result", "/admission/management/zz-test-entrance-exam/result"],
  ["board/notification", "/board-exam/state/up-board/zz-test-board-exam/notification"],
];

const args = process.argv.slice(2).filter((a) => a.includes("=")).map((a) => {
  const i = a.indexOf("=");
  return [a.slice(0, i), a.slice(i + 1)];
});
const pages = args.length ? args : DEFAULT_PAGES;

const browser = await chromium.launch();
const out = [];
let totalDupes = 0, totalShells = 0, totalErrors = 0;

for (const [name, path] of pages) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") consoleErrors.push(`${m.type()}: ${m.text().slice(0, 160)}`); });
  page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 160)));
  page.on("requestfailed", (r) => failedRequests.push(`${r.method()} ${r.url().slice(0, 120)} — ${r.failure()?.errorText}`));

  let status = "ERR", finalUrl = BASE + path;
  try {
    const resp = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 60000 });
    status = resp ? resp.status() : "no-resp";
    finalUrl = page.url();
  } catch (e) {
    out.push(`${name}  LOAD FAILED ${e.message.split("\n")[0]}  ${BASE}${path}`);
    await ctx.close();
    continue;
  }

  const dom = await page.evaluate(() => {
    const txt = (el) => (el.textContent || "").replace(/\s+/g, " ").trim();
    const h1 = [...document.querySelectorAll("h1")].map(txt).filter(Boolean);
    const h2 = [...document.querySelectorAll("h2")].map(txt).filter(Boolean);
    const all = [...h1, ...h2];
    const dupes = [...new Set(all.filter((t, i) => all.indexOf(t) !== i))];
    // an empty shell = a section whose only content is a heading
    const shells = [...document.querySelectorAll("section")]
      .filter((s) => {
        const heading = s.querySelector("h1,h2,h3");
        if (!heading) return false;
        const clone = s.cloneNode(true);
        clone.querySelectorAll("h1,h2,h3,caption,script,style").forEach((n) => n.remove());
        return (clone.textContent || "").replace(/\s+/g, " ").trim() === "";
      })
      .map((s) => txt(s.querySelector("h1,h2,h3")));
    return {
      h1, h2Count: h2.length, dupes, shells,
      testBanner: !!Array.from(document.querySelectorAll("*")).find((e) => /TEST PAGE/i.test(e.textContent || "") && e.children.length < 6),
      title: document.title,
      canonical: document.querySelector('link[rel="canonical"]')?.href ?? "(none)",
    };
  });

  const errs = [...consoleErrors, ...pageErrors, ...failedRequests];
  totalDupes += dom.dupes.length;
  totalShells += dom.shells.length;
  totalErrors += errs.length;

  out.push(
    [
      `${name}  ${status}  ${finalUrl}`,
      `  h1: ${dom.h1.join(" | ") || "(none)"}`,
      `  h2 count: ${dom.h2Count}   duplicates: ${dom.dupes.length ? JSON.stringify(dom.dupes) : "none"}`,
      `  empty shells: ${dom.shells.length ? JSON.stringify(dom.shells) : "0"}`,
      `  TEST banner: ${dom.testBanner}   canonical: ${dom.canonical}`,
      `  console/page/network errors: ${errs.length}${errs.length ? "\n    " + errs.slice(0, 6).join("\n    ") : ""}`,
    ].join("\n"),
  );
  await ctx.close();
}
await browser.close();

const report = out.join("\n") + `\n\nTOTALS  duplicate-headings=${totalDupes}  empty-shells=${totalShells}  errors=${totalErrors}\nDONE`;
console.log(report);
writeFileSync(resolve(dir, "live-check.txt"), report + "\n");
