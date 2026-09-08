import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: "ExamInfo",
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#F8F9FC",
    theme_color: "#1A3C6E",
    orientation: "portrait",
    icons: [
      // Real vector logo (public/icons/icon.svg == public/logo.svg). Scales to
      // any install size. Add raster PNGs (192/512) later only if a target
      // launcher rejects SVG; modern Android/Chrome install SVG fine.
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    categories: ["education", "news"],
    lang: "en-IN",
  };
}
