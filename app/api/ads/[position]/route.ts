/**
 * GET /api/ads/[position]
 *
 * Returns the currently active ad creative for a given ad zone position.
 * The CMS manages zones → campaigns → creatives. This API finds the best
 * matching active creative for the requested position.
 *
 * Response: AdCreative JSON or 404 if no active ad.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "edge";
export const revalidate = 300; // cache for 5 minutes

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ position: string }> }
) {
  const { position } = await params;

  try {
    const supabase = createServerClient();

    // 1. Find the ad zone matching this position
    const { data: zone } = await supabase
      .from("ad_zones")
      .select("id, slug")
      .or(`slug.eq.${position},position.eq.${position}`)
      .eq("is_active", true)
      .maybeSingle();

    if (!zone) {
      return NextResponse.json(null, { status: 404 });
    }

    const today = new Date().toISOString().split("T")[0];

    // 2. Find an active campaign targeting this zone
    const { data: campaign } = await supabase
      .from("ad_campaigns")
      .select("id")
      .eq("status", "active")
      .contains("target_zones", [(zone as any).id])
      .or(`start_date.is.null,start_date.lte.${today}`)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order("impressions", { ascending: true }) // serve least-served first (basic rotation)
      .limit(1)
      .maybeSingle();

    if (!campaign) {
      return NextResponse.json(null, { status: 404 });
    }

    // 3. Get an active creative for this campaign
    const { data: creative } = await supabase
      .from("ad_creatives")
      .select("id, type, image_url, html_code, link_url, alt_text")
      .eq("campaign_id", (campaign as any).id)
      .eq("is_active", true)
      .order("impressions", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!creative) {
      return NextResponse.json(null, { status: 404 });
    }

    // 4. Return the creative data
    const result = {
      id: (creative as any).id,
      type: (creative as any).type,
      imageUrl: (creative as any).image_url ?? null,
      htmlCode: (creative as any).html_code ?? null,
      linkUrl: (creative as any).link_url,
      altText: (creative as any).alt_text ?? null,
    };

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("[ads] GET /api/ads/:position failed:", err);
    return NextResponse.json(null, { status: 500 });
  }
}
