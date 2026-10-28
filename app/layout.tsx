import type { Metadata, Viewport } from "next";
import { Merriweather, Inter, JetBrains_Mono } from "next/font/google";
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

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
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
    canonical: siteConfig.url,
    languages: { "en-IN": siteConfig.url },
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
