import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

const BASE = siteConfig.url;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // General crawlers
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/search"],
      },
      // Google News — allow all editorial + exam content
      {
        userAgent: "Googlebot-News",
        allow: ["/blog/", "/sarkari-naukri/", "/entrance-exam/", "/board-exam/"],
        disallow: ["/api/", "/admin/", "/search", "/about", "/contact", "/privacy-policy", "/disclaimer"],
      },
      // AdsBot — allow all
      {
        userAgent: "AdsBot-Google",
        allow: "/",
      },
      // AdsBot mobile — allow all
      {
        userAgent: "AdsBot-Google-Mobile",
        allow: "/",
      },
    ],
    sitemap: [
      `${BASE}/sitemap.xml`,
      `${BASE}/api/sitemap-index`,
    ],
    host: BASE,
  };
}
