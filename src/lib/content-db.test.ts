import { describe, expect, it } from "vitest";
import { CONTENT_DEFAULTS, resolveContent } from "./content-db";
import { TURNOVER_TASKS, isTurnoverComplete, type Turnover } from "./types";

/* The landing page is the business. These tests exist to prove that no shape
   of stored content - empty, malformed, half-written, hostile - can take a
   section of it blank instead of falling back to what ships in the code. */

describe("resolveContent - falling back", () => {
  it("uses the code defaults when nothing is stored", () => {
    expect(resolveContent([])).toEqual(CONTENT_DEFAULTS);
  });

  it("ignores a key it does not recognise", () => {
    expect(resolveContent([{ key: "hero", value: [] }])).toEqual(CONTENT_DEFAULTS);
  });

  it("falls back when the stored value is not a list", () => {
    const resolved = resolveContent([
      { key: "gallery", value: { nope: true } },
      { key: "house_rules", value: "a string" },
      { key: "reviews", value: null },
    ]);
    expect(resolved.gallery).toEqual(CONTENT_DEFAULTS.gallery);
    expect(resolved.houseRules).toEqual(CONTENT_DEFAULTS.houseRules);
    expect(resolved.reviews).toEqual(CONTENT_DEFAULTS.reviews);
  });

  it("falls back rather than rendering an empty section", () => {
    const resolved = resolveContent([
      { key: "gallery", value: [] },
      { key: "amenities", value: [{ title: "   " }] },
    ]);
    expect(resolved.gallery).toEqual(CONTENT_DEFAULTS.gallery);
    expect(resolved.amenities).toEqual(CONTENT_DEFAULTS.amenities);
  });

  it("leaves untouched sections alone when one is edited", () => {
    const resolved = resolveContent([
      { key: "house_rules", value: ["No smoking indoors."] },
    ]);
    expect(resolved.houseRules).toEqual(["No smoking indoors."]);
    expect(resolved.gallery).toEqual(CONTENT_DEFAULTS.gallery);
    expect(resolved.amenities).toEqual(CONTENT_DEFAULTS.amenities);
  });
});

describe("resolveContent - gallery", () => {
  it("keeps valid items and drops ones with no source", () => {
    const resolved = resolveContent([
      {
        key: "gallery",
        value: [
          { src: "/a.jpg", alt: "A", ratio: "16/9" },
          { src: "", alt: "dropped" },
          { src: "/b.jpg", alt: "B", ratio: "3/4" },
        ],
      },
    ]);
    expect(resolved.gallery).toEqual([
      { src: "/a.jpg", alt: "A", ratio: "16/9" },
      { src: "/b.jpg", alt: "B", ratio: "3/4" },
    ]);
  });

  it("forces an unknown crop to portrait so the grid cannot break", () => {
    const resolved = resolveContent([
      { key: "gallery", value: [{ src: "/a.jpg", ratio: "21/9" }] },
    ]);
    expect(resolved.gallery[0].ratio).toBe("3/4");
  });

  it("tolerates a missing alt rather than dropping the photo", () => {
    const resolved = resolveContent([{ key: "gallery", value: [{ src: "/a.jpg" }] }]);
    expect(resolved.gallery).toEqual([{ src: "/a.jpg", alt: "", ratio: "3/4" }]);
  });
});

describe("resolveContent - amenities and rules", () => {
  it("gives an amenity with no icon a safe default", () => {
    const resolved = resolveContent([
      { key: "amenities", value: [{ title: "Pool", detail: "1.2m deep" }] },
    ]);
    expect(resolved.amenities).toEqual([{ icon: "check", title: "Pool", detail: "1.2m deep" }]);
  });

  it("trims rules and drops blank ones", () => {
    const resolved = resolveContent([
      { key: "house_rules", value: ["  No smoking.  ", "", "   ", "Quiet after 11."] },
    ]);
    expect(resolved.houseRules).toEqual(["No smoking.", "Quiet after 11."]);
  });
});

describe("resolveContent - reviews", () => {
  it("requires a quote and names an anonymous reviewer", () => {
    const resolved = resolveContent([
      {
        key: "reviews",
        value: [
          { quote: "Lovely stay", image: "/r.jpg" },
          { name: "No quote here" },
        ],
      },
    ]);
    expect(resolved.reviews).toEqual([
      { image: "/r.jpg", quote: "Lovely stay", name: "Guest", detail: "" },
    ]);
  });
});

describe("isTurnoverComplete", () => {
  const turnover = (over: Partial<Turnover> = {}): Turnover => ({
    id: "t1",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
    hold_id: "h1",
    due_on: "2026-09-12",
    cleaning_done: false,
    restock_done: false,
    pool_done: false,
    damage_checked: false,
    damage_found: false,
    notes: null,
    completed_at: null,
    completed_by: null,
    ...over,
  });

  const allDone = Object.fromEntries(TURNOVER_TASKS.map((t) => [t.key, true]));

  it("is not complete until every task is ticked", () => {
    expect(isTurnoverComplete(turnover())).toBe(false);
    expect(isTurnoverComplete(turnover({ cleaning_done: true, restock_done: true }))).toBe(false);
  });

  it("is complete once they all are", () => {
    expect(isTurnoverComplete(turnover(allDone))).toBe(true);
  });

  it("does not count a damage report as a task", () => {
    expect(isTurnoverComplete(turnover({ ...allDone, damage_found: true }))).toBe(true);
  });
});
