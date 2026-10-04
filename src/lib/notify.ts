import "server-only";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import type { Hold, Inquiry, Settings } from "./types";
import { location, site } from "./content";
import { formatDateKey, countNights } from "./dates";
import { isBareEmail, parseSender, validateSender } from "./sender";

/* ============================================================================
 *  Outbound email. Gmail, SendGrid or Resend, wrapped thin.
 *
 *  Two rules this module exists to keep:
 *
 *  1. Sending never throws into a caller. The public enquiry form must submit
 *     successfully even if the mail provider is down, misconfigured, or not
 *     set up yet - losing the enquiry to save the email would be exactly
 *     backwards. Every function here returns a result instead.
 *  2. No key, no send. With no provider's credentials set the whole thing is
 *     inert and says so, which is what CI and a fresh clone will see.
 *
 *  Set in Vercel: GMAIL_USER + GMAIL_APP_PASSWORD, or SENDGRID_API_KEY or
 *  RESEND_API_KEY plus NOTIFY_FROM (a sender that provider has verified). The
 *  owner's destination inbox is settings.notify_email, editable in
 *  Owner -> Settings.
 * ========================================================================== */

/* Three providers, because they solve different problems.

   Gmail logs into an ordinary Gmail account with an app password and sends as
   that account. It is free, needs no domain, and because Google signs the mail
   itself it reaches inboxes better than a third party sending "as" a Gmail
   address. This is the route in use.

   SendGrid verifies a single ordinary address, but its free plan was retired
   in 2025 - a new account gets a 60-day trial and then sending stops unless
   someone pays. Resend has a real free tier but requires a verified domain;
   once a domain is bought it is the better end state, with DKIM and SPF on
   the site's own name.

   Gmail wins when its variables are present, then SendGrid, then Resend. Gmail
   goes first so a key left behind by an earlier attempt at another provider
   cannot quietly take over. MAIL_PROVIDER forces one. */
const GMAIL_USER = process.env.GMAIL_USER?.trim();
/* Google displays an app password as four groups of four with spaces between,
   and that is how it gets copied. Gmail wants the sixteen letters alone. */
const GMAIL_PASSWORD = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
const SENDGRID_KEY = process.env.SENDGRID_API_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;

export type MailProvider = "gmail" | "sendgrid" | "resend" | "none";

/* Either Gmail variable alone selects Gmail. With only one set, the missing
   one is named by configProblem() rather than mail just being "off". */
const HAS_GMAIL = Boolean(GMAIL_USER || GMAIL_PASSWORD);

function pickProvider(): MailProvider {
  const forced = process.env.MAIL_PROVIDER?.toLowerCase();
  if (forced === "gmail") return HAS_GMAIL ? "gmail" : "none";
  if (forced === "sendgrid") return SENDGRID_KEY ? "sendgrid" : "none";
  if (forced === "resend") return RESEND_KEY ? "resend" : "none";
  if (HAS_GMAIL) return "gmail";
  if (SENDGRID_KEY) return "sendgrid";
  if (RESEND_KEY) return "resend";
  return "none";
}

export const MAIL_PROVIDER = pickProvider();
export const MAIL_CONFIGURED = MAIL_PROVIDER !== "none";

export const PROVIDER_NAMES: Record<MailProvider, string> = {
  gmail: "Gmail",
  sendgrid: "SendGrid",
  resend: "Resend",
  none: "nothing",
};

/** Why nothing is being sent, worded for whoever has to fix it. */
export const MAIL_OFF_REASON =
  "No mail provider is set up. Add GMAIL_USER and GMAIL_APP_PASSWORD in Vercel, then redeploy - saving a variable alone does not change the running site.";

/* Gmail always sends as the account it logged into - it rewrites any other
   From address to that one - so NOTIFY_FROM is ignored there rather than
   allowed to disagree with what guests actually see.

   The Resend fallback is Resend's own shared test address. SendGrid has no
   equivalent: every send must come from an address that account has
   verified, so there is nothing to fall back to. */
