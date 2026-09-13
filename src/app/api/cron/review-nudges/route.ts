import { NextResponse } from "next/server";
import { createAdminClient, SERVICE_ROLE_CONFIGURED } from "@/lib/supabase/admin";
import { guestReviewRequestEmail, MAIL_CONFIGURED, sendEmail } from "@/lib/notify";
import { DEFAULT_SETTINGS, type Hold, type Settings } from "@/lib/types";
import { addDays, todayKey } from "@/lib/dates";

export const dynamic = "force-dynamic";

/* ============================================================================
 *  Post-checkout review nudge, sent once per stay.
 *
 *  Runs daily from vercel.json. Picks up stays that checked out in the last
 *  few days and have not been nudged yet - a window rather than "yesterday
 *  exactly", so a missed run catches up instead of silently skipping people.
 *
 *  The unique index on guest_messages (hold_id, kind) is what actually
 *  guarantees one nudge per stay; the query below is just the cheap path.
 * ========================================================================== */

const LOOKBACK_DAYS = 4;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  // Vercel sends the secret as a bearer token. Without one configured the job
  // stays off rather than running for anyone who finds the URL.
  if (!secret) {
    return NextResponse.json({ skipped: "CRON_SECRET is not set." }, { status: 404 });
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Not found.", { status: 404 });
  }

  if (!SERVICE_ROLE_CONFIGURED) {
    return NextResponse.json(
      { skipped: "SUPABASE_SERVICE_ROLE_KEY is not set." },
      { status: 503 },
    );
  }

  if (!MAIL_CONFIGURED) {
    return NextResponse.json({ skipped: "RESEND_API_KEY is not set." }, { status: 503 });
  }

  const supabase = createAdminClient();
  const today = todayKey();
  const since = addDays(today, -LOOKBACK_DAYS);

  const [holdRes, sentRes, settingsRes] = await Promise.all([
    supabase
      .from("holds")
      .select("*")
      .eq("status", "confirmed")
      .gte("check_out", since)
      .lte("check_out", today),
    supabase.from("guest_messages").select("hold_id").eq("kind", "review_request"),
    supabase.from("settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  const holds = (holdRes.data as Hold[] | null) ?? [];
  const alreadyNudged = new Set(
    ((sentRes.data as { hold_id: string }[] | null) ?? []).map((r) => r.hold_id),
  );
  const settings = (settingsRes.data as Settings | null) ?? DEFAULT_SETTINGS;

  const due = holds.filter((hold) => !alreadyNudged.has(hold.id) && hold.inquiry_id);

  let sent = 0;
  const failures: string[] = [];

  for (const hold of due) {
    const { data: inquiry } = await supabase
      .from("inquiries")
      .select("email")
      .eq("id", hold.inquiry_id as string)
      .maybeSingle();

    const to = (inquiry as { email: string } | null)?.email;
    if (!to) continue;

    const { subject, html } = guestReviewRequestEmail(hold, settings);
    const result = await sendEmail({ to, subject, html });

    // Recorded either way: a row with sent_at null is a visible failure, and
    // it also stops the job retrying the same broken address every morning.
    await supabase.from("guest_messages").upsert(
      {
        hold_id: hold.id,
        kind: "review_request",
        to_email: to,
        sent_at: result.ok ? new Date().toISOString() : null,
        error: result.ok ? null : result.error,
      },
      { onConflict: "hold_id,kind" },
    );

    if (result.ok) sent += 1;
    else failures.push(`${hold.guest_name}: ${result.error}`);
  }

  return NextResponse.json({ considered: due.length, sent, failures });
}
