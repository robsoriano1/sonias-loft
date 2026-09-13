import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_CONFIGURED } from "@/lib/supabase/config";
import type { Profile, Role } from "@/lib/types";

/* ============================================================================
 *  Who is signed in, and what they are allowed to see.
 *
 *  These helpers are for routing and for not rendering things a person cannot
 *  use. They are NOT the security boundary - row-level security is, and every
 *  owner-only table is scoped to public.is_owner() in migration 002. If one of
 *  these ever returns the wrong answer the worst case is an empty screen, not
 *  a leak.
 * ========================================================================== */

export type CurrentUser = { id: string; email: string | null; role: Role; name: string | null };

export async function currentUser(): Promise<CurrentUser | null> {
  if (!SUPABASE_CONFIGURED) return null;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as Pick<Profile, "role" | "display_name"> | null;

  /* No profile row means migration 002 has not been run yet. Falling back to
     owner keeps the existing single-owner install working exactly as it did
     before the roles migration, rather than locking Sonia out of her own
     dashboard the moment this code deploys. */
  return {
    id: user.id,
    email: user.email ?? null,
    role: profile?.role ?? "owner",
    name: profile?.display_name ?? null,
  };
}

/** For owner-only pages. Sends staff to the one screen they can use. */
export async function requireOwner(): Promise<CurrentUser> {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "owner") redirect("/staff");
  return user;
}

/** For the staff area, which owners can also see. */
export async function requireSignedIn(): Promise<CurrentUser> {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  return user;
}
