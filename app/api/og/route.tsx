import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * PERF-02: Dynamic OG image generation.
 * Usage: /api/og?title=IBPS PO Admit Card 2027&type=exam
 *
 * Replaces the missing static og-default.jpg with a generated image.
 * Every page that needs a custom OG image should link to this endpoint.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title  = searchParams.get("title")  ?? "IndianExamInfo";
  const sub    = searchParams.get("sub")    ?? "India's Most Trusted Exam Portal";
  const type   = searchParams.get("type")   ?? "default";

  const accentColor =
    type === "result"     ? "#16A34A" :
    type === "admit-card" ? "#D0342C" :
    type === "blog"       ? "#E8630A" :
    "#1A3C6E";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#1A3C6E",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 80px",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Top bar — site name */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "52px", height: "52px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: "22px", fontWeight: "bold",
            }}
          >
            IE
          </div>
          <span style={{ color: "white", fontSize: "28px", fontWeight: "bold" }}>
            IndianExamInfo
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Accent bar */}
          <div style={{ width: "80px", height: "6px", borderRadius: "3px", background: accentColor }} />

          {/* Title */}
          <div
            style={{
              color: "white",
              fontSize: title.length > 60 ? "42px" : "52px",
              fontWeight: "bold",
              lineHeight: 1.2,
              maxWidth: "900px",
            }}
          >
            {title}
          </div>

          {/* Subtitle */}
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "22px" }}>
            {sub}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            paddingTop: "20px",
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "18px" }}>
            www.indianexaminfo.com
          </span>
          <div style={{ display: "flex", gap: "12px" }}>
            {["Sarkari Naukri", "Entrance Exams", "Board & University"].map((pill) => (
              <div
                key={pill}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  borderRadius: "6px",
                  padding: "6px 14px",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "14px",
                }}
              >
                {pill}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      width:  1200,
      height: 630,
    }
  );
}
