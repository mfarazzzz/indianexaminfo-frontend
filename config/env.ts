/**
 * SEC-03: Validate env vars at startup instead of using non-null assertions.
 * NEXT_PUBLIC_ vars are always available at build time.
 * Server-only vars (REVALIDATE_TOKEN) only exist server-side.
 */

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    // In production builds, missing vars should hard-fail early
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `[IndianExamInfo] Missing required environment variable: ${key}. ` +
        `Check your .env.local or hosting environment settings.`
      );
    }
    // In development, warn but allow placeholder so dev server starts
    console.warn(`[IndianExamInfo] Warning: Missing env var "${key}". Using empty fallback.`);
    return "";
  }
  return val;
}

export const env = {
  SUPABASE_URL:      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON_KEY: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  REVALIDATE_TOKEN:  process.env.REVALIDATE_TOKEN ?? "",   // server-only — no requireEnv for client safety
  GA_ID:             process.env.NEXT_PUBLIC_GA_ID ?? "",
  GSC_VERIFY:        process.env.NEXT_PUBLIC_GSC_VERIFY ?? "",
} as const;
