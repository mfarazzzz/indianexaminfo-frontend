import type { Metadata, Viewport } from "next";
import { Merriweather, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { TopBar } from "@/components/layout/TopBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BreakingTicker } from "@/components/layout/BreakingTicker";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/seo/structured-data";
import { siteConfig } from "@/config/site";
import { env } from "@/config/env";
import { GLOBAL_SHORT_TAIL, getCurrentYear } from "@/lib/seo/keywords";

// ── Fonts via next/font — prevents layout shift, no render-blocking ──────
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-merriweather",
  display: "swap",
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
    default: `IndianExamInfo — Sarkari Result, Admit Card, Exam ${YEAR}`,
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
    images:   [{ url: `${siteConfig.url}/api/og?title=${encodeURIComponent("IndianExamInfo — Sarkari Result, Admit Card, Exam " + YEAR)}&type=default`, width: 1200, height: 630 }],
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
        <JsonLd data={buildOrganizationSchema()} />
        <JsonLd data={buildWebSiteSchema()} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className="min-h-screen flex flex-col">

        {/* A11Y-01: Skip navigation link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg focus:text-sm focus:font-semibold"
        >
          Skip to main content
        </a>

        <TopBar />
        <BreakingTicker />
        <Header />

        <main id="main-content" className="flex-1 animate-fade-in" tabIndex={-1}>
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
