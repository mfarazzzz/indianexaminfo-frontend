import type { Metadata, Viewport } from "next";
import { Merriweather, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { TopBar } from "@/components/layout/TopBar";
import { TopProgressBar } from "@/components/layout/TopProgressBar";
import { HeaderWithMenu } from "@/components/layout/HeaderWithMenu";
import { Footer } from "@/components/layout/Footer";
import { BreakingTicker } from "@/components/layout/BreakingTicker";
import { JsonLd } from "@/components/seo/JsonLd";
import { GATag } from "@/components/analytics/GATag";
import { ConsentBanner } from "@/components/analytics/ConsentBanner";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/seo/structured-data";
import { siteConfig } from "@/config/site";
import { env } from "@/config/env";
import { buildStampString } from "@/config/buildInfo";
import { GLOBAL_SHORT_TAIL, getCurrentYear } from "@/lib/seo/keywords";

// ── Fonts via next/font — prevents layout shift, no render-blocking ──────
// F6 (owner batch 3), measured on the production build across the six audited URLs:
//   • the element that paints LAST (LCP) is serif text — the header wordmark and every
//     `font-heading` headline — which renders from Merriweather's latin wght-700 file
//     (95.3 KB). The browser only discovers it after the render-blocking CSS is parsed,
//     so `preload: true` starts the download with the document instead.
//   • preload preloads the files for the DECLARED weights, so 700 is the only weight
//     declared: on the six URLs the 400 file was never downloaded (the two elements that
//     ask for w=400 are the desktop-only variants, not painted at 360px), and every
//     heading on a public page carries an explicit `font-bold`/`font-semibold`, which CSS
//     font matching already resolved to 700. So this removes a face, not a look.
//   • `display: "swap"` stays (no invisible text) and adjustFontFallback stays ON (it is
//     the default): the built CSS ships "Merriweather Fallback", "Inter Fallback" and
//     "JetBrains Mono Fallback" faces with size-adjust/ascent-override, which is what
//     keeps the swap from moving the text.
//   • subsets: ["latin"] only. No Devanagari webfont is downloaded, and none is added: the
//     bilingual headings render from the system serif fallback today (Merriweather has no
//     devanagari subset at all), so adding one would grow the LCP path, not shrink it.
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-merriweather",
  display: "swap",
  preload: true,
});

// L2 (owner batch 5, option a): Inter is now ONE self-hosted variable face, subset locally.
// WHY. `Inter({ subsets: ["latin"] })` did not ship one file: the built CSS declares the latin
// face AND a second slice whose unicode-range covers U+20B9, so every page that renders a rupee
// sign — every fee-bearing exam page — downloaded the 85,272 B (83.3 KiB) latin-ext file on top
// of the 48,432 B latin file (measured batch 4 L1, re-measured as the `l2-before` baseline below:
// 4 font requests / 214 KB on /sarkari-naukri/ssc/ssc-cgl, /admission/engineering/jee-main,
// /sarkari-naukri/banking/ibps-clerk, /admission/engineering/gate).
// WHAT THE FILE IS. public/fonts/inter-iei-latin-rupee.woff2, 46,736 B, sha256
// cd4e38ba1537313dd3d5fe4a598fa2c7d6c33c27102f011b02c5da27b3e2961d: Inter Variable
// 4.001;git-66647c0bb taken from the Google Fonts repository (ofl/inter/Inter[opsz,wght].ttf) —
// the same version string the two slices in production carry today, so no glyph shape changes —
// subset to exactly the 230 codepoints of the shipped latin face PLUS U+20B9 (231 total, 519
// glyphs vs 518 today) and opened only for the feature tags those slices actually ship
// (calt ccmp dnom frac locl numr pnum tnum | kern mark mkmk). opsz is pinned to its default 14
// because the shipped slices carry only the wght axis. Licence: SIL OFL 1.1, verbatim in
// public/fonts/LICENSE-OFL.txt.
// NOT CHANGED: the CSS variable (--font-inter), display: "swap", the 100–900 weight range the
// site already uses, and adjustFontFallback (still the default, so "Inter Fallback" keeps its
// size-adjust metrics and the swap still cannot move text). Hindi still renders from the system
// fallback exactly as before: no Devanagari was added.
const inter = localFont({
  src: "../public/fonts/inter-iei-latin-rupee.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",   // the same variable weight axis the Google face served
});

