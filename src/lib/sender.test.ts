import { describe, expect, it } from "vitest";
import { validateSender } from "./sender";

/* The rule is small; what is worth pinning is that a stray bracket - the real
   mistake that cost an afternoon - is caught and named rather than handed to
   the API to reject with something vaguer. */

describe("validateSender - accepts", () => {
  it("a bare address", () => {
    expect(validateSender("bookings@soniasloft.com")).toBeNull();
  });

  it("a named address", () => {
    expect(validateSender("Sonia's Loft <bookings@soniasloft.com>")).toBeNull();
  });

  it("the Resend test sender used as the built-in fallback", () => {
    expect(validateSender("Sonia's Loft <onboarding@resend.dev>")).toBeNull();
  });

  it("surrounding whitespace, which a copy-paste often brings along", () => {
    expect(validateSender("  bookings@soniasloft.com  ")).toBeNull();
  });

  it("a subdomain sender", () => {
    expect(validateSender("Sonia's Loft <mail@send.soniasloft.com>")).toBeNull();
  });
});

describe("validateSender - rejects", () => {
  it("a doubled opening bracket, naming the count and the variable", () => {
    const problem = validateSender("Sonia's Loft <<bookings@soniasloft.com>");
    expect(problem).toContain("2");
    expect(problem).toContain("NOTIFY_FROM");
  });

  it("a missing closing bracket", () => {
    expect(validateSender("Sonia's Loft <bookings@soniasloft.com")).not.toBeNull();
  });

  it("an address with no domain", () => {
    expect(validateSender("Sonia's Loft <bookings>")).not.toBeNull();
  });

  it("a domain with no dot", () => {
    expect(validateSender("bookings@localhost")).not.toBeNull();
  });

  it("an empty value", () => {
    expect(validateSender("")).not.toBeNull();
  });

  it("a name with no address at all", () => {
    expect(validateSender("Sonia's Loft")).not.toBeNull();
  });

  it("quotes the offending value back so it can be compared to the variable", () => {
    expect(validateSender("nonsense")).toContain("nonsense");
  });
});
