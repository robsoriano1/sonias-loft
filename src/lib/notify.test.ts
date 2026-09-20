import { afterEach, describe, expect, it, vi } from "vitest";

/* The SendGrid transport talks to an API this suite cannot reach, so what is
   pinned here is the request it builds: the right URL, the key in the right
   header, and a body matching SendGrid's v3 mail/send schema. A wrong field
   name would otherwise surface as a 400 in production, on a real enquiry.

   notify.ts reads its configuration once at module load, so each case sets the
   environment and then imports it fresh. */
async function loadNotify(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return import("./notify");
}

const CLEAN = {
  SENDGRID_API_KEY: undefined,
  RESEND_API_KEY: undefined,
  MAIL_PROVIDER: undefined,
  NOTIFY_FROM: undefined,
};

const MESSAGE = {
  to: "sonia@example.com",
  subject: "New enquiry - Maria Santos",
  html: "<p>Someone enquired.</p>",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Captures the outgoing request and answers with the given status. */
function stubFetch(status: number, body?: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];

  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => body ?? {},
      } as unknown as Response;
    }),
  );

  return calls;
}

describe("provider selection", () => {
  it("is off with no keys at all", async () => {
    const notify = await loadNotify({ ...CLEAN });
    expect(notify.MAIL_PROVIDER).toBe("none");
    expect(notify.MAIL_CONFIGURED).toBe(false);
  });

  it("uses SendGrid when only its key is set", async () => {
    const notify = await loadNotify({ ...CLEAN, SENDGRID_API_KEY: "SG.test" });
    expect(notify.MAIL_PROVIDER).toBe("sendgrid");
  });

  it("uses Resend when only its key is set", async () => {
    const notify = await loadNotify({ ...CLEAN, RESEND_API_KEY: "re_test" });
    expect(notify.MAIL_PROVIDER).toBe("resend");
  });

  it("prefers SendGrid when both are set", async () => {
    const notify = await loadNotify({
      ...CLEAN,
      SENDGRID_API_KEY: "SG.test",
      RESEND_API_KEY: "re_test",
    });
    expect(notify.MAIL_PROVIDER).toBe("sendgrid");
  });

  it("honours MAIL_PROVIDER when both are set", async () => {
    const notify = await loadNotify({
      ...CLEAN,
      SENDGRID_API_KEY: "SG.test",
      RESEND_API_KEY: "re_test",
      MAIL_PROVIDER: "resend",
    });
    expect(notify.MAIL_PROVIDER).toBe("resend");
  });

  it("refuses to fall back when MAIL_PROVIDER names a provider with no key", async () => {
    const notify = await loadNotify({
      ...CLEAN,
      RESEND_API_KEY: "re_test",
      MAIL_PROVIDER: "sendgrid",
    });
    expect(notify.MAIL_PROVIDER).toBe("none");
  });
});

describe("sender requirements", () => {
  it("demands NOTIFY_FROM on SendGrid, which has no shared sender", async () => {
    const notify = await loadNotify({ ...CLEAN, SENDGRID_API_KEY: "SG.test" });
    expect(notify.senderProblem()).toContain("Single Sender Verification");
  });

  it("falls back to the shared test sender on Resend", async () => {
    const notify = await loadNotify({ ...CLEAN, RESEND_API_KEY: "re_test" });
    expect(notify.senderProblem()).toBeNull();
    expect(notify.USING_TEST_SENDER).toBe(true);
  });

  it("does not claim a test sender on SendGrid", async () => {
    const notify = await loadNotify({
      ...CLEAN,
      SENDGRID_API_KEY: "SG.test",
      NOTIFY_FROM: "Sonia's Loft <you@gmail.com>",
    });
    expect(notify.USING_TEST_SENDER).toBe(false);
  });

  it("refuses to send at all with no provider", async () => {
    const notify = await loadNotify({ ...CLEAN });
    const result = await notify.sendEmail(MESSAGE);
    expect(result).toEqual({
      ok: false,
      error: "No mail provider configured - set SENDGRID_API_KEY or RESEND_API_KEY.",
    });
  });

  it("rejects a malformed sender before calling out", async () => {
    const notify = await loadNotify({
      ...CLEAN,
      SENDGRID_API_KEY: "SG.test",
      NOTIFY_FROM: "Sonia's Loft <<you@gmail.com>",
    });
    const calls = stubFetch(202);

    const result = await notify.sendEmail(MESSAGE);

    expect(result.ok).toBe(false);
    expect(calls).toHaveLength(0); // never reached the network
  });
});

