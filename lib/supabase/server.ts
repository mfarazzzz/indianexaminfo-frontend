import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";

export function createServerClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
    },
  });
}
