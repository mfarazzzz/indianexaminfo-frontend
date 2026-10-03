import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";
import { fetchWithRetry } from "./fetchWithRetry";

/**
 * createServerClient — returns a Supabase client for server-side use.
 *
 * Returns a no-op stub when credentials are not configured (e.g. during
 * `next build` on a machine without real env vars). All service functions
 * already wrap calls in try/catch and return empty arrays on error, so the
 * site builds and renders gracefully with empty data until credentials are set.
 */
export function createServerClient() {
  // If credentials are missing we still return a client — the @supabase/supabase-js
  // constructor accepts empty strings and will fail at query time, which our
  // service-layer try/catch handles gracefully.
  const url = env.SUPABASE_URL || "https://placeholder.supabase.co";
  const key = env.SUPABASE_ANON_KEY || "placeholder-key";

  return createClient(url, key, {
    auth: { persistSession: false },
    // Route every read through a retry-aware fetch: transient Cloudflare 5xx
    // (522/525 …) on the Supabase edge are retried for GET/HEAD only, so one
    // blip no longer aborts a whole page's prerender. See fetchWithRetry.ts.
    global: { fetch: fetchWithRetry },
  });
}
