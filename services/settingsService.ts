/**
 * settingsService.ts — Reads site settings from Supabase settings table.
 *
 * The CMS manages these via Settings → General / SEO / Appearance tabs.
 * Frontend uses these to render site name, tagline, social links, GA ID etc.
 * Falls back to hardcoded config/site.ts values if DB read fails.
 */

import { createServerClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";

export type SiteSettings = {
  siteName: string;
  tagline: string;
  siteUrl: string;
  description: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  telegramChannel: string;
  whatsappGroup: string;
  youtubeChannel: string;
  twitterHandle: string;
  gaId: string;
  gscVerify: string;
  adsensePublisherId: string;
  adSenseEnabled: boolean;
  directAdsEnabled: boolean;
};

let _cached: SiteSettings | null = null;
let _cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Returns site settings from Supabase (with 5-min in-memory cache). Falls back to config/site.ts defaults. */
export async function getSiteSettings(): Promise<SiteSettings> {
  const now = Date.now();
  if (_cached && now - _cachedAt < CACHE_TTL_MS) {
    return _cached;
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("settings")
      .select("key, value");

    if (error) throw error;

    const map: Record<string, unknown> = {};
    for (const row of data ?? []) {
      map[(row as any).key] = (row as any).value;
    }

    const settings: SiteSettings = {
      siteName: (map["site_name"] as string) || siteConfig.name,
      tagline: (map["site_tagline"] as string) || siteConfig.tagline,
      siteUrl: (map["site_url"] as string) || siteConfig.url,
      description: (map["site_description"] as string) || siteConfig.description,
      logoUrl: (map["logo_url"] as string) || "",
      faviconUrl: (map["favicon_url"] as string) || "",
      primaryColor: (map["primary_color"] as string) || "#E31E24",
      telegramChannel: (map["telegram_channel"] as string) || siteConfig.telegramChannel,
      whatsappGroup: (map["whatsapp_group"] as string) || siteConfig.whatsappGroup,
      youtubeChannel: (map["youtube_channel"] as string) || siteConfig.youtubeChannel,
      twitterHandle: (map["twitter_handle"] as string) || siteConfig.twitterHandle,
      gaId: (map["ga_id"] as string) || "",
      gscVerify: (map["gsc_verify"] as string) || "",
      adsensePublisherId: (map["adsense_publisher_id"] as string) || siteConfig.adsense.publisherId,
      adSenseEnabled: (map["adsense_enabled"] as boolean) ?? false,
      directAdsEnabled: (map["direct_ads_enabled"] as boolean) ?? false,
    };

    _cached = settings;
    _cachedAt = now;
    return settings;
  } catch (err) {
    console.error("[settingsService] getSiteSettings failed, using defaults:", err);
    // Return defaults from config/site.ts
    return {
      siteName: siteConfig.name,
      tagline: siteConfig.tagline,
      siteUrl: siteConfig.url,
      description: siteConfig.description,
      logoUrl: "",
      faviconUrl: "",
      primaryColor: "#E31E24",
      telegramChannel: siteConfig.telegramChannel,
      whatsappGroup: siteConfig.whatsappGroup,
      youtubeChannel: siteConfig.youtubeChannel,
      twitterHandle: siteConfig.twitterHandle,
      gaId: "",
      gscVerify: "",
      adsensePublisherId: siteConfig.adsense.publisherId,
      adSenseEnabled: false,
      directAdsEnabled: false,
    };
  }
}
