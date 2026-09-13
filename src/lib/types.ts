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

/* --------------------------------------------------------------------------
 *  Phase 5 - roles and the turnover checklist
 * ------------------------------------------------------------------------ */

export type Role = "owner" | "staff";

export type Profile = {
  id: string;
  created_at: string;
  role: Role;
  display_name: string | null;
};

/** Everything staff are allowed to know about a stay. Deliberately has no
    money, no note and no link back to the enquiry. Mirrors the staff_stays
    view, which is where the restriction is actually enforced. */
export type StaffStay = {
  id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  status: HoldStatus;
};

export type Turnover = {
  id: string;
  created_at: string;
  updated_at: string;
  hold_id: string;
  due_on: string;
  cleaning_done: boolean;
  restock_done: boolean;
  pool_done: boolean;
  damage_checked: boolean;
  damage_found: boolean;
  notes: string | null;
  completed_at: string | null;
  completed_by: string | null;
};

export const TURNOVER_TASKS = [
  { key: "cleaning_done", label: "Cleaning", detail: "Rooms, bathrooms, kitchen, floors" },
  { key: "restock_done", label: "Restock", detail: "Towels, toiletries, coffee, bin liners" },
  { key: "pool_done", label: "Pool check", detail: "Skim, water level, pump running" },
  { key: "damage_checked", label: "Damage check", detail: "Walk the house and the deck" },
] as const;

export type TurnoverTaskKey = (typeof TURNOVER_TASKS)[number]["key"];

/** Every box ticked - what turns a turnover green in the list. */
export function isTurnoverComplete(turnover: Turnover): boolean {
  return TURNOVER_TASKS.every((task) => turnover[task.key]);
}

/* --------------------------------------------------------------------------
 *  Phase 6 - owner-editable content
 * ------------------------------------------------------------------------ */

export const CONTENT_KEYS = ["gallery", "amenities", "house_rules", "reviews"] as const;
export type ContentKey = (typeof CONTENT_KEYS)[number];

export type ContentBlock = {
  key: ContentKey;
  value: unknown;
  updated_at: string;
};

/* The icon names the amenities grid knows how to draw. Anything else falls
   back to a tick, so this list is what the editor offers rather than a hard
   constraint. Keep it in step with the ICONS map in site/Amenities.tsx. */
export const AMENITY_ICONS = [
  "waves",
  "wind",
  "wifi",
  "kitchen",
  "car",
  "tv",
  "trees",
  "shower",
  "coffee",
  "washer",
  "grill",
  "speaker",
] as const;

export type GalleryItem = { src: string; alt: string; ratio: "16/9" | "3/4" };
export type AmenityItem = { icon: string; title: string; detail: string };
export type ReviewItem = { image: string; quote: string; name: string; detail: string };
