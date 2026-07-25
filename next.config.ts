import type { NextConfig } from "next";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://partner.googleadservices.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https://*.supabase.co https://images.unsplash.com",
  "connect-src 'self' https://*.supabase.co https://www.googletagmanager.com https://www.google-analytics.com",
  "frame-src https://www.googletagmanager.com https://td.doubleclick.net",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  compress: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",   value: "nosniff" },
          { key: "X-Frame-Options",           value: "SAMEORIGIN" },
          { key: "X-XSS-Protection",          value: "1; mode=block" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy",   value: CSP },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
      // Aggressive caching for static JS/CSS (hashed filenames = immutable)
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Cache images and fonts
      {
        source: "/images/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // Legacy redirects
      { source: "/exam/:slug",  destination: "/sarkari-naukri/:slug", permanent: true },
      { source: "/result",      destination: "/results",              permanent: true },
      
      // Fix old hardcoded nav links that pointed to non-existent category slugs
      { source: "/entrance-exam/science-pg/:slug",       destination: "/entrance-exam/engineering/:slug",          permanent: true },
      { source: "/entrance-exam/mba/:slug",              destination: "/entrance-exam/management/:slug",           permanent: true },
      { source: "/entrance-exam/liberal-arts/:slug",     destination: "/entrance-exam/university-entrance/:slug",  permanent: true },
      { source: "/entrance-exam/hotel-management/:slug", destination: "/entrance-exam/university-entrance/:slug",  permanent: true },
      { source: "/entrance-exam/media/:slug",            destination: "/entrance-exam/university-entrance/:slug",  permanent: true },
      
      // Old sarkari-naukri category-only URLs are now handled in [category]/page.tsx with internal redirects.
      
      // Note: /sarkari-naukri/[category]/[slug] is now a valid route (exam entity detail page).
      // Old category-only redirects that have no slug are handled in [category]/page.tsx.
    ];
  },

  experimental: {
    optimizePackageImports: ["@radix-ui", "lucide-react", "date-fns"],
  },

  // Turbopack for faster dev builds (Next.js 15)
  // turbopack: {},
};

export default nextConfig;
