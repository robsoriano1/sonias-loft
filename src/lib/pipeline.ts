import type { Inquiry, InquiryStatus } from "./types";
import { OPEN_STATUSES } from "./types";
import { formatElapsed, hoursBetween } from "./dates";

/* ============================================================================
 *  The enquiry pipeline: New -> Replied -> Confirmed / Declined / Expired.
 *
 *  The rules that matter are about time, not state. The website promises a
 *  same-day reply, so the list is ordered by who has been waiting longest and
 *  anything past a day is called out as overdue.
 * ========================================================================== */

/** Treat an enquiry as answered the first time it leaves 'new'. */
export function isAnswered(status: InquiryStatus): boolean {
  return status !== "new";
}

export function isOpen(status: InquiryStatus): boolean {
  return OPEN_STATUSES.includes(status);
}

/* The fields to write when the owner moves an enquiry along. first_reply_at
   is stamped once and never moved: it records when the guest first heard
   back, so walking an enquiry backwards to 'new' and forward again must not
   rewrite history and flatter the response time. */
export function statusPatch(
  inquiry: Pick<Inquiry, "status" | "first_reply_at">,
  next: InquiryStatus,
  now: string = new Date().toISOString(),
): { status: InquiryStatus; first_reply_at?: string } {
  const stamping = isAnswered(next) && !inquiry.first_reply_at;
  return stamping ? { status: next, first_reply_at: now } : { status: next };
}

export type ResponseState = {
  /** Hours the guest waited, or has been waiting so far. */
  hours: number;
  /** "3h", "2d" */
  label: string;
  /** Still waiting, past the same-day promise. */
  overdue: boolean;
  /** Already answered - the number is history, not a countdown. */
  settled: boolean;
};

const SAME_DAY_HOURS = 24;

export function responseState(
  inquiry: Pick<Inquiry, "created_at" | "first_reply_at" | "status">,
  now: string = new Date().toISOString(),
): ResponseState {
  const settled = Boolean(inquiry.first_reply_at) || isAnswered(inquiry.status);
  const until = inquiry.first_reply_at ?? now;
  const hours = hoursBetween(inquiry.created_at, settled ? until : now);

  return {
    hours,
    label: formatElapsed(hours),
    overdue: !settled && hours >= SAME_DAY_HOURS,
    settled,
  };
}

/* Oldest unanswered first - the person who has been waiting longest is the
   one at risk of being let down, so they go at the top. Everything already
   dealt with sinks below, newest first, because that list is just history. */
export function sortForPipeline(inquiries: Inquiry[]): Inquiry[] {
  return [...inquiries].sort((a, b) => {
    const aOpen = isOpen(a.status);
    const bOpen = isOpen(b.status);
    if (aOpen !== bOpen) return aOpen ? -1 : 1;
    if (aOpen) return a.created_at.localeCompare(b.created_at); // oldest first
    return b.created_at.localeCompare(a.created_at); // newest first
  });
}

/** Everything still waiting on the owner, longest wait first. */
export function needingReply(inquiries: Inquiry[]): Inquiry[] {
  return sortForPipeline(inquiries).filter((i) => isOpen(i.status));
}

/* --------------------------------------------------------------------------
 *  Repeat guests
 *
 *  Matched on email first, then on a loosely-normalised mobile number, since
 *  the same person will write "0917 000 0000" one year and "+63 917 000 0000"
 *  the next. Local 0-prefixed numbers are folded onto their +63 form.
 * ------------------------------------------------------------------------ */
export function normalisePhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return null;
  if (digits.startsWith("63")) return digits;
  if (digits.startsWith("0")) return `63${digits.slice(1)}`;
  return digits;
}

export function guestKey(inquiry: Pick<Inquiry, "email" | "phone">): string {
  const email = inquiry.email?.trim().toLowerCase();
  if (email) return `email:${email}`;
  const phone = normalisePhone(inquiry.phone);
  return phone ? `phone:${phone}` : "";
}

/** Keys that appear on more than one enquiry - i.e. people who came back. */
export function repeatGuestKeys(inquiries: Pick<Inquiry, "email" | "phone">[]): Set<string> {
  const counts = new Map<string, number>();

  for (const inquiry of inquiries) {
    const key = guestKey(inquiry);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return new Set(
    Array.from(counts.entries())
      .filter(([, n]) => n > 1)
      .map(([key]) => key),
  );
}

/* --------------------------------------------------------------------------
 *  Reply shortcuts - a pre-filled message so answering does not mean
 *  re-typing the guest's dates into a different app.
 * ------------------------------------------------------------------------ */
export function replyBody(inquiry: Inquiry, propertyName: string): string {
  const dates =
    inquiry.check_in && inquiry.check_out
      ? `${inquiry.check_in} to ${inquiry.check_out}`
      : "your dates";

  return (
    `Hi ${inquiry.name.split(" ")[0]},\n\n` +
    `Thank you for your enquiry about ${propertyName} for ${dates}. ` +
    `\n\n` +
    `Best,\nSonia`
  );
}

export function mailtoLink(inquiry: Inquiry, propertyName: string): string {
  const subject = `Re: your enquiry for ${propertyName}`;
  return `mailto:${inquiry.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(replyBody(inquiry, propertyName))}`;
}

/** wa.me needs a bare international number with no plus or spaces. */
export function whatsappLink(inquiry: Inquiry, propertyName: string): string | null {
  const phone = normalisePhone(inquiry.phone);
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(replyBody(inquiry, propertyName))}`;
}

export function smsLink(inquiry: Inquiry, propertyName: string): string | null {
  if (!inquiry.phone) return null;
  return `sms:${inquiry.phone.replace(/\s/g, "")}?body=${encodeURIComponent(replyBody(inquiry, propertyName))}`;
}
