import { describe, expect, it } from "vitest";
import { holdValue, monthPerformance, quoteStay, rateForNight, ruleForNight } from "./rates";
import type { Hold, RateRule } from "./types";

const rule = (over: Partial<RateRule> = {}): RateRule => ({
  id: "r1",
  created_at: "2026-01-01T00:00:00.000Z",
  label: "Base rate",
  starts_on: null,
  ends_on: null,
  weekday_rate: 5000,
  weekend_rate: 7000,
  priority: 0,
  ...over,
});

const hold = (over: Partial<Hold> = {}): Hold => ({
  id: "h1",
  created_at: "2026-09-01T00:00:00.000Z",
  updated_at: "2026-09-01T00:00:00.000Z",
  inquiry_id: null,
  guest_name: "Maria Santos",
  check_in: "2026-09-08",
  check_out: "2026-09-10",
  status: "confirmed",
  rate_total: null,
  note: null,
  ...over,
});

describe("rateForNight", () => {
  const rules = [rule()];

  it("charges the weekday rate midweek", () => {
    expect(rateForNight("2026-09-08", rules)).toBe(5000); // Tuesday
  });

  it("charges the weekend rate on Friday and Saturday nights", () => {
    expect(rateForNight("2026-09-04", rules)).toBe(7000); // Friday
    expect(rateForNight("2026-09-05", rules)).toBe(7000); // Saturday
  });

  it("charges the weekday rate on a Sunday night", () => {
    expect(rateForNight("2026-09-06", rules)).toBe(5000);
  });

  it("returns zero when there is no rate card at all", () => {
    expect(rateForNight("2026-09-08", [])).toBe(0);
  });
});

describe("ruleForNight - seasons beat the base rate", () => {
  const base = rule({ id: "base" });
  const holiday = rule({
    id: "xmas",
    label: "Christmas week",
    starts_on: "2026-12-20",
    ends_on: "2026-12-31",
    weekday_rate: 9000,
    weekend_rate: 12000,
    priority: 10,
  });
  const rules = [base, holiday];

  it("uses the season inside its range", () => {
    expect(ruleForNight("2026-12-24", rules)?.id).toBe("xmas");
    expect(rateForNight("2026-12-24", rules)).toBe(9000); // Thursday
  });

  it("falls back to base outside the range", () => {
    expect(ruleForNight("2026-12-19", rules)?.id).toBe("base");
  });

  it("includes both boundary days", () => {
    expect(ruleForNight("2026-12-20", rules)?.id).toBe("xmas");
    expect(ruleForNight("2026-12-31", rules)?.id).toBe("xmas");
  });

  it("prefers a dated rule over an undated one at the same priority", () => {
    const flat = rule({ id: "flat", priority: 0 });
    const dated = rule({
      id: "dated",
      priority: 0,
      starts_on: "2026-12-20",
      ends_on: "2026-12-31",
    });
    expect(ruleForNight("2026-12-24", [flat, dated])?.id).toBe("dated");
  });
});

describe("quoteStay", () => {
  it("totals a mixed weekday/weekend stay", () => {
    // Thu 10th, Fri 11th, Sat 12th = 5000 + 7000 + 7000
    const quote = quoteStay("2026-09-10", "2026-09-13", [rule()]);
    expect(quote.nights).toBe(3);
    expect(quote.total).toBe(19000);
    expect(quote.lines).toHaveLength(3);
  });

  it("returns nothing for a zero-night stay", () => {
    expect(quoteStay("2026-09-10", "2026-09-10", [rule()])).toMatchObject({ nights: 0, total: 0 });
  });
});

describe("holdValue", () => {
  it("prefers the agreed total over the rate card", () => {
    expect(holdValue(hold({ rate_total: 8888 }), [rule()])).toBe(8888);
  });

  it("falls back to the rate card when nothing was agreed", () => {
    // Tue 8th + Wed 9th at the weekday rate
    expect(holdValue(hold(), [rule()])).toBe(10000);
  });

  it("respects an agreed total of zero - a comped stay is not a missing price", () => {
    expect(holdValue(hold({ rate_total: 0 }), [rule()])).toBe(0);
  });
});

describe("monthPerformance", () => {
  const rules = [rule()];

  it("counts nights, revenue and occupancy for the month", () => {
    const holds = [hold({ check_in: "2026-09-08", check_out: "2026-09-10" })]; // 2 weekday nights
    const perf = monthPerformance(holds, rules, 2026, 8); // month is 0-based: 8 = September

    expect(perf.nightsSold).toBe(2);
    expect(perf.nightsAvailable).toBe(30);
    expect(perf.revenue).toBe(10000);
    expect(perf.adr).toBe(5000);
    expect(perf.occupancy).toBe(7);
  });

  it("ignores anything not confirmed", () => {
    const holds = [hold({ status: "tentative" }), hold({ id: "h2", status: "released" })];
    expect(monthPerformance(holds, rules, 2026, 8).revenue).toBe(0);
  });

  it("splits a stay that straddles month end across both months", () => {
    // 29 Sep, 30 Sep, 1 Oct, 2 Oct - an agreed 20000 spread over 4 nights
    const holds = [hold({ check_in: "2026-09-29", check_out: "2026-10-03", rate_total: 20000 })];

    const sep = monthPerformance(holds, rules, 2026, 8);
    const oct = monthPerformance(holds, rules, 2026, 9);

    expect(sep.nightsSold).toBe(2);
    expect(oct.nightsSold).toBe(2);
    expect(sep.revenue).toBe(10000);
    expect(oct.revenue).toBe(10000);
  });

  it("reports an empty month honestly instead of dividing by zero", () => {
    expect(monthPerformance([], rules, 2026, 8)).toMatchObject({
      nightsSold: 0,
      revenue: 0,
      adr: 0,
      occupancy: 0,
    });
  });
});
