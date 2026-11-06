/**
 * route.test.ts — /api/search's guards, exercised through the real handler.
 *
 * The five search services are mocked, so what is under test is the ROUTE: that it rejects an
 * over-long query with 400 before touching the database, that it refuses a flooded client with
 * 429 + Retry-After, that a short or missing query keeps its historical empty-200 shape (the
 * header/panel search box depends on that), and that a normal query still returns results.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/services/examService", () => ({ searchExams: vi.fn() }));
vi.mock("@/services/sarkariNaukriService", () => ({ searchSarkariNaukri: vi.fn() }));
vi.mock("@/services/contentPostService", () => ({ searchContentPosts: vi.fn() }));
vi.mock("@/services/blogService", () => ({ searchBlogPosts: vi.fn() }));
vi.mock("@/services/educationNewsService", () => ({ searchEducationNews: vi.fn() }));

import { GET } from "./route";
import { searchExams } from "@/services/examService";
import { searchSarkariNaukri } from "@/services/sarkariNaukriService";
import { searchContentPosts } from "@/services/contentPostService";
import { searchBlogPosts } from "@/services/blogService";
import { searchEducationNews } from "@/services/educationNewsService";
import { MAX_QUERY_LENGTH, RATE_CAPACITY } from "@/lib/api/searchGuard";

const mockedExams = vi.mocked(searchExams);

/** Build a request the way the proxy would deliver it, with a client IP the guard can key on. */
function req(query: string | null, ip = "203.0.113.7"): NextRequest {
  const url = new URL("http://localhost/api/search");
  if (query !== null) url.searchParams.set("q", query);
  return new NextRequest(url.toString(), { headers: { "x-forwarded-for": `${ip}, 10.0.0.1` } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedExams.mockResolvedValue([]);
  vi.mocked(searchSarkariNaukri).mockResolvedValue([]);
  vi.mocked(searchContentPosts).mockResolvedValue([]);
  vi.mocked(searchBlogPosts).mockResolvedValue([]);
  vi.mocked(searchEducationNews).mockResolvedValue([]);
});

describe("/api/search — W1 guards", () => {
  it("a normal query still works, and the header search box is untouched", async () => {
    mockedExams.mockResolvedValue([
      {
        id: "e1", name: "SSC CGL 2026", slug: "ssc-cgl", pillar: "government-exam",
        category: "ssc", conductingBody: "SSC", status: "upcoming", isFeatured: false,
      } as never,
    ]);

    const res = await GET(req("ssc cgl"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.query).toBe("ssc cgl");
    expect(body.results[0].url).toBe("/sarkari-naukri/ssc/ssc-cgl");
    expect(mockedExams).toHaveBeenCalledWith("ssc cgl");
  });

  it("a query over the cap is refused with 400 and never reaches the database", async () => {
    const res = await GET(req("a".repeat(MAX_QUERY_LENGTH + 1)));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("query_too_long");
    expect(body.max).toBe(MAX_QUERY_LENGTH);
    expect(body.message).toContain(String(MAX_QUERY_LENGTH));
    expect(mockedExams, "the guard runs before any Supabase work").not.toHaveBeenCalled();
  });

  it("a query exactly at the cap is allowed", async () => {
    const res = await GET(req("b".repeat(MAX_QUERY_LENGTH)));
    expect(res.status).toBe(200);
    expect(mockedExams).toHaveBeenCalledWith("b".repeat(MAX_QUERY_LENGTH));
  });

  it("a missing or too-short query keeps its historical empty 200 — not a 400", async () => {
    const missing = await GET(req(null));
    expect(missing.status).toBe(200);
    expect((await missing.json()).counts.total).toBe(0);
    expect(mockedExams).not.toHaveBeenCalled();

    const short = await GET(req("a"));
    expect(short.status).toBe(200);
    expect((await short.json()).query).toBe("a");
    expect(mockedExams).not.toHaveBeenCalled();
  });

  it("a flooded client gets 429 with a whole-second Retry-After, and no database work", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < RATE_CAPACITY + 5; i++) {
      const res = await GET(req("ssc cgl", "198.51.100.42"));
      statuses.push(res.status);
    }
    const allowed = statuses.filter((s) => s === 200).length;
    const throttled = statuses.filter((s) => s === 429).length;
    expect(allowed, "the burst is allowed").toBe(RATE_CAPACITY);
    expect(throttled, "what comes after the burst is refused").toBe(5);

    const last = await GET(req("ssc cgl", "198.51.100.42"));
    expect(last.status).toBe(429);
    const retryAfter = Number(last.headers.get("retry-after"));
    expect(Number.isInteger(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect((await last.json()).error).toBe("rate_limited");
  });

  it("one client's burst does not consume another's", async () => {
    for (let i = 0; i < RATE_CAPACITY + 5; i++) await GET(req("ssc cgl", "198.51.100.42"));
    const other = await GET(req("ssc cgl", "198.51.100.99"));
    expect(other.status, "a different IP is unaffected").toBe(200);
  });

  it("a request with no client-IP header is served, not throttled and not pooled", async () => {
    const url = "http://localhost/api/search?q=ssc%20cgl";
    for (let i = 0; i < RATE_CAPACITY + 10; i++) {
      const res = await GET(new NextRequest(url));
      expect(res.status, "fail-open beats a shared anonymous bucket").toBe(200);
    }
  });
});
