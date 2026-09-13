import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

/* ============================================================================
 *  Service-role client. Bypasses row-level security.
 *
 *  Exactly one caller: the scheduled job that sends review nudges after
 *  checkout. That job runs with nobody signed in, so it cannot use the
 *  session-scoped client, and the tables it touches are owner-only by design.
 *
 *  Never import this from a component, a page, or anything reachable from a
 *  request the public can make. If a second caller ever needs it, that is a
 *  sign the job should move behind a narrow security-definer function instead.
 * ========================================================================== */

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const SERVICE_ROLE_CONFIGURED = Boolean(SERVICE_KEY);

export function createAdminClient() {
  if (!SERVICE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  }

  return createSupabaseClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
