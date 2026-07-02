import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { env } from "@/config/env";

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-revalidate-token");

  if (token !== env.REVALIDATE_TOKEN) {
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
