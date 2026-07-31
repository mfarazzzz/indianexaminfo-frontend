import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { env } from "@/config/env";
import { timingSafeEqual } from "crypto";

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
  const token = request.headers.get("x-revalidate-token") ?? "";

  if (!safeTokenCompare(token, env.REVALIDATE_TOKEN)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { path, tag } = body;

    if (tag) {
      revalidateTag(tag);
      return NextResponse.json({ revalidated: true, type: "tag", tag });
    }

    if (path) {
      revalidatePath(path);
      return NextResponse.json({ revalidated: true, type: "path", path });
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

    return NextResponse.json({ revalidated: true, type: "all", paths: criticalPaths });
  } catch (err) {
    return NextResponse.json(
      { error: "Revalidation failed", detail: String(err) },
      { status: 500 }
    );
  }
}
