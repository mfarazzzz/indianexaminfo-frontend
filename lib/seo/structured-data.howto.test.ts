/**
 * structured-data.howto.test.ts — 4b: HowTo JSON-LD is emitted ONLY when there
 * are real stored steps; empty / non-array input yields null (never a HowTo with
 * no steps, which Google treats as spam).
 */
import { describe, it, expect } from "vitest";
import { buildHowToSchema } from "./structured-data";

describe("buildHowToSchema", () => {
  it("returns null for no steps", () => {
    expect(buildHowToSchema("x", [])).toBeNull();
    expect(buildHowToSchema("x", undefined)).toBeNull();
    expect(buildHowToSchema("x", "not an array")).toBeNull();
  });
  it("drops blank steps and returns null if nothing real remains", () => {
    expect(buildHowToSchema("x", ["", "  "])).toBeNull();
  });
  it("emits a numbered HowToStep list from real steps", () => {
    const s = buildHowToSchema("PET admit card", ["Visit the site", "Enter registration number", "Download"]) as {
      "@type": string; itemListElement: { "@type": string; position: number; text: string }[];
    };
    expect(s["@type"]).toBe("HowTo");
    expect(s.itemListElement).toHaveLength(3);
    expect(s.itemListElement[0]).toEqual({ "@type": "HowToStep", position: 1, text: "Visit the site" });
    expect(s.itemListElement[2].position).toBe(3);
  });
});