describe("the SendGrid request", () => {
  const env = {
    ...CLEAN,
    SENDGRID_API_KEY: "SG.secret",
    NOTIFY_FROM: "Sonia's Loft <you@gmail.com>",
  };

  it("posts v3 mail/send with the key as a bearer token", async () => {
    const notify = await loadNotify(env);
    const calls = stubFetch(202);

    await notify.sendEmail(MESSAGE);

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://api.sendgrid.com/v3/mail/send");
    expect(calls[0].init.method).toBe("POST");
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe(
      "Bearer SG.secret",
    );
  });

  it("builds a body matching SendGrid's schema", async () => {
    const notify = await loadNotify(env);
    const calls = stubFetch(202);

    await notify.sendEmail({ ...MESSAGE, replyTo: "maria@email.com" });

    expect(JSON.parse(calls[0].init.body as string)).toEqual({
      personalizations: [{ to: [{ email: "sonia@example.com" }] }],
      from: { email: "you@gmail.com", name: "Sonia's Loft" },
      subject: "New enquiry - Maria Santos",
      content: [{ type: "text/html", value: "<p>Someone enquired.</p>" }],
      reply_to: { email: "maria@email.com" },
    });
  });

  it("omits reply_to entirely rather than sending an empty one", async () => {
    const notify = await loadNotify(env);
    const calls = stubFetch(202);

    await notify.sendEmail(MESSAGE);

    expect(JSON.parse(calls[0].init.body as string)).not.toHaveProperty("reply_to");
  });

  it("sends a bare address with no name field", async () => {
    const notify = await loadNotify({ ...env, NOTIFY_FROM: "you@gmail.com" });
    const calls = stubFetch(202);

    await notify.sendEmail(MESSAGE);

    expect(JSON.parse(calls[0].init.body as string).from).toEqual({ email: "you@gmail.com" });
  });

  it("treats 202 as sent", async () => {
    const notify = await loadNotify(env);
    stubFetch(202);
    expect(await notify.sendEmail(MESSAGE)).toEqual({ ok: true });
  });
});

describe("SendGrid failures", () => {
  const env = {
    ...CLEAN,
    SENDGRID_API_KEY: "SG.secret",
    NOTIFY_FROM: "Sonia's Loft <you@gmail.com>",
  };

  it("passes an unverified-sender rejection through verbatim", async () => {
    const notify = await loadNotify(env);
    stubFetch(403, {
      errors: [{ message: "The from address does not match a verified Sender Identity." }],
    });

    const result = await notify.sendEmail(MESSAGE);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("verified Sender Identity");
  });

  it("names a bad key as a key problem", async () => {
    const notify = await loadNotify(env);
    stubFetch(401, { errors: [{ message: "Permission denied" }] });

    const result = await notify.sendEmail(MESSAGE);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("API key");
  });

  it("still reports something useful when the body is not JSON", async () => {
    const notify = await loadNotify(env);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("not json");
        },
      })),
    );

    const result = await notify.sendEmail(MESSAGE);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("500");
  });

  it("turns a thrown network error into a result rather than letting it escape", async () => {
    const notify = await loadNotify(env);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("socket hang up");
      }),
    );

    // The enquiry must survive the mail provider being unreachable.
    const result = await notify.sendEmail(MESSAGE);

    expect(result).toEqual({ ok: false, error: "socket hang up" });
  });
});
