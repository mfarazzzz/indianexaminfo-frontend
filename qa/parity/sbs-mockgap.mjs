// sbs-mockgap.mjs — side-by-side mock vs OURS (populated parity fixture) at
// 360 and 1366. Local QA only; PNGs are gitignored in qa/parity.
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const dir = dirname(fileURLToPath(import.meta.url));
const GUTTER = 16, LABEL = 28;

for (const w of ["360", "1366"]) {
  const mockP = resolve(dir, `mock-exam-${w}.png`);
  const oursP = resolve(dir, `parity-rich-${w}.png`);
  const m = await sharp(mockP).metadata();
  const o = await sharp(oursP).metadata();
  const width = m.width + o.width + GUTTER * 3;
  const height = Math.max(m.height, o.height) + LABEL + GUTTER;
  const canvas = sharp({ create: { width, height, channels: 4, background: { r: 241, g: 245, b: 249, alpha: 1 } } });
  const label = (text) => Buffer.from(
    `<svg width="${Math.max(m.width, o.width)}" height="${LABEL}"><text x="6" y="19" font-family="Segoe UI,Arial" font-size="15" font-weight="bold" fill="#334155">${text}</text></svg>`);
  await canvas
    .composite([
      { input: label("MOCK (exam-page-mock.html)"), top: 4, left: GUTTER },
      { input: label("OURS (parity fixture: rich + mock-mirroring updates)"), top: 4, left: GUTTER * 2 + m.width },
      { input: mockP, top: LABEL + GUTTER, left: GUTTER },
      { input: oursP, top: LABEL + GUTTER, left: GUTTER * 2 + m.width },
    ])
    .png()
    .toFile(resolve(dir, `sbs-mockgap-${w}.png`));
  console.log(`sbs-mockgap-${w}.png  mock=${m.width}x${m.height} ours=${o.width}x${o.height}`);
}
console.log("SBS DONE");
