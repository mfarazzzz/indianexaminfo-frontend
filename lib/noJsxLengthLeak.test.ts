/**
 * noJsxLengthLeak.test.ts — lint-style guard for the "renders a literal 0" bug.
 *
 * `{list?.length && <X/>}` prints "0" to the page when the list is empty,
 * because 0 is a renderable React child. The fix is `{!!list?.length && ...}` or
 * a ternary. This test fails if ANY .tsx under app/ or components/ renders a
 * `.length &&` / `count &&` directly into JSX (a `&&` whose left side is a
 * `.length`/`count` and whose right side opens a tag/paren). Negated guards like
 * `if (!x.length && ...) return null;` are logic, not JSX output, and are allowed.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = resolve(__dirname, "..");
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === "node_modules" || name === ".next") continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith(".tsx")) out.push(p);
  }
  return out;
}
// JSX render leak: `.length && <...>` or `.length && (` or `count && <...>`.
// A line already booleanised with `!!` is the FIX, not a leak, so it is skipped.
const LEAK = /\.(?:length|count)\s+&&\s*[<(]/;

describe("no `.length &&` / `count &&` rendered into JSX", () => {
  it("no app/ or components/ .tsx leaks a bare length/count into JSX", () => {
    const files = [...walk(resolve(ROOT, "app")), ...walk(resolve(ROOT, "components"))];
    const offenders: string[] = [];
    for (const f of files) {
      const lines = readFileSync(f, "utf8").split(/\r?\n/);
      lines.forEach((l, i) => {
        if (LEAK.test(l) && !l.includes("!!")) offenders.push(`${f.replace(ROOT, "")}:${i + 1}: ${l.trim().slice(0, 90)}`);
      });
    }
    expect(offenders, "JSX length/count render leaks:\n" + offenders.join("\n")).toEqual([]);
  });
});
