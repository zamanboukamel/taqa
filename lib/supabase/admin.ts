// SERVICE-ROLE Supabase client. Bypasses Row Level Security.
// NEVER import this into a client/browser component — server code only.
// Used by the public player route to look up a player by access_token safely.
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
