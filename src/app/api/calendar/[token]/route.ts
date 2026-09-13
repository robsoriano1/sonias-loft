import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_CONFIGURED } from "@/lib/supabase/config";
import { blockedDaysToEvents, buildIcal, holdsToEvents } from "@/lib/ical";
import { site } from "@/lib/content";
import type { BlockedDate, Hold } from "@/lib/types";

export const dynamic = "force-dynamic";

/* ============================================================================
 *  The iCal feed other calendars subscribe to.
 *
 *  This is the one thing in the app that has to be reachable without a
 *  session - Airbnb's crawler has no cookies - so it is guarded by a secret
 *  in the path instead. Set ICAL_TOKEN in Vercel to a long random string;
 *  with it unset the feed stays off entirely rather than defaulting to open.
 *
 *  Only confirmed stays and hand-blocked days go out. Tentative holds are
 *  left off on purpose: blocking a night elsewhere for an enquiry that may
 *  never firm up costs real bookings.
 * ========================================================================== */
export async function GET(
  _request: Request,
  { params }: { params: { token: string } },
) {
  const expected = process.env.ICAL_TOKEN;

  if (!expected) {
    return new NextResponse("Calendar sharing is switched off.", { status: 404 });
  }

  if (params.token !== expected) {
    return new NextResponse("Not found.", { status: 404 });
  }

  if (!SUPABASE_CONFIGURED) {
    return new NextResponse("Not configured.", { status: 503 });
  }

  const supabase = createClient();

  const [holdRes, blockedRes] = await Promise.all([
    supabase.from("holds").select("*").eq("status", "confirmed"),
    supabase.from("blocked_dates").select("day"),
  ]);

  const holds = (holdRes.data as Hold[] | null) ?? [];
  const blocked = ((blockedRes.data as Pick<BlockedDate, "day">[] | null) ?? []).map((r) => r.day);

  const body = buildIcal(
    [...holdsToEvents(holds, site.name), ...blockedDaysToEvents(blocked)],
    `${site.name} availability`,
  );

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="sonias-loft.ics"`,
      // Channels poll this every few hours; a short cache keeps them honest
      // without hammering the database.
      "Cache-Control": "public, max-age=900, s-maxage=900",
    },
  });
}
