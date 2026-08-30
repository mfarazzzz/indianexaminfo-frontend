import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { env } from "@/config/env";
import { timingSafeEqual } from "crypto";

/**
 * Allowed cross-origin caller (the CMS). Read from env, never wildcarded —
 * the endpoint mutates cache, so only the admin origin may call it from a browser.
 */
const CMS_ORIGIN = process.env.CMS_ORIGIN ?? "";

/** Build CORS headers for a given request origin, echoing it only if allowed. */
function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && CMS_ORIGIN && origin === CMS_ORIGIN ? origin : "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, x-revalidate-token",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (allow) headers["Access-Control-Allow-Origin"] = allow;
  return headers;
}

/** Preflight handler — browsers send OPTIONS before the cross-origin POST. */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}

/** Timing-safe string comparison to prevent token brute-forcing via timing side-channel */
function safeTokenCompare(a: string, b: string): boolean {
  if (!a || !b) return false;
  try {
    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const cors = corsHeaders(request.headers.get("origin"));
  const token = request.headers.get("x-revalidate-token") ?? "";

  if (!safeTokenCompare(token, env.REVALIDATE_TOKEN)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401, headers: cors });
  }

  try {
    const body = await request.json();
    const { path, tag } = body;

    if (tag) {
      revalidateTag(tag);
      return NextResponse.json({ revalidated: true, type: "tag", tag }, { headers: cors });
    }

    if (path) {
      revalidatePath(path);
      return NextResponse.json({ revalidated: true, type: "path", path }, { headers: cors });
    }

    // Revalidate all key paths
    const criticalPaths = [
      "/",
      "/sarkari-naukri",
      "/sarkari-naukri/exam",
      "/sarkari-naukri/bharti",
      "/entrance-exam",
      "/board-exam",
      "/admit-card",
      "/results",
      "/answer-key",
    ];

    criticalPaths.forEach((p) => revalidatePath(p));

    return NextResponse.json({ revalidated: true, type: "all", paths: criticalPaths }, { headers: cors });
  } catch (err) {
    return NextResponse.json(
      { error: "Revalidation failed", detail: String(err) },
      { status: 500, headers: cors }
    );
  }
}
