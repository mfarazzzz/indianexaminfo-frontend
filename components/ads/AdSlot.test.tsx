/**
 * AdSlot.test.tsx — owner batch 8, Phase E1.
 *
 * THE CLAIM BEING PINNED
 *
 *   With no real AdSense publisher id configured, an ad slot renders NOTHING —
 *   no `<ins class="adsbygoogle">`, no reserved box, no wrapper div.
 *
 * WHY IT MATTERS. The file used to fall back to the hard-coded string
 * "ca-pub-XXXXXXXXXX" (components/ads/AdSlot.tsx) and config/site.ts carried the
 * same placeholder. That is not a publisher id, it is a note to the developer —
 * but the component treated it as one, so every page with an ad slot shipped an
 * `<ins>` element and RESERVED 300x250 / 728x90 pixels for an ad network that
 * can never fill them: a grey hole on every page, and a layout that reserved
 * space for nothing.
 *
 * The rules, in one place:
 *   • an EMPTY publisher id, or the placeholder shape (`ca-pub-X+`), means
 *     "AdSense is off" → render nothing;
 *   • a REAL publisher id → the `<ins>` element is rendered as before;
 *   • a CMS direct creative (our own content, not AdSense's) still renders even
 *     with no publisher id — the rule is about AdSense, not about ads.
 *
 * Rendered with renderToStaticMarkup: the frontend suite runs in node with no
 * jsdom, and the thing under test is the MARKUP (what a crawler and a reader
 * get), not a DOM.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { AdSlot, isRealPublisherId, resolvePublisherId } from "./AdSlot";

const ORIGINAL = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

function setEnv(value: string | undefined) {
  if (value === undefined) delete process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
  else process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID = value;
}

/** The markup a reader/crawler actually receives for one slot. */
function render(props: Partial<Parameters<typeof AdSlot>[0]> = {}): string {
  return renderToStaticMarkup(<AdSlot position="content-hub-top" size="728x90" {...props} />);
}

beforeEach(() => setEnv(undefined));
afterEach(() => setEnv(ORIGINAL));

describe("which publisher ids count as real", () => {
  it("an empty id and the placeholder shape are NOT real publisher ids", () => {
    expect(isRealPublisherId("")).toBe(false);
    expect(isRealPublisherId("   ")).toBe(false);
    expect(isRealPublisherId(null)).toBe(false);
    expect(isRealPublisherId(undefined)).toBe(false);
    expect(isRealPublisherId("ca-pub-XXXXXXXXXX")).toBe(false);
    expect(isRealPublisherId("ca-pub-xxxxxx")).toBe(false);
    expect(isRealPublisherId("CA-PUB-XXXX")).toBe(false);
  });

  it("a real publisher id is real", () => {
    expect(isRealPublisherId("ca-pub-1234567890123456")).toBe(true);
    expect(isRealPublisherId("ca-pub-1234567890123456 ")).toBe(true);
  });

  it("the resolution chain is prop → env → site config, and site config is EMPTY by default", () => {
    setEnv("ca-pub-envvalue");
    expect(resolvePublisherId("ca-pub-propvalue")).toBe("ca-pub-propvalue");
    expect(resolvePublisherId()).toBe("ca-pub-envvalue");
    setEnv(undefined);
    expect(resolvePublisherId()).toBe("");   // config/site.ts default is now ""
  });
});

describe("no configured publisher id → the slot renders NOTHING", () => {
  it("renders no markup at all when the env var is absent", () => {
    const html = render();
    expect(html).toBe("");
    expect(html).not.toContain("adsbygoogle");
    expect(html).not.toContain("<ins");
  });

  it("renders no markup at all with the placeholder publisher id", () => {
    setEnv("ca-pub-XXXXXXXXXX");
    const html = render();
    expect(html).toBe("");
    expect(html).not.toContain("adsbygoogle");
    expect(html).not.toContain("<ins");
  });

  it("renders no markup at all when the placeholder arrives as the CMS/settings value", () => {
    const html = render({ adsensePublisherId: "ca-pub-XXXXXXXXXX" });
    expect(html).toBe("");
    expect(html).not.toContain("adsbygoogle");
  });

  it("reserves no space either — there is no wrapper div left behind", () => {
    // A reserved box is the whole problem: an empty div with minHeight is a
    // permanent hole in the page. Nothing at all must be emitted.
    expect(render()).not.toContain("data-ad-slot");
    expect(render()).not.toContain("minHeight");
  });
});

describe("a real publisher id still works exactly as before", () => {
  it("renders the <ins> element with the configured client id", () => {
    setEnv("ca-pub-1234567890123456");
    const html = render();
    expect(html).toContain("adsbygoogle");
    expect(html).toContain('data-ad-client="ca-pub-1234567890123456"');
  });

  it("hideWhenEmpty still collapses the slot when there is no creative", () => {
    setEnv("ca-pub-1234567890123456");
    expect(render({ hideWhenEmpty: true })).toBe("");
  });
});

describe("a CMS direct creative is our own content and is never suppressed", () => {
  it("renders the creative even with no publisher id at all", () => {
    const html = render({
      creative: { id: "c1", type: "html", htmlCode: "<p>Our own banner</p>", linkUrl: "https://example.com" },
    });
    expect(html).toContain("Our own banner");
    expect(html).not.toContain("adsbygoogle");
  });
});

describe("the /results page (the 'Job listing / result' surface) ships no ad markup", () => {
  it("renders the two slots /results uses, with no ad markup and no reserved box", () => {
    // These are the exact two slots app/(public)/results/page.tsx renders.
    for (const props of [
      { position: "content-hub-top", size: "728x90" as const },
      { position: "article-sidebar", size: "300x250" as const },
    ]) {
      const html = render(props);
      expect(html, `${props.position} must render nothing`).toBe("");
      expect(html).not.toContain("adsbygoogle");
      expect(html).not.toContain("<ins");
    }
  });
});
