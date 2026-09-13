import "server-only";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_CONFIGURED } from "@/lib/supabase/config";
import type {
  BlockedDate,
  Hold,
  Incident,
  Inquiry,
  Profile,
  RateRule,
  Settings,
  Turnover,
} from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { CONTENT_DEFAULTS, resolveContent, type EditableContent } from "@/lib/content-db";

/* ============================================================================
 *  One place that reads the owner's data.
 *
 *  Every admin page needs an overlapping slice of the same five tables, so
 *  they are fetched together in one round trip and the pages pick what they
 *  need. A failure anywhere degrades to empty data plus a message rather than
 *  an error screen - a half-loaded dashboard is more useful than none.
 * ========================================================================== */

export type AdminData = {
  inquiries: Inquiry[];
  holds: Hold[];
  blockedDays: string[];
  settings: Settings;
  rateRules: RateRule[];
  error: string;
};

const NOT_CONFIGURED =
  "Supabase is not configured. Copy .env.local.example to .env.local, add your project URL and anon key, then restart the dev server.";

const READ_FAILED =
  "Could not read from the database. Check that supabase/schema.sql and supabase/migrations/001_admin_rebuild.sql have both been run in the SQL Editor.";

export async function loadAdminData(): Promise<AdminData> {
  const empty: AdminData = {
    inquiries: [],
    holds: [],
    blockedDays: [],
    settings: DEFAULT_SETTINGS,
    rateRules: [],
    error: "",
  };

  if (!SUPABASE_CONFIGURED) return { ...empty, error: NOT_CONFIGURED };

  const supabase = createClient();

  const [inquiryRes, holdRes, blockedRes, settingsRes, ratesRes] = await Promise.all([
    supabase.from("inquiries").select("*").order("created_at", { ascending: false }),
    supabase.from("holds").select("*").order("check_in", { ascending: true }),
    supabase.from("blocked_dates").select("*"),
    supabase.from("settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("rate_rules").select("*").order("priority", { ascending: false }),
  ]);

  const failed = [inquiryRes, holdRes, blockedRes, ratesRes].some((r) => r.error);

  return {
    inquiries: (inquiryRes.data as Inquiry[] | null) ?? [],
    holds: (holdRes.data as Hold[] | null) ?? [],
    blockedDays: ((blockedRes.data as BlockedDate[] | null) ?? []).map((row) => row.day),
    settings: (settingsRes.data as Settings | null) ?? DEFAULT_SETTINGS,
    rateRules: (ratesRes.data as RateRule[] | null) ?? [],
    error: failed ? READ_FAILED : "",
  };
}

/* Everyone who can sign in. The email lives in auth.users, which is not
   reachable with the anon key, so the list shows whatever name has been set
   and falls back to a short id - enough to tell two people apart without
   needing the service-role key just to render a settings panel. */
export async function loadPeople(): Promise<Profile[]> {
  if (!SUPABASE_CONFIGURED) return [];

  const { data } = await createClient()
    .from("profiles")
    .select("*")
    .order("role", { ascending: true })
    .order("created_at", { ascending: true });

  return (data as Profile[] | null) ?? [];
}

/** Turnovers the staff have flagged, for the owner's dashboard. */
export async function loadFlaggedTurnovers(): Promise<Turnover[]> {
  if (!SUPABASE_CONFIGURED) return [];

  const { data } = await createClient()
    .from("turnovers")
    .select("*")
    .eq("damage_found", true)
    .order("due_on", { ascending: false });

  return (data as Turnover[] | null) ?? [];
}

/** Owner-edited content, folded over the defaults in src/lib/content.ts. */
export async function loadEditableContent(): Promise<EditableContent> {
  if (!SUPABASE_CONFIGURED) return CONTENT_DEFAULTS;

  try {
    const { data } = await createClient().from("content_blocks").select("key, value");
    return resolveContent((data as { key: string; value: unknown }[] | null) ?? []);
  } catch {
    // A missing table means migration 002 has not run. The site ships with
    // its own content, so this is a non-event.
    return CONTENT_DEFAULTS;
  }
}

/** One stay plus everything hanging off it, for the booking detail page. */
export async function loadHold(id: string): Promise<{
  hold: Hold | null;
  inquiry: Inquiry | null;
  incidents: Incident[];
  settings: Settings;
}> {
  if (!SUPABASE_CONFIGURED) {
    return { hold: null, inquiry: null, incidents: [], settings: DEFAULT_SETTINGS };
  }

  const supabase = createClient();

  const [holdRes, incidentRes, settingsRes] = await Promise.all([
    supabase.from("holds").select("*").eq("id", id).maybeSingle(),
    supabase.from("incidents").select("*").eq("hold_id", id).order("created_at"),
    supabase.from("settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  const hold = (holdRes.data as Hold | null) ?? null;

  let inquiry: Inquiry | null = null;
  if (hold?.inquiry_id) {
    const { data } = await supabase
      .from("inquiries")
      .select("*")
      .eq("id", hold.inquiry_id)
      .maybeSingle();
    inquiry = (data as Inquiry | null) ?? null;
  }

  return {
    hold,
    inquiry,
    incidents: (incidentRes.data as Incident[] | null) ?? [],
    settings: (settingsRes.data as Settings | null) ?? DEFAULT_SETTINGS,
  };
}
