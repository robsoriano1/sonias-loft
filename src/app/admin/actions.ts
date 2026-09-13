"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { statusPatch } from "@/lib/pipeline";
import { validateStay, canConfirm } from "@/lib/availability";
import { parseIcal } from "@/lib/ical";
import {
  guestConfirmationEmail,
  guestReviewRequestEmail,
  MAIL_CONFIGURED,
  sendEmail,
} from "@/lib/notify";
import { DEFAULT_SETTINGS } from "@/lib/types";
import type {
  Hold,
  HoldStatus,
  IncidentKind,
  IncidentStatus,
  Inquiry,
  InquiryStatus,
  Settings,
} from "@/lib/types";

/* Every action re-checks the session. The middleware already guards the
   routes, but actions are their own endpoints - guard them too. */
async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return supabase;
}

/** Admin pages all read the same data, so they all need refreshing together. */
function refreshAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/enquiries");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/settings");
}

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

/* ==========================================================================
 *  Phase 1 - enquiries
 * ======================================================================== */

export async function setInquiryStatus(id: string, status: InquiryStatus): Promise<ActionResult> {
  const supabase = await requireUser();

  const { data } = await supabase
    .from("inquiries")
    .select("status, first_reply_at")
    .eq("id", id)
    .maybeSingle();

  if (!data) return { ok: false, error: "That enquiry no longer exists." };

  // Stamps first_reply_at the first time it leaves 'new', and never moves it.
  const patch = statusPatch(data as Pick<Inquiry, "status" | "first_reply_at">, status);

  const { error } = await supabase.from("inquiries").update(patch).eq("id", id);
  if (error) return { ok: false, error: "Could not save that status." };

  refreshAdmin();
  return { ok: true };
}

export async function deleteInquiry(id: string): Promise<ActionResult> {
  const supabase = await requireUser();
  const { error } = await supabase.from("inquiries").delete().eq("id", id);
  if (error) return { ok: false, error: "Could not delete that enquiry." };
  refreshAdmin();
  return { ok: true };
}

/* ==========================================================================
 *  Phase 2 - calendar, holds
 * ======================================================================== */

/** Toggle one day between blocked and available. */
export async function toggleBlockedDate(day: string, currentlyBlocked: boolean) {
  const supabase = await requireUser();

  if (currentlyBlocked) {
    await supabase.from("blocked_dates").delete().eq("day", day);
  } else {
    await supabase.from("blocked_dates").upsert({ day }, { onConflict: "day" });
  }

  refreshAdmin();
  revalidatePath("/");
}

/** Block or clear a whole range at once - used by the "Block range" control. */
export async function setBlockedRange(days: string[], blocked: boolean) {
  if (days.length === 0) return;
  const supabase = await requireUser();

  if (blocked) {
    await supabase.from("blocked_dates").upsert(
      days.map((day) => ({ day })),
      { onConflict: "day" },
    );
  } else {
    await supabase.from("blocked_dates").delete().in("day", days);
  }

  refreshAdmin();
  revalidatePath("/");
}

