import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* The SendGrid transport talks to an API this suite cannot reach, so what is
   pinned here is the request it builds: the right URL, the key in the right
   header, and a body matching SendGrid's v3 mail/send schema. A wrong field
   name would otherwise surface as a 400 in production, on a real enquiry.

   Gmail goes through nodemailer, which is replaced below for the same reason:
   what matters is the login and message handed to it, and what each of
   Google's refusals turns into.

   notify.ts reads its configuration once at module load, so each case sets the
   environment and then imports it fresh. */
const gmail = vi.hoisted(() => ({
  createTransport: vi.fn(),
  sendMail: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  default: { createTransport: gmail.createTransport },
}));

beforeEach(() => {
  gmail.createTransport.mockReset().mockReturnValue({ sendMail: gmail.sendMail });
  gmail.sendMail.mockReset().mockResolvedValue({ messageId: "<test@gmail.com>" });
});

async function loadNotify(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return import("./notify");
}

const CLEAN = {
  GMAIL_USER: undefined,
  GMAIL_APP_PASSWORD: undefined,
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

  it("uses Gmail when its address and app password are set", async () => {
    const notify = await loadNotify({
      ...CLEAN,
      GMAIL_USER: "you@gmail.com",
      GMAIL_APP_PASSWORD: "abcdefghijklmnop",
    });
    expect(notify.MAIL_PROVIDER).toBe("gmail");
  });

  it("prefers Gmail over keys left behind by earlier attempts", async () => {
    const notify = await loadNotify({
      ...CLEAN,
      GMAIL_USER: "you@gmail.com",
      GMAIL_APP_PASSWORD: "abcdefghijklmnop",
      SENDGRID_API_KEY: "SG.test",
      RESEND_API_KEY: "re_test",
    });
    expect(notify.MAIL_PROVIDER).toBe("gmail");
  });

  it("still picks Gmail with one of its two variables, so the other gets named", async () => {
    const notify = await loadNotify({ ...CLEAN, GMAIL_USER: "you@gmail.com" });
    expect(notify.MAIL_PROVIDER).toBe("gmail");
    expect(notify.configProblem()).toContain("GMAIL_APP_PASSWORD");
  });

  it("lets MAIL_PROVIDER override Gmail", async () => {
    const notify = await loadNotify({
      ...CLEAN,
      GMAIL_USER: "you@gmail.com",
      GMAIL_APP_PASSWORD: "abcdefghijklmnop",
      SENDGRID_API_KEY: "SG.test",
      MAIL_PROVIDER: "sendgrid",
    });
    expect(notify.MAIL_PROVIDER).toBe("sendgrid");
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
    expect(notify.configProblem()).toContain("Single Sender Verification");
  });

  it("falls back to the shared test sender on Resend", async () => {
    const notify = await loadNotify({ ...CLEAN, RESEND_API_KEY: "re_test" });
    expect(notify.configProblem()).toBeNull();
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
    expect(result).toEqual({ ok: false, error: notify.MAIL_OFF_REASON });
    expect(notify.MAIL_OFF_REASON).toContain("GMAIL_APP_PASSWORD");
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

describe("Gmail configuration", () => {
  it("names a missing GMAIL_USER", async () => {
    const notify = await loadNotify({ ...CLEAN, GMAIL_APP_PASSWORD: "abcdefghijklmnop" });
    expect(notify.configProblem()).toContain("GMAIL_USER is not set");
  });

  it("rejects a GMAIL_USER written as a sender, name and all", async () => {
    const notify = await loadNotify({
      ...CLEAN,
      GMAIL_USER: "Sonia's Loft <you@gmail.com>",
      GMAIL_APP_PASSWORD: "abcdefghijklmnop",
    });
    expect(notify.configProblem()).toContain("just the address");
  });

  it("ignores NOTIFY_FROM - even a broken one left over from SendGrid", async () => {
    const notify = await loadNotify({
      ...CLEAN,
      GMAIL_USER: "you@gmail.com",
      GMAIL_APP_PASSWORD: "abcdefghijklmnop",
      NOTIFY_FROM: "Sonia's Loft <<someone-else@gmail.com>",
    });
    expect(notify.configProblem()).toBeNull();
    expect(notify.FROM_ADDRESS).toBe("Sonia's Loft <you@gmail.com>");
  });

  it("does not reach Gmail when a variable is missing", async () => {
    const notify = await loadNotify({ ...CLEAN, GMAIL_USER: "you@gmail.com" });

    const result = await notify.sendEmail(MESSAGE);

    expect(result.ok).toBe(false);
    expect(gmail.createTransport).not.toHaveBeenCalled();
  });
});

describe("the Gmail send", () => {
  const env = {
    ...CLEAN,
    GMAIL_USER: "you@gmail.com",
    // Pasted the way Google displays it.
    GMAIL_APP_PASSWORD: "abcd efgh ijkl mnop",
  };

  it("logs into smtp.gmail.com over TLS with the app password, spaces removed", async () => {
    const notify = await loadNotify(env);

    await notify.sendEmail(MESSAGE);

    expect(gmail.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: "you@gmail.com", pass: "abcdefghijklmnop" },
      }),
    );
  });

  it("gives up connecting in seconds, not nodemailer's default two minutes", async () => {
    const notify = await loadNotify(env);

    await notify.sendEmail(MESSAGE);

    const options = gmail.createTransport.mock.calls[0][0];
    expect(options.connectionTimeout).toBeLessThanOrEqual(10_000);
    expect(options.greetingTimeout).toBeLessThanOrEqual(10_000);
  });

  it("sends from the site name at the Gmail address, with the guest as reply-to", async () => {
    const notify = await loadNotify(env);

    const result = await notify.sendEmail({ ...MESSAGE, replyTo: "maria@email.com" });

    expect(result).toEqual({ ok: true });
    expect(gmail.sendMail).toHaveBeenCalledWith({
      from: { name: "Sonia's Loft", address: "you@gmail.com" },
      to: "sonia@example.com",
      subject: "New enquiry - Maria Santos",
      html: "<p>Someone enquired.</p>",
      replyTo: "maria@email.com",
    });
  });

  it("leaves replyTo off rather than sending an empty one", async () => {
    const notify = await loadNotify(env);

    await notify.sendEmail(MESSAGE);

    expect(gmail.sendMail.mock.calls[0][0]).not.toHaveProperty("replyTo");
  });
});

