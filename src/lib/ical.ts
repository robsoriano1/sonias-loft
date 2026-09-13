import type { Hold } from "./types";
import { addDays } from "./dates";

/* ============================================================================
 *  iCalendar (RFC 5545) in and out.
 *
 *  Just enough of the spec for the one job: keeping this calendar and an
 *  Airbnb / Google / Facebook listing from selling the same night twice.
 *  All-day VEVENTs use DTEND exclusive, which is the same half-open
 *  convention holds already use, so nothing needs converting.
 * ========================================================================== */

const stamp = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const dateOnly = (key: string) => key.replace(/-/g, "");

/* Long lines must be folded at 75 octets. Most readers cope without it, but
   Google Calendar quietly drops events with over-long SUMMARY lines. */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  if (rest) parts.push(` ${rest}`);
  return parts.join("\r\n");
}

function escape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export type IcalEvent = {
  uid: string;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD, exclusive
  summary: string;
};

export function buildIcal(events: IcalEvent[], calendarName: string): string {
  const now = stamp(new Date().toISOString());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sonia's Loft//Availability//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    fold(`X-WR-CALNAME:${escape(calendarName)}`),
  ];

  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${dateOnly(event.start)}`,
      `DTEND;VALUE=DATE:${dateOnly(event.end)}`,
      fold(`SUMMARY:${escape(event.summary)}`),
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/** Confirmed stays become events. Tentative ones deliberately do not - an
    enquiry in progress must not block a night on a channel that could sell it. */
export function holdsToEvents(holds: Hold[], propertyName: string): IcalEvent[] {
  return holds
    .filter((hold) => hold.status === "confirmed")
    .map((hold) => ({
      uid: `hold-${hold.id}@sonias-loft`,
      start: hold.check_in,
      end: hold.check_out,
      summary: `${hold.guest_name} - ${propertyName}`,
    }));
}

/** Hand-blocked days, merged into runs so a fortnight is one event not fourteen. */
export function blockedDaysToEvents(days: string[]): IcalEvent[] {
  if (days.length === 0) return [];

  const sorted = [...days].sort();
  const events: IcalEvent[] = [];

  let runStart = sorted[0];
  let previous = sorted[0];

  for (const day of sorted.slice(1)) {
    if (day === addDays(previous, 1)) {
      previous = day;
      continue;
    }
    events.push({
      uid: `blocked-${runStart}@sonias-loft`,
      start: runStart,
      end: addDays(previous, 1),
      summary: "Unavailable",
    });
    runStart = day;
    previous = day;
  }

  events.push({
    uid: `blocked-${runStart}@sonias-loft`,
    start: runStart,
    end: addDays(previous, 1),
    summary: "Unavailable",
  });

  return events;
}

/* --------------------------------------------------------------------------
 *  Import
 *
 *  A deliberately small parser: unfold continuation lines, pull the all-day
 *  VEVENTs, ignore everything else. Channel feeds (Airbnb, Booking.com) only
 *  ever publish all-day blocks, so timed events are not worth the surface.
 * ------------------------------------------------------------------------ */
export type ParsedEvent = { uid: string; start: string; end: string; summary: string };

export function parseIcal(text: string): ParsedEvent[] {
  // Unfold: a line starting with a space continues the one before it.
  const unfolded = text.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const lines = unfolded.split(/\r\n|\n/);

  const events: ParsedEvent[] = [];
  let current: Partial<ParsedEvent> | null = null;

  for (const line of lines) {
    if (line.startsWith("BEGIN:VEVENT")) {
      current = {};
      continue;
    }

    if (line.startsWith("END:VEVENT")) {
      if (current?.start && current.end) {
        events.push({
          uid: current.uid ?? `${current.start}-${current.end}`,
          start: current.start,
          end: current.end,
          summary: current.summary ?? "Unavailable",
        });
      }
      current = null;
      continue;
    }

    if (!current) continue;

    const colon = line.indexOf(":");
    if (colon === -1) continue;

    const name = line.slice(0, colon).split(";")[0].toUpperCase();
    const value = line.slice(colon + 1).trim();

    if (name === "UID") current.uid = value;
    else if (name === "SUMMARY") current.summary = value.replace(/\\,/g, ",").replace(/\\;/g, ";");
    else if (name === "DTSTART") current.start = toKeyFromIcal(value);
    else if (name === "DTEND") current.end = toKeyFromIcal(value);
  }

  return events.filter((e) => e.start && e.end && e.end > e.start);
}

/** "20260904" or "20260904T000000Z" -> "2026-09-04" */
function toKeyFromIcal(value: string): string {
  const digits = value.replace(/[^0-9]/g, "").slice(0, 8);
  if (digits.length !== 8) return "";
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}
