// @vitest-environment node
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { TestPageBanner } from "./TestPageBanner";

describe("TestPageBanner", () => {
  it("renders the unmistakable sample-data label", () => {
    const html = renderToStaticMarkup(createElement(TestPageBanner));
    expect(html).toContain("TEST PAGE");
    expect(html).toContain("sample data, not real information");
    expect(html).toContain("test-page-banner");
  });
});