describe("Gmail failures", () => {
  const env = {
    ...CLEAN,
    GMAIL_USER: "you@gmail.com",
    GMAIL_APP_PASSWORD: "abcdefghijklmnop",
  };

  /** A rejection shaped like the ones nodemailer raises for SMTP replies. */
  function smtpError(fields: { code?: string; responseCode?: number; response?: string }) {
    return Object.assign(new Error(fields.response ?? fields.code ?? "failed"), fields);
  }

  it("says plainly when the normal password was used instead of an app password", async () => {
    const notify = await loadNotify(env);
    gmail.sendMail.mockRejectedValue(
      smtpError({
        code: "EAUTH",
        responseCode: 534,
        response: "534-5.7.9 Application-specific password required.",
      }),
    );

    const result = await notify.sendEmail(MESSAGE);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("not the account's normal password");
      expect(result.error).toContain("534-5.7.9 Application-specific password required.");
    }
  });

  it("names both variables when the login is refused", async () => {
    const notify = await loadNotify(env);
    gmail.sendMail.mockRejectedValue(
      smtpError({
        code: "EAUTH",
        responseCode: 535,
        response: "535-5.7.8 Username and Password not accepted.",
      }),
    );

    const result = await notify.sendEmail(MESSAGE);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("GMAIL_USER");
      expect(result.error).toContain("GMAIL_APP_PASSWORD");
      expect(result.error).toContain("535-5.7.8 Username and Password not accepted.");
    }
  });

  it("reports an unreachable server as that, not as a login problem", async () => {
    const notify = await loadNotify(env);
    gmail.sendMail.mockRejectedValue(smtpError({ code: "ETIMEDOUT" }));

    const result = await notify.sendEmail(MESSAGE);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Could not reach Gmail");
  });

  it("passes anything else through in Google's own words", async () => {
    const notify = await loadNotify(env);
    gmail.sendMail.mockRejectedValue(
      smtpError({
        code: "EMESSAGE",
        responseCode: 550,
        response: "550-5.4.5 Daily user sending limit exceeded.",
      }),
    );

    const result = await notify.sendEmail(MESSAGE);

    expect(result).toEqual({
      ok: false,
      error: "Gmail did not send it. Google said: 550-5.4.5 Daily user sending limit exceeded.",
    });
  });
});
