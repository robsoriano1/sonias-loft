import type { Hold, Settings } from "./types";
import { addDays, countNights, isWeekendNight, nightsBetween, rangesOverlap } from "./dates";

/* ============================================================================
 *  The booking rules, as pure functions.
 *
 *  Everything the owner is promised on the public site is enforced here and
 *  nowhere else: the two-night weekend minimum, the cleaning buffer between
 *  stays, and the plain fact that two guests cannot sleep in the loft on the
 *  same night. Server actions call validateStay() before they write; the UI
 *  calls it to show conflicts before the owner commits.
 * ========================================================================== */

export type ProblemCode =
  | "invalid_range"
  | "weekend_minimum"
  | "overlap"
  | "turnover_buffer"
  | "blocked_day";

export type StayProblem = {
  code: ProblemCode;
  /** Plain sentence, shown to the owner as-is. */
  message: string;
  /** Set when the problem is caused by another stay. */
  holdId?: string;
  /** "hard" cannot be confirmed. "soft" is a heads-up the owner may override. */
  severity: "hard" | "soft";
};

/** Holds that still occupy the calendar. Released ones are history. */
export function isActive(hold: Hold): boolean {
  return hold.status === "tentative" || hold.status === "confirmed";
}

export type ValidateInput = {
  checkIn: string;
  checkOut: string;
  holds: Hold[];
  blockedDays: string[];
  settings: Settings;
  /** Skip this hold when checking - used when editing a stay against itself. */
  ignoreHoldId?: string;
  /** Confirming applies the full rule set. Saving a tentative hold is lenient:
      an overlap with another tentative enquiry is a flag, not a block. */
  intent?: "tentative" | "confirmed";
};

export function validateStay(input: ValidateInput): StayProblem[] {
  const { checkIn, checkOut, blockedDays, settings, ignoreHoldId } = input;
  const intent = input.intent ?? "confirmed";
  const problems: StayProblem[] = [];

  if (!checkIn || !checkOut || checkOut <= checkIn) {
    return [
      {
        code: "invalid_range",
        message: "Check-out has to be after check-in.",
        severity: "hard",
      },
    ];
  }

  const nights = nightsBetween(checkIn, checkOut);

  // --- Two-night weekend minimum -------------------------------------------
  const min = settings.weekend_min_nights;
  if (nights.some(isWeekendNight) && nights.length < min) {
    problems.push({
      code: "weekend_minimum",
      message: `Weekend stays need at least ${min} nights. This one is ${nights.length}.`,
      severity: "hard",
    });
  }

  // --- Days the owner blocked by hand --------------------------------------
  const blocked = new Set(blockedDays);
  const hitBlocked = nights.filter((night) => blocked.has(night));
  if (hitBlocked.length > 0) {
    problems.push({
      code: "blocked_day",
      message:
        hitBlocked.length === 1
          ? `${hitBlocked[0]} is blocked on the calendar.`
          : `${hitBlocked.length} nights in this range are blocked on the calendar.`,
      severity: "soft",
    });
  }

  // --- Other stays ----------------------------------------------------------
  const others = input.holds.filter((h) => isActive(h) && h.id !== ignoreHoldId);

  for (const other of others) {
    if (rangesOverlap(checkIn, checkOut, other.check_in, other.check_out)) {
      // A clash with a confirmed booking is always hard. A clash between two
      // tentative enquiries is the double-booking risk the owner needs to SEE,
      // but they may legitimately hold both while waiting on replies.
      const hard = other.status === "confirmed" || intent === "confirmed";
      problems.push({
        code: "overlap",
        message: `Overlaps ${other.status === "confirmed" ? "a confirmed booking" : "a tentative hold"} for ${other.guest_name} (${other.check_in} to ${other.check_out}).`,
        holdId: other.id,
        severity: hard ? "hard" : "soft",
      });
      continue;
    }

    // --- Cleaning / turnover buffer ----------------------------------------
    // Only confirmed stays earn a buffer; a tentative enquiry has not booked
    // the cleaner yet.
    const buffer = settings.turnover_buffer_nights;
    if (buffer > 0 && other.status === "confirmed") {
      const gapAfterOther = checkIn >= other.check_out ? countNights(other.check_out, checkIn) : -1;
      const gapBeforeOther = other.check_in >= checkOut ? countNights(checkOut, other.check_in) : -1;
      const gap = gapAfterOther >= 0 ? gapAfterOther : gapBeforeOther;

      if (gap >= 0 && gap < buffer) {
        problems.push({
          code: "turnover_buffer",
          message: `Leaves ${gap} night${gap === 1 ? "" : "s"} to turn the loft around after ${other.guest_name}. The buffer is set to ${buffer}.`,
          holdId: other.id,
          severity: intent === "confirmed" ? "hard" : "soft",
        });
      }
    }
  }

  return problems;
}

/** Nothing hard standing in the way. */
export function canConfirm(problems: StayProblem[]): boolean {
  return !problems.some((p) => p.severity === "hard");
}

/** Every night that is spoken for, for painting a calendar.
    Confirmed and tentative are kept apart so they can be drawn differently. */
export function occupancyMap(holds: Hold[]): Map<string, "confirmed" | "tentative"> {
  const map = new Map<string, "confirmed" | "tentative">();

  for (const hold of holds) {
    if (!isActive(hold)) continue;
    for (const night of nightsBetween(hold.check_in, hold.check_out)) {
      // Confirmed always wins the pixel.
      if (map.get(night) === "confirmed") continue;
      map.set(night, hold.status === "confirmed" ? "confirmed" : "tentative");
    }
  }

  return map;
}

/** Nights that are unavailable to the public: confirmed stays plus the days
    the owner blocked by hand. Tentative holds are deliberately not included. */
export function publicBlockedDays(holds: Hold[], blockedDays: string[]): string[] {
  const out = new Set(blockedDays);
  for (const hold of holds) {
    if (hold.status !== "confirmed") continue;
    for (const night of nightsBetween(hold.check_in, hold.check_out)) out.add(night);
  }
  return Array.from(out).sort();
}

/** Stays touching a window, for the "next 7 days" panel. */
export function arrivalsBetween(holds: Hold[], from: string, days: number): Hold[] {
  const until = addDays(from, days);
  return holds
    .filter((h) => isActive(h) && h.check_in >= from && h.check_in < until)
    .sort((a, b) => a.check_in.localeCompare(b.check_in));
}

export function departuresBetween(holds: Hold[], from: string, days: number): Hold[] {
  const until = addDays(from, days);
  return holds
    .filter((h) => isActive(h) && h.check_out >= from && h.check_out < until)
    .sort((a, b) => a.check_out.localeCompare(b.check_out));
}
