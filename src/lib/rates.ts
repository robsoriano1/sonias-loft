import type { Hold, RateRule } from "./types";
import { countNights, isWeekendNight, nightsBetween, monthBounds } from "./dates";

/* ============================================================================
 *  Pricing and the money numbers on the dashboard.
 *
 *  A night is priced by the highest-priority rate rule whose date range
 *  covers it. A rule with no dates is the always-on base rate, so there is
 *  always an answer. Weekend nights (Fri and Sat) take the weekend column.
 *
 *  A hold's own rate_total always wins over the rate card: these are direct,
 *  negotiated bookings, and what the owner actually agreed beats what the
 *  card says.
 * ========================================================================== */

/** The rule that governs one night, or null if there is no rate card at all. */
export function ruleForNight(night: string, rules: RateRule[]): RateRule | null {
  const covering = rules.filter((rule) => {
    if (!rule.starts_on || !rule.ends_on) return true; // base rule
    return night >= rule.starts_on && night <= rule.ends_on;
  });

  if (covering.length === 0) return null;

  // Highest priority wins. A dated rule beats an undated one at equal
  // priority, so a season always overrides the base without extra bookkeeping.
  return covering.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    const aDated = a.starts_on ? 1 : 0;
    const bDated = b.starts_on ? 1 : 0;
    return bDated - aDated;
  })[0];
}

export function rateForNight(night: string, rules: RateRule[]): number {
  const rule = ruleForNight(night, rules);
  if (!rule) return 0;
  return isWeekendNight(night) ? Number(rule.weekend_rate) : Number(rule.weekday_rate);
}

export type Quote = {
  nights: number;
  total: number;
  /** Per-night breakdown, so the owner can see where the number came from. */
  lines: { night: string; rate: number; label: string }[];
};

export function quoteStay(checkIn: string, checkOut: string, rules: RateRule[]): Quote {
  const nights = nightsBetween(checkIn, checkOut);

  const lines = nights.map((night) => {
    const rule = ruleForNight(night, rules);
    return {
      night,
      rate: rateForNight(night, rules),
      label: rule ? rule.label : "No rate set",
    };
  });

  return {
    nights: nights.length,
    total: lines.reduce((sum, line) => sum + line.rate, 0),
    lines,
  };
}

/** What a stay is worth: the agreed total if there is one, else the card. */
export function holdValue(hold: Hold, rules: RateRule[]): number {
  if (hold.rate_total !== null && hold.rate_total !== undefined) return Number(hold.rate_total);
  return quoteStay(hold.check_in, hold.check_out, rules).total;
}

export type MonthPerformance = {
  /** Nights sold that fall inside the month. */
  nightsSold: number;
  /** Nights the loft could have sold. */
  nightsAvailable: number;
  /** 0-100. */
  occupancy: number;
  revenue: number;
  /** Average nightly rate across the nights actually sold. */
  adr: number;
};

/* Revenue is counted per night, not per booking, so a stay straddling the end
   of the month lands its money in the right buckets instead of all landing
   wherever check-in happened to fall. A hold with an agreed total has that
   total spread evenly across its nights. */
export function monthPerformance(
  holds: Hold[],
  rules: RateRule[],
  year: number,
  month: number,
): MonthPerformance {
  const { start, end } = monthBounds(year, month);
  const nightsAvailable = countNights(start, end) + 1;

  let nightsSold = 0;
  let revenue = 0;

  for (const hold of holds) {
    if (hold.status !== "confirmed") continue;

    const stayNights = nightsBetween(hold.check_in, hold.check_out);
    if (stayNights.length === 0) continue;

    const inMonth = stayNights.filter((night) => night >= start && night <= end);
    if (inMonth.length === 0) continue;

    nightsSold += inMonth.length;

    if (hold.rate_total !== null && hold.rate_total !== undefined) {
      // Spread the agreed amount evenly - we do not know how the owner
      // apportioned it across nights, and even is the honest assumption.
      revenue += (Number(hold.rate_total) / stayNights.length) * inMonth.length;
    } else {
      revenue += inMonth.reduce((sum, night) => sum + rateForNight(night, rules), 0);
    }
  }

  return {
    nightsSold,
    nightsAvailable,
    occupancy: nightsAvailable === 0 ? 0 : Math.round((nightsSold / nightsAvailable) * 100),
    revenue: Math.round(revenue),
    adr: nightsSold === 0 ? 0 : Math.round(revenue / nightsSold),
  };
}

/** "₱12,500" - Philippine peso, no decimals. Rates here are whole pesos. */
export function formatPeso(amount: number): string {
  return `₱${Math.round(amount).toLocaleString("en-PH")}`;
}