async function readRules(supabase: Awaited<ReturnType<typeof requireUser>>) {
  const [holdRes, blockedRes, settingsRes] = await Promise.all([
    supabase.from("holds").select("*"),
    supabase.from("blocked_dates").select("day"),
    supabase.from("settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  return {
    holds: ((holdRes.data as Hold[] | null) ?? []),
    blockedDays: ((blockedRes.data as { day: string }[] | null) ?? []).map((r) => r.day),
    settings: (settingsRes.data as Settings | null) ?? DEFAULT_SETTINGS,
  };
}

export type HoldInput = {
  id?: string;
  inquiryId?: string | null;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: HoldStatus;
  rateTotal?: string;
  note?: string;
  /** Save anyway despite soft problems the owner has seen and accepted. */
  force?: boolean;
};

/* Creating or editing a stay is the one write that can quietly break a
   promise to a guest, so the rules run here rather than only in the UI. */
export async function saveHold(input: HoldInput): Promise<ActionResult> {
  const supabase = await requireUser();

  if (!input.guestName.trim()) return { ok: false, error: "The stay needs a guest name." };

  const { holds, blockedDays, settings } = await readRules(supabase);

  const problems = validateStay({
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    holds,
    blockedDays,
    settings,
    ignoreHoldId: input.id,
    intent: input.status === "confirmed" ? "confirmed" : "tentative",
  });

  if (!canConfirm(problems)) {
    return { ok: false, error: problems.filter((p) => p.severity === "hard")[0].message };
  }

  if (!input.force && problems.length > 0) {
    return { ok: false, error: problems.map((p) => p.message).join(" ") };
  }

  const row = {
    inquiry_id: input.inquiryId ?? null,
    guest_name: input.guestName.trim(),
    check_in: input.checkIn,
    check_out: input.checkOut,
    status: input.status,
    rate_total: input.rateTotal ? Number(input.rateTotal) : null,
    note: input.note?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = input.id
    ? await supabase.from("holds").update(row).eq("id", input.id).select().maybeSingle()
    : await supabase.from("holds").insert(row).select().maybeSingle();

  if (error || !data) return { ok: false, error: "Could not save that stay." };

  refreshAdmin();
  revalidatePath("/");

  // Confirming is the moment the guest should hear from us.
  if (input.status === "confirmed") {
    await sendConfirmationIfNeeded(data as Hold);
  }

  return { ok: true };
}

export async function setHoldStatus(id: string, status: HoldStatus): Promise<ActionResult> {
  const supabase = await requireUser();

  const { data: existing } = await supabase.from("holds").select("*").eq("id", id).maybeSingle();
  if (!existing) return { ok: false, error: "That stay no longer exists." };

  const hold = existing as Hold;

  if (status === "confirmed") {
    const { holds, blockedDays, settings } = await readRules(supabase);
    const problems = validateStay({
      checkIn: hold.check_in,
      checkOut: hold.check_out,
      holds,
      blockedDays,
      settings,
      ignoreHoldId: id,
      intent: "confirmed",
    });

    if (!canConfirm(problems)) {
      return { ok: false, error: problems.filter((p) => p.severity === "hard")[0].message };
    }
  }

  const { error } = await supabase
    .from("holds")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: "Could not update that stay." };

  refreshAdmin();
  revalidatePath("/");

  if (status === "confirmed") await sendConfirmationIfNeeded({ ...hold, status });

  return { ok: true };
}

export async function deleteHold(id: string): Promise<ActionResult> {
  const supabase = await requireUser();
  const { error } = await supabase.from("holds").delete().eq("id", id);
  if (error) return { ok: false, error: "Could not delete that stay." };
  refreshAdmin();
  revalidatePath("/");
  return { ok: true };
}

/** Turn an enquiry into a tentative hold, carrying its dates across. */
export async function holdFromInquiry(inquiryId: string): Promise<ActionResult> {
  const supabase = await requireUser();

  const { data } = await supabase.from("inquiries").select("*").eq("id", inquiryId).maybeSingle();
  if (!data) return { ok: false, error: "That enquiry no longer exists." };

  const inquiry = data as Inquiry;
  if (!inquiry.check_in || !inquiry.check_out) {
    return { ok: false, error: "That enquiry has no dates to hold. Add the stay by hand instead." };
  }

  return saveHold({
    inquiryId: inquiry.id,
    guestName: inquiry.name,
    checkIn: inquiry.check_in,
    checkOut: inquiry.check_out,
    status: "tentative",
    force: true, // the owner is looking at the conflicts already
  });
}

/* Pull an external channel's calendar in. Events already imported from the
   same feed are matched on their UID so re-running this updates rather than
   duplicates, and anything the channel has since cancelled is released. */
export async function importIcalFeed(form: FormData): Promise<void> {
  const supabase = await requireUser();

  const url = String(form.get("url") ?? "").trim();
  if (!url || !/^https?:\/\//i.test(url)) return;

  let text: string;
  try {
    const response = await fetch(url, {
      headers: { Accept: "text/calendar" },
      cache: "no-store",
    });
    if (!response.ok) return;
    text = await response.text();
  } catch {
    return; // A channel being down is not worth breaking the page over.
  }

  const events = parseIcal(text);
  if (events.length === 0) return;

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((event) => event.end >= today);

  const { data: existingRows } = await supabase
    .from("holds")
    .select("id, note, check_in, check_out, status")
    .like("note", "ical:%");

  const existing = new Map(
    ((existingRows as { id: string; note: string }[] | null) ?? []).map((row) => [row.note, row.id]),
  );

  const seen = new Set<string>();

  for (const event of upcoming) {
    const tag = `ical:${event.uid}`;
    seen.add(tag);

    const row = {
      guest_name: event.summary.slice(0, 120) || "Imported booking",
      check_in: event.start,
      check_out: event.end,
      status: "confirmed" as const,
      note: tag,
      updated_at: new Date().toISOString(),
    };

    const id = existing.get(tag);
    if (id) await supabase.from("holds").update(row).eq("id", id);
    else await supabase.from("holds").insert(row);
  }

  // Gone from the feed means cancelled upstream - free the nights up.
  const stale = Array.from(existing.entries())
    .filter(([tag]) => !seen.has(tag))
    .map(([, id]) => id);
  if (stale.length > 0) {
    await supabase.from("holds").update({ status: "released" }).in("id", stale);
  }

  refreshAdmin();
  revalidatePath("/");
}

/* ==========================================================================
 *  Phase 3 - settings and the rate card
 * ======================================================================== */

export async function saveSettings(form: FormData): Promise<void> {
  const supabase = await requireUser();

  await supabase
    .from("settings")
    .update({
      turnover_buffer_nights: Number(form.get("turnover_buffer_nights") ?? 0),
      weekend_min_nights: Number(form.get("weekend_min_nights") ?? 2),
      notify_email: String(form.get("notify_email") ?? "").trim() || null,
      gate_code: String(form.get("gate_code") ?? "").trim() || null,
      checkin_window: String(form.get("checkin_window") ?? "").trim() || "9am - 7pm",
      checkout_window: String(form.get("checkout_window") ?? "").trim() || "7am - 5pm",
      directions_note: String(form.get("directions_note") ?? "").trim() || null,
      review_url: String(form.get("review_url") ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  refreshAdmin();
}

export async function saveRateRule(form: FormData): Promise<void> {
  const supabase = await requireUser();

  const id = String(form.get("id") ?? "");
  const startsOn = String(form.get("starts_on") ?? "").trim();
  const endsOn = String(form.get("ends_on") ?? "").trim();

  const row = {
    label: String(form.get("label") ?? "").trim() || "Untitled rate",
    starts_on: startsOn || null,
    ends_on: endsOn || null,
    weekday_rate: Number(form.get("weekday_rate") ?? 0),
    weekend_rate: Number(form.get("weekend_rate") ?? 0),
    priority: Number(form.get("priority") ?? 0),
  };

  // A season needs both ends or neither - the DB enforces this too.
  if (Boolean(row.starts_on) !== Boolean(row.ends_on)) return;

  if (id) {
    await supabase.from("rate_rules").update(row).eq("id", id);
  } else {
    await supabase.from("rate_rules").insert(row);
  }

  refreshAdmin();
}

export async function deleteRateRule(id: string): Promise<void> {
  const supabase = await requireUser();
  await supabase.from("rate_rules").delete().eq("id", id);
  refreshAdmin();
}

/* ==========================================================================
 *  Phase 4 - guest lifecycle
 * ======================================================================== */

async function guestEmailFor(holdId: string, inquiryId: string | null): Promise<string | null> {
  if (!inquiryId) return null;
  const supabase = createClient();
  const { data } = await supabase.from("inquiries").select("email").eq("id", inquiryId).maybeSingle();
  return (data as { email: string } | null)?.email ?? null;
}

/* Sends once and records the attempt. The unique index on (hold_id, kind)
   makes a double-send impossible even if this races with itself. */
async function sendGuestMessage(
  hold: Hold,
  kind: "confirmation" | "review_request",
  force = false,
): Promise<ActionResult> {
  const supabase = createClient();

  const to = await guestEmailFor(hold.id, hold.inquiry_id);
  if (!to) return { ok: false, error: "No email address on file for this guest." };

  // The automatic paths must never send twice. A deliberate "send again" from
  // the booking screen is the owner's call, so it skips this.
  if (!force) {
    const { data: already } = await supabase
      .from("guest_messages")
      .select("id, sent_at")
      .eq("hold_id", hold.id)
      .eq("kind", kind)
      .maybeSingle();

    if (already && (already as { sent_at: string | null }).sent_at) {
      return { ok: false, error: "That message has already gone out." };
    }
  }

  const { data: settingsRow } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  const settings = (settingsRow as Settings | null) ?? DEFAULT_SETTINGS;

  const { subject, html } =
    kind === "confirmation"
      ? guestConfirmationEmail(hold, settings)
      : guestReviewRequestEmail(hold, settings);

  const result = MAIL_CONFIGURED
    ? await sendEmail({ to, subject, html })
    : ({ ok: false, error: "RESEND_API_KEY is not set - email is switched off." } as const);

  await supabase.from("guest_messages").upsert(
    {
      hold_id: hold.id,
      kind,
      to_email: to,
      sent_at: result.ok ? new Date().toISOString() : null,
      error: result.ok ? null : result.error,
    },
    { onConflict: "hold_id,kind" },
  );

  refreshAdmin();
  revalidatePath(`/admin/bookings/${hold.id}`);

  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

/** Best-effort on confirmation: never fails the booking it belongs to. */
async function sendConfirmationIfNeeded(hold: Hold): Promise<void> {
  try {
    await sendGuestMessage(hold, "confirmation");
  } catch {
    // Logged in guest_messages.error; the booking itself already saved.
  }
}

export async function sendConfirmationNow(holdId: string): Promise<ActionResult> {
  const supabase = await requireUser();
  const { data } = await supabase.from("holds").select("*").eq("id", holdId).maybeSingle();
  if (!data) return { ok: false, error: "That stay no longer exists." };
  return sendGuestMessage(data as Hold, "confirmation", true);
}

export async function sendReviewRequest(holdId: string): Promise<ActionResult> {
  const supabase = await requireUser();
  const { data } = await supabase.from("holds").select("*").eq("id", holdId).maybeSingle();
  if (!data) return { ok: false, error: "That stay no longer exists." };
  return sendGuestMessage(data as Hold, "review_request", true);
}

export async function addIncident(form: FormData): Promise<void> {
  const supabase = await requireUser();

  const holdId = String(form.get("hold_id") ?? "");
  const description = String(form.get("description") ?? "").trim();
  if (!holdId || !description) return;

  const amount = String(form.get("amount") ?? "").trim();

  await supabase.from("incidents").insert({
    hold_id: holdId,
    kind: (String(form.get("kind") ?? "other") as IncidentKind) ?? "other",
    description,
    amount: amount ? Number(amount) : null,
  });

  revalidatePath(`/admin/bookings/${holdId}`);
  refreshAdmin();
}

export async function setIncidentStatus(id: string, status: IncidentStatus, holdId: string) {
  const supabase = await requireUser();
  await supabase.from("incidents").update({ status }).eq("id", id);
  revalidatePath(`/admin/bookings/${holdId}`);
}

export async function deleteIncident(id: string, holdId: string) {
  const supabase = await requireUser();
  await supabase.from("incidents").delete().eq("id", id);
  revalidatePath(`/admin/bookings/${holdId}`);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
