import { chromium } from "playwright";
const mockUrl = process.env.MOCK_URL;
if (!mockUrl) { console.error("MOCK_URL not set"); process.exit(2); }
const sizes = [{ name: "360", width: 360, height: 800 }, { name: "1366", width: 1366, height: 900 }];
const b = await chromium.launch();
for (const s of sizes) {
  const p = await b.newPage({ viewport: { width: s.width, height: s.height } });
  await p.goto(mockUrl, { waitUntil: "networkidle" });
  const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log("mock", s.name, "overflow=" + ov + "px");
  await p.screenshot({ path: `qa/parity/mock-exam-${s.name}.png`, fullPage: true });
  await p.close();
}
await b.close();
console.log("MOCK SHOTS DONE");
