import { describe, expect, it } from "vitest";
import { canConfirm, occupancyMap, publicBlockedDays, validateStay } from "./availability";
import { DEFAULT_SETTINGS, type Hold, type Settings } from "./types";

/* 2026-09-04 is a Friday, so 2026-09-04 and 2026-09-05 are weekend nights.
   Every date in here is chosen off that anchor. */

const settings = (over: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS, ...over });

const hold = (over: Partial<Hold> = {}): Hold => ({
  id: "h1",
  created_at: "2026-09-01T00:00:00.000Z",
  updated_at: "2026-09-01T00:00:00.000Z",
  inquiry_id: null,
  guest_name: "Maria Santos",
  check_in: "2026-09-10",
  check_out: "2026-09-12",
  status: "confirmed",
  rate_total: null,
  note: null,
  ...over,
});

const base = { holds: [], blockedDays: [], settings: settings() };

describe("validateStay - range sanity", () => {
  it("rejects a check-out on or before check-in", () => {
    expect(validateStay({ ...base, checkIn: "2026-09-10", checkOut: "2026-09-10" })[0].code).toBe(
      "invalid_range",
    );
    expect(validateStay({ ...base, checkIn: "2026-09-11", checkOut: "2026-09-10" })[0].code).toBe(
      "invalid_range",
    );
  });

  it("accepts a clean midweek stay", () => {
    expect(validateStay({ ...base, checkIn: "2026-09-08", checkOut: "2026-09-10" })).toEqual([]);
  });
});

describe("validateStay - weekend minimum", () => {
  it("blocks a single Friday night", () => {
    const problems = validateStay({ ...base, checkIn: "2026-09-04", checkOut: "2026-09-05" });
    expect(problems.map((p) => p.code)).toContain("weekend_minimum");
    expect(canConfirm(problems)).toBe(false);
  });

  it("blocks a single Saturday night", () => {
    const problems = validateStay({ ...base, checkIn: "2026-09-05", checkOut: "2026-09-06" });
    expect(problems.map((p) => p.code)).toContain("weekend_minimum");
  });

  it("allows Friday plus Saturday", () => {
    expect(validateStay({ ...base, checkIn: "2026-09-04", checkOut: "2026-09-06" })).toEqual([]);
  });

  it("allows a single midweek night - the minimum is weekends only", () => {
    expect(validateStay({ ...base, checkIn: "2026-09-08", checkOut: "2026-09-09" })).toEqual([]);
  });

  it("allows a single Sunday night - Sunday is not a weekend night to sleep", () => {
    expect(validateStay({ ...base, checkIn: "2026-09-06", checkOut: "2026-09-07" })).toEqual([]);
  });

  it("honours a raised minimum", () => {
    const problems = validateStay({
      ...base,
      settings: settings({ weekend_min_nights: 3 }),
      checkIn: "2026-09-04",
      checkOut: "2026-09-06",
    });
    expect(problems.map((p) => p.code)).toContain("weekend_minimum");
  });
});

describe("validateStay - double booking", () => {
  const existing = [hold({ check_in: "2026-09-10", check_out: "2026-09-12" })];

  it("catches an exact overlap", () => {
    const problems = validateStay({
      ...base,
      holds: existing,
      checkIn: "2026-09-10",
      checkOut: "2026-09-12",
    });
    expect(problems.map((p) => p.code)).toContain("overlap");
    expect(canConfirm(problems)).toBe(false);
  });

  it("catches a partial overlap on either side", () => {
    const before = validateStay({
      ...base,
      holds: existing,
      checkIn: "2026-09-09",
      checkOut: "2026-09-11",
    });
    const after = validateStay({
      ...base,
      holds: existing,
      checkIn: "2026-09-11",
      checkOut: "2026-09-14",
    });
    expect(before.map((p) => p.code)).toContain("overlap");
    expect(after.map((p) => p.code)).toContain("overlap");
  });

  it("catches a stay swallowing an existing one", () => {
    const problems = validateStay({
      ...base,
      holds: existing,
      checkIn: "2026-09-08",
      checkOut: "2026-09-15",
    });
    expect(problems.map((p) => p.code)).toContain("overlap");
  });

  it("allows back-to-back stays - one checks out as the next checks in", () => {
    expect(
      validateStay({ ...base, holds: existing, checkIn: "2026-09-12", checkOut: "2026-09-14" }),
    ).toEqual([]);
    expect(
      validateStay({ ...base, holds: existing, checkIn: "2026-09-08", checkOut: "2026-09-10" }),
    ).toEqual([]);
  });

  it("ignores released holds", () => {
    const problems = validateStay({
      ...base,
      holds: [hold({ status: "released" })],
      checkIn: "2026-09-10",
      checkOut: "2026-09-12",
    });
    expect(problems).toEqual([]);
  });

  it("ignores the hold being edited", () => {
    const problems = validateStay({
      ...base,
      holds: existing,
      ignoreHoldId: "h1",
      checkIn: "2026-09-10",
      checkOut: "2026-09-12",
    });
    expect(problems).toEqual([]);
  });

  it("treats a tentative-on-tentative clash as a flag, not a block", () => {
    const problems = validateStay({
      ...base,
      holds: [hold({ status: "tentative" })],
      intent: "tentative",
      checkIn: "2026-09-10",
      checkOut: "2026-09-12",
    });
    expect(problems.map((p) => p.code)).toContain("overlap");
    expect(canConfirm(problems)).toBe(true);
  });

  it("still blocks confirming over a tentative hold", () => {
    const problems = validateStay({
      ...base,
      holds: [hold({ status: "tentative" })],
      intent: "confirmed",
      checkIn: "2026-09-10",
      checkOut: "2026-09-12",
    });
    expect(canConfirm(problems)).toBe(false);
  });
});

