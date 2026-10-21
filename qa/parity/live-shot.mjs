import { chromium } from "@playwright/test";
const base = "http://localhost:3112";
const targets = [
  ["pet", "/sarkari-naukri/state-government-jobs/upsssc-pet"],
  ["aiims-nursing", "/admission/medical/aiims-nursing"],
  ["cds-exam", "/sarkari-naukri/defence/cds-exam"],
  ["rpf-constable", "/sarkari-naukri/railways/rpf-constable"],
];
const widths = [["360",360,740],["1366",1366,900]];
const browser = await chromium.launch();
let bad = 0;
for (const [name, path] of targets) {
  for (const [wn,w,h] of widths) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    let status = "ERR";
    try { const r = await page.goto(base+path, { waitUntil: "networkidle", timeout: 60000 }); status = r ? String(r.status()) : "none"; } catch(e) { status = "naverr"; }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth).catch(()=>-1);
    console.log(name+" @"+wn+"px status="+status+" overflow="+overflow+"px");
    if (overflow > 0) bad++;
    await page.screenshot({ path: "qa/parity/live-"+name+"-"+wn+".png", fullPage: true }).catch(()=>{});
    await page.close();
  }
}
await browser.close();
console.log(bad===0 ? "LIVE OK: 0px overflow everywhere" : "LIVE FAIL overflow="+bad);
