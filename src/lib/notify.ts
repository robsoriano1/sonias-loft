import "server-only";
import { Resend } from "resend";
import type { Hold, Inquiry, Settings } from "./types";
import { location, site } from "./content";
import { formatDateKey, countNights } from "./dates";
import { parseSender, validateSender } from "./sender";

/* ============================================================================
 *  Outbound email. SendGrid or Resend, wrapped thin.
 *
 *  Two rules this module exists to keep:
 *
 *  1. Sending never throws into a caller. The public enquiry form must submit
 *     successfully even if the mail provider is down, misconfigured, or not
 *     set up yet - losing the enquiry to save the email would be exactly
 *     backwards. Every function here returns a result instead.
 *  2. No key, no send. With neither provider's key set the whole thing is
 *     inert and says so, which is what CI and a fresh clone will see.
 *
 *  Set in Vercel: SENDGRID_API_KEY or RESEND_API_KEY, plus NOTIFY_FROM (a
 *  sender the chosen provider has verified). The owner's destination inbox is
 *  settings.notify_email, editable in Owner -> Settings.
 * ========================================================================== */

/* Two providers, because they solve different problems.

   SendGrid verifies a single ordinary address - a Gmail will do - so mail can
   go out today without owning a domain. Resend requires a verified domain,
   which is the better end state: it gets you DKIM and SPF, and therefore
   confirmations that land in inboxes rather than spam.

   Whichever key is present wins, SendGrid first, so switching is a matter of
   setting a variable rather than changing code. MAIL_PROVIDER forces one. */
const SENDGRID_KEY = process.env.SENDGRID_API_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;

export type MailProvider = "sendgrid" | "resend" | "none";

function pickProvider(): MailProvider {
  const forced = process.env.MAIL_PROVIDER?.toLowerCase();
  if (forced === "sendgrid") return SENDGRID_KEY ? "sendgrid" : "none";
  if (forced === "resend") return RESEND_KEY ? "resend" : "none";
  if (SENDGRID_KEY) return "sendgrid";
  if (RESEND_KEY) return "resend";
  return "none";
}

export const MAIL_PROVIDER = pickProvider();
export const MAIL_CONFIGURED = MAIL_PROVIDER !== "none";

/* The default sender only makes sense on Resend - it is Resend's own shared
   test address. SendGrid has no equivalent: every send must come from an
   address that account has verified, so there is nothing to fall back to. */
const FROM =
  process.env.NOTIFY_FROM ??
  (MAIL_PROVIDER === "resend" ? "Sonia's Loft <onboarding@resend.dev>" : "");

/** The sender in use, for error messages. Not a secret. */
export const FROM_ADDRESS = FROM;

/** True while falling back to Resend's shared test sender, which can only
    deliver to the address that owns the Resend account. */
export const USING_TEST_SENDER = !process.env.NOTIFY_FROM && MAIL_PROVIDER === "resend";

/** Null when the sender is well-formed, otherwise a sentence saying what is
    wrong with it. Checked before any send so a typo fails loudly and once. */
export function senderProblem(): string | null {
  if (MAIL_PROVIDER === "sendgrid" && !process.env.NOTIFY_FROM) {
    return "NOTIFY_FROM is not set. SendGrid has no shared sender - set it to the address you verified under Single Sender Verification, e.g. Sonia's Loft <you@gmail.com>.";
  }
  return validateSender(FROM);
}

export type SendResult = { ok: true } | { ok: false; error: string };

export async function sendEmail(message: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<SendResult> {
  if (MAIL_PROVIDER === "none") {
    return {
      ok: false,
      error: "No mail provider configured - set SENDGRID_API_KEY or RESEND_API_KEY.",
    };
  }
  if (!message.to) {
    return { ok: false, error: "No destination address." };
  }

  // Caught here rather than at the API, so the message names the variable.
  const badSender = senderProblem();
  if (badSender) return { ok: false, error: badSender };

  try {
    return MAIL_PROVIDER === "sendgrid"
      ? await sendViaSendGrid(message)
      : await sendViaResend(message);
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : "Unknown send failure." };
  }
}

async function sendViaResend(message: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<SendResult> {
  const { error } = await new Resend(RESEND_KEY).emails.send({
    from: FROM,
    to: message.to,
    subject: message.subject,
    html: message.html,
    replyTo: message.replyTo,
  });

  if (error) return { ok: false, error: error.message ?? "Resend rejected the message." };
  return { ok: true };
}

/* Plain fetch rather than @sendgrid/mail - it is one POST, and the SDK would
   be a second mail dependency earning its keep only at install time. */
async function sendViaSendGrid(message: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<SendResult> {
  const sender = parseSender(FROM);
  if (!sender) return { ok: false, error: `Could not read NOTIFY_FROM: ${FROM}` };

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SENDGRID_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: message.to }] }],
      from: sender.name ? { email: sender.email, name: sender.name } : { email: sender.email },
      subject: message.subject,
      content: [{ type: "text/html", value: message.html }],
      ...(message.replyTo ? { reply_to: { email: message.replyTo } } : {}),
    }),
  });

  // A successful send is 202 with an empty body.
  if (response.ok) return { ok: true };

  return { ok: false, error: await describeSendGridError(response) };
}

/* SendGrid returns {errors: [{message, field, help}]}. Its most common
   rejection - an unverified sender - says so only in `message`, so the raw
   text is passed through rather than flattened. */
