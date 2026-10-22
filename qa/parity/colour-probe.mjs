import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1366, height: 900 } });
await p.goto("http://localhost:3112/sarkari-naukri/state-government-jobs/upsssc-pet", { waitUntil: "networkidle" });
const out = await p.evaluate(() => {
  const cs = (el, prop) => el ? getComputedStyle(el)[prop] : null;
  const chip = document.querySelector(".exam-chip");
  const notice = document.querySelector(".exam-notice-warn");
  const btn = document.querySelector(".exam-btn-secondary");
  const page = document.querySelector(".exam-page");
  const upd = document.querySelector(".exam-upd");
  const badge = document.querySelector(".exam-date-badge");
  const prog = [...document.querySelectorAll("*")].find((e) => e.children.length === 0 && /EXAM IN PROGRESS/i.test(e.textContent));
  return {
    chip: chip && [chip.textContent.trim(), cs(chip, "backgroundColor"), cs(chip, "color")],
    notice: notice && [cs(notice, "backgroundColor"), cs(notice, "borderColor"), cs(notice, "color")],
    btnSecondary: btn && [cs(btn, "backgroundColor"), cs(btn, "color"), cs(btn, "borderColor"), cs(btn, "borderRadius"), cs(btn, "minHeight")],
    pageBg: cs(page, "backgroundColor"),
    updRail: upd && [cs(upd, "borderLeftWidth"), cs(upd, "borderLeftColor")],
    badge: badge && [badge.textContent.trim(), cs(badge, "backgroundColor"), cs(badge, "color")],
    progress: prog && [prog.className, cs(prog, "color")],
  };
});
console.log(JSON.stringify(out, null, 1));
await b.close();
