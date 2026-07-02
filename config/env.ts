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

export const env = {
  SUPABASE_URL:      readEnv("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON_KEY: readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  REVALIDATE_TOKEN:  process.env.REVALIDATE_TOKEN ?? "",   // server-only
  GA_ID:             process.env.NEXT_PUBLIC_GA_ID ?? "",
  GSC_VERIFY:        process.env.NEXT_PUBLIC_GSC_VERIFY ?? "",
} as const;