const FROM =
  MAIL_PROVIDER === "gmail"
    ? `${site.name} <${GMAIL_USER ?? ""}>`
    : process.env.NOTIFY_FROM ??
      (MAIL_PROVIDER === "resend" ? "Sonia's Loft <onboarding@resend.dev>" : "");

/** The sender in use, for error messages. Not a secret. */
export const FROM_ADDRESS = FROM;

/** True while falling back to Resend's shared test sender, which can only
    deliver to the address that owns the Resend account. */
export const USING_TEST_SENDER = !process.env.NOTIFY_FROM && MAIL_PROVIDER === "resend";

/** Null when the provider's variables are usable, otherwise a sentence saying
    which one is wrong. Checked before any send so a typo fails loudly and once. */
export function configProblem(): string | null {
  if (MAIL_PROVIDER === "gmail") {
    if (!GMAIL_USER) {
      return "GMAIL_USER is not set. It should be the Gmail address the app password belongs to, e.g. you@gmail.com.";
    }
    if (!isBareEmail(GMAIL_USER)) {
      return `GMAIL_USER should be just the address, like you@gmail.com, with no name or brackets. It is currently ${GMAIL_USER}`;
    }
    if (!GMAIL_PASSWORD) {
      return "GMAIL_APP_PASSWORD is not set. Create one at myaccount.google.com/apppasswords (2-Step Verification must be on) and paste the 16 letters.";
    }
    return null;
  }
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
    return { ok: false, error: MAIL_OFF_REASON };
  }
  if (!message.to) {
    return { ok: false, error: "No destination address." };
  }

  // Caught here rather than at the API, so the message names the variable.
  const badConfig = configProblem();
  if (badConfig) return { ok: false, error: badConfig };

  try {
    if (MAIL_PROVIDER === "gmail") return await sendViaGmail(message);
    if (MAIL_PROVIDER === "sendgrid") return await sendViaSendGrid(message);
    return await sendViaResend(message);
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : "Unknown send failure." };
  }
}

/* Gmail's own SMTP server, logged in with an app password.

   The timeouts are short on purpose: the enquiry form waits on this send, and
   nodemailer's default is two minutes to connect. If Gmail is unreachable a
   guest should wait seconds, then see their enquiry go through anyway. */
async function sendViaGmail(message: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<SendResult> {
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: GMAIL_USER, pass: GMAIL_PASSWORD },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  try {
    await transport.sendMail({
      from: { name: site.name, address: GMAIL_USER ?? "" },
      to: message.to,
      subject: message.subject,
      html: message.html,
      ...(message.replyTo ? { replyTo: message.replyTo } : {}),
    });
    return { ok: true };
  } catch (cause) {
    return { ok: false, error: describeGmailError(cause) };
  }
}

type SmtpError = { code?: string; responseCode?: number; response?: string; message?: string };

/* Google's own wording is always passed through - it is specific and it is
   what a search will find - but the two login failures get a plain-language
   lead, because their real causes are not what the SMTP text suggests. */
function describeGmailError(cause: unknown): string {
  const error = (cause ?? {}) as SmtpError;
  const said = (error.response ?? error.message ?? "No detail given.").trim();

  // 534 5.7.9: the account's normal password was used, not an app password.
  if (error.responseCode === 534) {
    return `Gmail wants an app password, not the account's normal password. Create one at myaccount.google.com/apppasswords and put it in GMAIL_APP_PASSWORD. Google said: ${said}`;
  }

  if (error.code === "EAUTH" || error.responseCode === 535) {
    return `Gmail refused the login. Check GMAIL_USER is the full address and GMAIL_APP_PASSWORD is a current app password for it - changing the account's main password cancels every app password. Google said: ${said}`;
  }

  if (error.code === "ETIMEDOUT" || error.code === "ECONNECTION" || error.code === "EDNS") {
    return `Could not reach Gmail's mail server. Try again in a minute. Detail: ${said}`;
  }

  return `Gmail did not send it. Google said: ${said}`;
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
