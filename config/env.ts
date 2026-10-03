/**
 * env.ts — Environment variable validation.
 *
 * Uses a soft-fail approach: warns loudly in dev, warns in production builds
 * but does NOT throw — throwing during `next build` breaks static generation
 * even when the app will have real env vars at runtime (e.g. on Vercel/PM2).
 *
 * Real validation at runtime: the Supabase client will fail with a clear
 * message if it receives an empty URL, which is the correct place to fail.
 */

const PLACEHOLDER_PATTERNS = [
  "your-project.supabase.co",
  "your-anon-key",
  "your-secret",
  "xxxxxxxxxx",
  "placeholder",
];

function isPlaceholder(val: string): boolean {
  const lower = val.toLowerCase();
  return PLACEHOLDER_PATTERNS.some((p) => lower.includes(p));
}

function readEnv(key: string): string {
  const val = process.env[key] ?? "";

  if (!val || isPlaceholder(val)) {
    const msg =
      `[IndianExamInfo] Warning: environment variable "${key}" is missing or still a placeholder. ` +
      `Set a real value in .env.local (development) or your hosting provider (production).`;
    // Always warn — never throw during build, because Next.js runs `next build`
    // with NODE_ENV=production even on a dev machine.
    console.warn(msg);
    return "";
  }

  return val;
}

/**
 * readIntEnv — parse a non-negative integer build/runtime knob.
 *
 * Unset/blank falls back to the default. A non-integer or negative value is
 * warned about (never thrown — same build-safety rule as readEnv) and falls
 * back to the default. `0` is a legal, meaningful value (means "none").
 */
function readIntEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) {
    console.warn(
      `[IndianExamInfo] Warning: environment variable "${key}"="${raw}" is not a non-negative integer; using ${fallback}.`,
    );
    return fallback;
  }
  return n;
}

export const env = {
  SUPABASE_URL:      readEnv("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON_KEY: readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  REVALIDATE_TOKEN:  process.env.REVALIDATE_TOKEN ?? "",   // server-only
  GA_ID:             process.env.NEXT_PUBLIC_GA_ID ?? "",
  GSC_VERIFY:        process.env.NEXT_PUBLIC_GSC_VERIFY ?? "",
  /**
   * BUILD_PRERENDER_LIMIT — how many records each dynamic route prerenders at
   * build time (the deliberate "hot set"). Everything else is generated on
   * first request and cached by ISR (dynamicParams stays true). Server-only:
   * read at build, never shipped to the client. Default 20; 0 = prerender none
   * (fully on-demand). Lowering this is the primary lever against build-time
   * request stampedes against Supabase.
   */
  BUILD_PRERENDER_LIMIT: readIntEnv("BUILD_PRERENDER_LIMIT", 20),
} as const;
