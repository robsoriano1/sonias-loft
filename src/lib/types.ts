/* Row shapes for every table in supabase/schema.sql + supabase/migrations.
   Dates are "YYYY-MM-DD" strings, timestamps are ISO strings - the same
   convention the date helpers in ./dates.ts use. */

export type InquiryStatus = "new" | "replied" | "confirmed" | "declined" | "expired";

/** The order the pipeline is worked through, left to right. */
export const INQUIRY_STATUSES: InquiryStatus[] = [
  "new",
  "replied",
  "confirmed",
  "declined",
  "expired",
];

/** Statuses that still want something from the owner. */
export const OPEN_STATUSES: InquiryStatus[] = ["new", "replied"];

export type InquirySource = "direct" | "facebook" | "referral" | "other";

export const INQUIRY_SOURCES: InquirySource[] = ["direct", "facebook", "referral", "other"];

export type Inquiry = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  check_in: string | null;
  check_out: string | null;
  guests: number | null;
  message: string | null;
  status: InquiryStatus;
  first_reply_at: string | null;
  notified_at: string | null;
  source: InquirySource;
};

export type BlockedDate = {
  day: string; // "YYYY-MM-DD"
  note: string | null;
  created_at: string;
};

export type HoldStatus = "tentative" | "confirmed" | "released";

/** A stay. Half-open: the guest sleeps check_in..check_out-1 and leaves on
    check_out, so one stay's check-out may equal the next one's check-in. */
export type Hold = {
  id: string;
  created_at: string;
  updated_at: string;
  inquiry_id: string | null;
  guest_name: string;
  check_in: string;
  check_out: string;
  status: HoldStatus;
  rate_total: number | null;
  note: string | null;
};

export type Settings = {
  id: number;
  updated_at: string;
  turnover_buffer_nights: number;
  weekend_min_nights: number;
  notify_email: string | null;
  gate_code: string | null;
  checkin_window: string;
  checkout_window: string;
  directions_note: string | null;
  review_url: string | null;
};

/** Sensible values for a brand-new install, and the fallback whenever the
    settings row cannot be read. Mirrors the copy on the public site. */
export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  updated_at: new Date(0).toISOString(),
  turnover_buffer_nights: 0,
  weekend_min_nights: 2,
  notify_email: null,
  gate_code: null,
  checkin_window: "9am - 7pm",
  checkout_window: "7am - 5pm",
  directions_note: null,
  review_url: null,
};

/** A weekday/weekend pair, optionally scoped to a date range. Highest
    priority rule covering a night wins; a rule with null dates is the base. */
export type RateRule = {
  id: string;
  created_at: string;
  label: string;
  starts_on: string | null;
  ends_on: string | null;
  weekday_rate: number;
  weekend_rate: number;
  priority: number;
};

export type GuestMessageKind = "confirmation" | "review_request";

export type GuestMessage = {
  id: string;
  created_at: string;
  hold_id: string | null;
  kind: GuestMessageKind;
  to_email: string;
  sent_at: string | null;
  error: string | null;
};

export type IncidentKind = "damage" | "pet_cleaning" | "missing_item" | "other";
export type IncidentStatus = "open" | "invoiced" | "settled" | "waived";

export const INCIDENT_KINDS: IncidentKind[] = [
  "damage",
  "pet_cleaning",
  "missing_item",
  "other",
];

export const INCIDENT_STATUSES: IncidentStatus[] = ["open", "invoiced", "settled", "waived"];

export type Incident = {
  id: string;
  created_at: string;
  hold_id: string;
  kind: IncidentKind;
  description: string;
  amount: number | null;
  status: IncidentStatus;
};
