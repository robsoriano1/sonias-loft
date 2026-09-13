import { describe, expect, it } from "vitest";
import {
  guestKey,
  mailtoLink,
  needingReply,
  normalisePhone,
  repeatGuestKeys,
  responseState,
  sortForPipeline,
  statusPatch,
  whatsappLink,
} from "./pipeline";
import type { Inquiry } from "./types";

const inquiry = (over: Partial<Inquiry> = {}): Inquiry => ({
  id: "i1",
  created_at: "2026-09-10T08:00:00.000Z",
  name: "Maria Santos",
  email: "maria@email.com",
  phone: "0917 000 0000",
  check_in: "2026-10-01",
  check_out: "2026-10-03",
  guests: 4,
  message: null,
  status: "new",
  first_reply_at: null,
  notified_at: null,
  source: "direct",
  ...over,
});

describe("statusPatch", () => {
  const now = "2026-09-10T12:00:00.000Z";

  it("stamps the first reply when an enquiry leaves 'new'", () => {
    expect(statusPatch(inquiry(), "replied", now)).toEqual({
      status: "replied",
      first_reply_at: now,
    });
  });

  it("stamps it for a straight-to-confirmed jump too", () => {
    expect(statusPatch(inquiry(), "confirmed", now)).toEqual({
      status: "confirmed",
      first_reply_at: now,
    });
  });

  it("never moves a stamp that already exists", () => {
    const earlier = "2026-09-10T09:00:00.000Z";
    expect(statusPatch(inquiry({ first_reply_at: earlier, status: "replied" }), "confirmed", now)).toEqual({
      status: "confirmed",
    });
  });

  it("does not stamp when going back to 'new'", () => {
    expect(statusPatch(inquiry({ status: "replied" }), "new", now)).toEqual({ status: "new" });
  });
});

describe("responseState", () => {
  it("counts up while an enquiry is unanswered", () => {
    const state = responseState(inquiry(), "2026-09-10T11:00:00.000Z");
    expect(state.hours).toBe(3);
    expect(state.label).toBe("3h");
    expect(state.settled).toBe(false);
    expect(state.overdue).toBe(false);
  });

  it("calls anything past a day overdue - the site promises same-day", () => {
    const state = responseState(inquiry(), "2026-09-11T09:00:00.000Z");
    expect(state.label).toBe("1d");
    expect(state.overdue).toBe(true);
  });

  it("freezes at the reply time once answered", () => {
    const state = responseState(
      inquiry({ status: "replied", first_reply_at: "2026-09-10T10:00:00.000Z" }),
      "2026-09-20T10:00:00.000Z",
    );
    expect(state.hours).toBe(2);
    expect(state.settled).toBe(true);
    expect(state.overdue).toBe(false);
  });

  it("is never overdue once it is settled, however slow the reply was", () => {
    const state = responseState(
      inquiry({ status: "replied", first_reply_at: "2026-09-15T08:00:00.000Z" }),
      "2026-09-20T10:00:00.000Z",
    );
    expect(state.overdue).toBe(false);
  });
});

describe("sortForPipeline", () => {
  const oldOpen = inquiry({ id: "old", created_at: "2026-09-01T00:00:00.000Z", status: "new" });
  const newOpen = inquiry({ id: "new", created_at: "2026-09-09T00:00:00.000Z", status: "replied" });
  const oldDone = inquiry({ id: "done-old", created_at: "2026-09-02T00:00:00.000Z", status: "confirmed" });
  const newDone = inquiry({ id: "done-new", created_at: "2026-09-08T00:00:00.000Z", status: "declined" });

  it("puts whoever has waited longest at the very top", () => {
    const order = sortForPipeline([newDone, newOpen, oldDone, oldOpen]).map((i) => i.id);
    expect(order).toEqual(["old", "new", "done-new", "done-old"]);
  });

  it("keeps every open enquiry above every closed one", () => {
    const sorted = sortForPipeline([newDone, oldDone, newOpen]);
    expect(sorted[0].id).toBe("new");
  });

  it("does not mutate the array it was given", () => {
    const input = [newOpen, oldOpen];
    sortForPipeline(input);
    expect(input.map((i) => i.id)).toEqual(["new", "old"]);
  });

  it("needingReply keeps only what is still open", () => {
    expect(needingReply([newDone, oldOpen, newOpen, oldDone]).map((i) => i.id)).toEqual([
      "old",
      "new",
    ]);
  });
});

describe("repeat guests", () => {
  it("folds a local 09 number onto its +63 form", () => {
    expect(normalisePhone("0917 000 0000")).toBe("639170000000");
    expect(normalisePhone("+63 917 000 0000")).toBe("639170000000");
    expect(normalisePhone("(0917) 000-0000")).toBe("639170000000");
  });

  it("ignores junk that cannot be a number", () => {
    expect(normalisePhone("n/a")).toBeNull();
    expect(normalisePhone(null)).toBeNull();
  });

  it("matches the same person across two enquiries by email", () => {
    const keys = repeatGuestKeys([
      inquiry({ email: "maria@email.com" }),
      inquiry({ id: "i2", email: "MARIA@email.com" }),
      inquiry({ id: "i3", email: "someone@else.com" }),
    ]);
    expect(keys.has("email:maria@email.com")).toBe(true);
    expect(keys.has("email:someone@else.com")).toBe(false);
  });

  it("falls back to the phone number when there is no email", () => {
    expect(guestKey({ email: "", phone: "0917 000 0000" })).toBe("phone:639170000000");
  });
});

describe("reply shortcuts", () => {
  it("pre-fills a mailto with the guest's dates", () => {
    const link = mailtoLink(inquiry(), "Sonia's Loft");
    expect(link.startsWith("mailto:maria@email.com")).toBe(true);
    expect(decodeURIComponent(link)).toContain("2026-10-01 to 2026-10-03");
    expect(decodeURIComponent(link)).toContain("Hi Maria,");
  });

  it("builds a wa.me link from a local number", () => {
    expect(whatsappLink(inquiry(), "Sonia's Loft")?.startsWith("https://wa.me/639170000000")).toBe(
      true,
    );
  });

  it("offers no WhatsApp link when there is no mobile", () => {
    expect(whatsappLink(inquiry({ phone: null }), "Sonia's Loft")).toBeNull();
  });
});