describe("validateStay - turnover buffer", () => {
  const existing = [hold({ check_in: "2026-09-10", check_out: "2026-09-12" })];
  const oneNight = settings({ turnover_buffer_nights: 1 });

  it("rejects a same-day turnaround when a buffer is set", () => {
    const problems = validateStay({
      ...base,
      settings: oneNight,
      holds: existing,
      checkIn: "2026-09-12",
      checkOut: "2026-09-14",
    });
    expect(problems.map((p) => p.code)).toContain("turnover_buffer");
    expect(canConfirm(problems)).toBe(false);
  });

  it("accepts a stay that leaves the buffer clear", () => {
    expect(
      validateStay({
        ...base,
        settings: oneNight,
        holds: existing,
        checkIn: "2026-09-13",
        checkOut: "2026-09-15",
      }),
    ).toEqual([]);
  });

  it("applies the buffer before an existing stay too", () => {
    const problems = validateStay({
      ...base,
      settings: oneNight,
      holds: existing,
      checkIn: "2026-09-08",
      checkOut: "2026-09-10",
    });
    expect(problems.map((p) => p.code)).toContain("turnover_buffer");
  });

  it("does nothing when the buffer is zero", () => {
    expect(
      validateStay({ ...base, holds: existing, checkIn: "2026-09-12", checkOut: "2026-09-14" }),
    ).toEqual([]);
  });

  it("does not reserve a buffer around a merely tentative hold", () => {
    expect(
      validateStay({
        ...base,
        settings: oneNight,
        holds: [hold({ status: "tentative" })],
        checkIn: "2026-09-12",
        checkOut: "2026-09-14",
      }),
    ).toEqual([]);
  });
});

describe("validateStay - hand-blocked days", () => {
  it("flags a blocked night without hard-blocking it", () => {
    const problems = validateStay({
      ...base,
      blockedDays: ["2026-09-09"],
      checkIn: "2026-09-08",
      checkOut: "2026-09-10",
    });
    expect(problems.map((p) => p.code)).toContain("blocked_day");
    expect(canConfirm(problems)).toBe(true);
  });

  it("ignores a block on the check-out day, which nobody sleeps through", () => {
    expect(
      validateStay({
        ...base,
        blockedDays: ["2026-09-10"],
        checkIn: "2026-09-08",
        checkOut: "2026-09-10",
      }),
    ).toEqual([]);
  });
});

describe("occupancyMap", () => {
  it("paints every night of a stay but not the check-out day", () => {
    const map = occupancyMap([hold({ check_in: "2026-09-10", check_out: "2026-09-12" })]);
    expect(map.get("2026-09-10")).toBe("confirmed");
    expect(map.get("2026-09-11")).toBe("confirmed");
    expect(map.has("2026-09-12")).toBe(false);
  });

  it("lets confirmed win over tentative on a contested night", () => {
    const map = occupancyMap([
      hold({ id: "a", status: "tentative" }),
      hold({ id: "b", status: "confirmed" }),
    ]);
    expect(map.get("2026-09-10")).toBe("confirmed");
  });
});

describe("publicBlockedDays", () => {
  it("publishes confirmed stays and hand-blocked days, never tentative ones", () => {
    const days = publicBlockedDays(
      [
        hold({ id: "a", status: "confirmed", check_in: "2026-09-10", check_out: "2026-09-11" }),
        hold({ id: "b", status: "tentative", check_in: "2026-09-20", check_out: "2026-09-21" }),
      ],
      ["2026-09-01"],
    );
    expect(days).toEqual(["2026-09-01", "2026-09-10"]);
  });
});
