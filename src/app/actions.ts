"use server";

import { createClient } from "@/lib/supabase/server";
import { SUPABASE_CONFIGURED } from "@/lib/supabase/config";
import { MAIL_CONFIGURED, ownerNewInquiryEmail, sendEmail } from "@/lib/notify";
import { site } from "@/lib/content";
import type { Inquiry, InquirySource } from "@/lib/types";
import { INQUIRY_SOURCES } from "@/lib/types";

/* ============================================================================
 *  The public enquiry form posts here.
 *
 *  This used to be a browser-side insert. It moved server-side so the owner
 *  can be notified the moment an enquiry lands, rather than finding out
 *  whenever somebody next opens the dashboard.
 *
 *  The insert is what matters. If the notification fails - no API key, provider
 *  down, bad address - the enquiry is still saved and the guest still gets
 *  their confirmation screen. The failure is recorded by leaving notified_at
 *  null, which the dashboard surfaces so a silent breakage stays visible.
 * ========================================================================== */

export type SubmitResult = { ok: true } | { ok: false; error: string };

export type InquiryInput = {
  name: string;
  email: string;
  phone: string;
  guests: string;
  checkIn: string;
  checkOut: string;
  message: string;
  source?: string;
};

export async function submitInquiry(input: InquiryInput): Promise<SubmitResult> {
  const name = input.name.trim();
  const email = input.email.trim();

  if (!name || !email) {
    return { ok: false, error: "Please give us a name and an email address." };
  }

  if (input.checkIn && input.checkOut && input.checkOut <= input.checkIn) {
    return { ok: false, error: "Check-out needs to be after check-in." };
  }

  if (!SUPABASE_CONFIGURED) {
    return {
      ok: false,
      error:
        "The site is not connected to its database yet. Copy .env.local.example to .env.local and add your Supabase keys.",
    };
  }

  const source: InquirySource = INQUIRY_SOURCES.includes(input.source as InquirySource)
    ? (input.source as InquirySource)
    : "direct";

  const supabase = createClient();

  const { data, error } = await supabase
    .from("inquiries")
    .insert({
      name,
      email,
      phone: input.phone.trim() || null,
      check_in: input.checkIn || null,
      check_out: input.checkOut || null,
      guests: input.guests ? Number(input.guests) : null,
      message: input.message.trim() || null,
      source,
    })
    .select()
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: "Something went wrong sending that. Please try again, or message us on Facebook.",
    };
  }

  // Past this point the enquiry is safely stored. Nothing below may fail the
  // submission.
  await notifyOwner(data as Inquiry);

  return { ok: true };
}

async function notifyOwner(inquiry: Inquiry): Promise<void> {
  if (!MAIL_CONFIGURED) return;

  try {
    const supabase = createClient();

    // settings is owner-only; this function exposes just the address.
    const { data: address } = await supabase.rpc("owner_notify_email");
    const to = (address as string | null) ?? process.env.NOTIFY_TO ?? "";
    if (!to) return;

    const { subject, html } = ownerNewInquiryEmail(inquiry, `${site.url}/admin`);
    const result = await sendEmail({ to, subject, html, replyTo: inquiry.email });

    // Anon may insert an enquiry but not update one, so this goes through the
    // same narrow function rather than a direct write.
    if (result.ok) {
      await supabase.rpc("mark_inquiry_notified", { inquiry_id: inquiry.id });
    }
  } catch {
    // Deliberately swallowed. A notification failure must never turn into a
    // lost enquiry; notified_at stays null and the dashboard flags it.
  }
}