// PERF-02 fix: load JetBrains Mono via next/font
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const YEAR = getCurrentYear();

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `Indian Exam Info: Sarkari Naukri, Result, Admit Card ${YEAR}`,
    template: `%s | IndianExamInfo`,
  },
  description:
    `IndianExamInfo: Latest sarkari result, admit card, answer key, syllabus ` +
    `for UPSC, SSC, IBPS, NEET, JEE, IGNOU, UP Board, CBSE ${YEAR}. ` +
    `Free study material & mock tests.`,
  keywords: GLOBAL_SHORT_TAIL,
  authors: [{ name: "IndianExamInfo Team" }],
  creator: "IndianExamInfo",
  publisher: "IndianExamInfo Media",
  other: {
    "google-news-publication":  siteConfig.name,
    "application-name":         siteConfig.name,
    "msapplication-TileColor":  "#1A3C6E",
    "msapplication-config":     "/browserconfig.xml",
  },
  verification: { google: env.GSC_VERIFY },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    siteName: "IndianExamInfo",
    locale:   "en_IN",
    type:     "website",
    images:   [{ url: `${siteConfig.url}/api/og?title=${encodeURIComponent("Indian Exam Info: Sarkari Naukri, Result, Admit Card " + YEAR)}&type=default`, width: 1200, height: 630 }],
  },
  alternates: {
    // K1 — NO canonical here. This used to be `canonical: siteConfig.url`, and Next inherits
    // metadata, so EVERY route that did not declare one told Google it was the home page:
    // /sarkari-naukri/state (measured, batch 3 F1), /board-exam/state/up-board and
    // /university-exam/state-university (measured, batch 3 F4) while the sitemap submitted
    // them as their own URLs. A blanket canonical is a silent lie one-level deep, so the
    // root no longer sets one: each route either declares its own (see
    // app/(public)/staticHubCanonical.routes.test.ts, which now enforces it for every route
    // shape) or is noindex and makes no claim. The home page's canonical is set in
    // lib/seo/metadata#buildHomepageMetadata, consumed by app/page.tsx.
    types: {
      "application/rss+xml":  `${siteConfig.url}/api/feed`,
      "application/atom+xml": `${siteConfig.url}/api/feed?format=atom`,
    },
  },
};

export const viewport: Viewport = {
  themeColor:   "#1A3C6E",
  width:        "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-IN"
      className={`${merriweather.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* Build stamp — deployed commit SHA + sync state + build time. Invisible
            to readers; visible in view-source and via curl. Answers "which commit
            is deployed?" without a route. */}
        <meta name="build" content={buildStampString()} />
        <JsonLd data={buildOrganizationSchema()} />
        <JsonLd data={buildWebSiteSchema()} />
        {/* F6: no fonts.googleapis.com preconnect — next/font SELF-HOSTS every family, so
            the audited pages request their fonts from /_next/static/media only (font audit
            2026-10-28: 0 gstatic requests on all six URLs). A preconnect to a host this site
            never contacts costs a needless DNS+TCP+TLS handshake on the critical path. */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className="min-h-screen flex flex-col">

        {/* G6: thin top progress bar for slow-network nav feedback. Fixed to
            the viewport and NOT wrapped in any Suspense/loading boundary, so it
            cannot degrade notFound()/redirect() (see E1/E2). */}
        <TopProgressBar />

        {/* A11Y-01: Skip navigation link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg focus:text-sm focus:font-semibold"
        >
          Skip to main content
        </a>

        <TopBar />
        <BreakingTicker />
        <HeaderWithMenu />

        <main id="main-content" className="flex-1" tabIndex={-1}>
          {children}
        </main>

        <Footer />

        {/* Analytics: consent-gated, default OFF. Nothing loads unless a real GA_ID
            is set AND the reader accepted; with NEXT_PUBLIC_CONSENT_BANNER unset the
            banner never shows and the site is unchanged. */}
        <GATag />
        <ConsentBanner />
      </body>
    </html>
  );
}