async function describeSendGridError(response: Response): Promise<string> {
  let detail = "";
  try {
    const body = (await response.json()) as { errors?: { message?: string }[] };
    detail = (body.errors ?? [])
      .map((e) => e.message)
      .filter(Boolean)
      .join("; ");
  } catch {
    detail = "";
  }

  if (response.status === 401 || response.status === 403) {
    return `SendGrid rejected the API key (${response.status}). ${detail || "Check SENDGRID_API_KEY has Mail Send permission."}`;
  }

  return `SendGrid returned ${response.status}. ${detail || "No detail given."}`;
}

/* ---------------------------------------------------------------------------
 *  Templates
 *
 *  Deliberately plain HTML: inline styles only, no images, no external CSS.
 *  Gmail and Viber's in-app browser both mangle anything fancier, and the
 *  owner reads these on a phone.
 * ------------------------------------------------------------------------- */

const wrap = (body: string) =>
  `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.65;color:#1c1a17;max-width:520px">${body}</div>`;

const row = (label: string, value: string) =>
  `<tr><td style="padding:4px 16px 4px 0;color:#7a736b;white-space:nowrap">${label}</td><td style="padding:4px 0">${value}</td></tr>`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Fires the moment an enquiry lands, so nobody has to be watching the dashboard. */
export function ownerNewInquiryEmail(inquiry: Inquiry, adminUrl: string) {
  const dates =
    inquiry.check_in && inquiry.check_out
      ? `${formatDateKey(inquiry.check_in)} to ${formatDateKey(inquiry.check_out)} (${countNights(inquiry.check_in, inquiry.check_out)} nights)`
      : "Not specified";

  return {
    subject: `New enquiry - ${inquiry.name}`,
    html: wrap(`
      <p style="margin:0 0 16px">${escapeHtml(inquiry.name)} just enquired through the website.</p>
      <table style="border-collapse:collapse;margin:0 0 20px">
        ${row("Dates", escapeHtml(dates))}
        ${row("Guests", inquiry.guests ? String(inquiry.guests) : "Not specified")}
        ${row("Email", `<a href="mailto:${escapeHtml(inquiry.email)}" style="color:#8a6d3b">${escapeHtml(inquiry.email)}</a>`)}
        ${inquiry.phone ? row("Mobile", escapeHtml(inquiry.phone)) : ""}
      </table>
      ${inquiry.message ? `<p style="margin:0 0 20px;padding:12px 16px;background:#f6f3ee;border-left:2px solid #d8d2c8">${escapeHtml(inquiry.message)}</p>` : ""}
      <p style="margin:0 0 24px;color:#7a736b">You promised a same-day reply on the website.</p>
      <a href="${adminUrl}" style="display:inline-block;background:#1c1a17;color:#fff;padding:12px 22px;text-decoration:none;border-radius:2px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase">Open the dashboard</a>
    `),
  };
}

/** Sent to the guest when the owner confirms. Everything they need to arrive. */
export function guestConfirmationEmail(hold: Hold, settings: Settings) {
  const nights = countNights(hold.check_in, hold.check_out);

  return {
    subject: `You're booked - ${site.name}, ${formatDateKey(hold.check_in)}`,
    html: wrap(`
      <p style="margin:0 0 16px">Hi ${escapeHtml(hold.guest_name)}, your stay is confirmed. We're looking forward to having you.</p>
      <table style="border-collapse:collapse;margin:0 0 20px">
        ${row("Check in", `${formatDateKey(hold.check_in)}, ${escapeHtml(settings.checkin_window)}`)}
        ${row("Check out", `${formatDateKey(hold.check_out)}, ${escapeHtml(settings.checkout_window)}`)}
        ${row("Nights", String(nights))}
        ${settings.gate_code ? row("Gate code", `<strong>${escapeHtml(settings.gate_code)}</strong>`) : ""}
      </table>
      <p style="margin:0 0 8px;font-weight:600">Getting here</p>
      <p style="margin:0 0 12px;color:#4a453f">${escapeHtml(settings.directions_note ?? location.roadNote)}</p>
      <p style="margin:0 0 20px"><a href="${location.directionsHref}" style="color:#8a6d3b">Open driving directions</a></p>
      <p style="margin:0 0 8px;font-weight:600">A few house notes</p>
      <ul style="margin:0 0 20px;padding-left:20px;color:#4a453f">
        <li>Quiet hours after 10pm - the neighbours are close.</li>
        <li>One small pet allowed, with diaper and pee pad, never on beds or sofas. Deep cleaning for pet smells is ₱2,500.</li>
        <li>Please segregate your trash using the bins provided.</li>
      </ul>
      <p style="margin:0;color:#7a736b">Anything at all, just reply to this email or message us on Facebook.</p>
    `),
  };
}

/** A light nudge after checkout. One sentence and a link - nothing pushy. */
export function guestReviewRequestEmail(hold: Hold, settings: Settings) {
  const link = settings.review_url ?? site.contact.facebook;

  return {
    subject: `Thanks for staying with us, ${hold.guest_name.split(" ")[0]}`,
    html: wrap(`
      <p style="margin:0 0 16px">Hi ${escapeHtml(hold.guest_name)}, thank you for staying at ${escapeHtml(site.name)}. We hope the pool and the view treated you well.</p>
      <p style="margin:0 0 24px">If you have a minute, a short review genuinely helps a small family-run place like ours.</p>
      ${link ? `<a href="${escapeHtml(link)}" style="display:inline-block;background:#1c1a17;color:#fff;padding:12px 22px;text-decoration:none;border-radius:2px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase">Leave a review</a>` : ""}
      <p style="margin:24px 0 0;color:#7a736b">Come back and see us.</p>
    `),
  };
}
