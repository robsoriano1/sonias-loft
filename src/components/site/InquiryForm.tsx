"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_CONFIGURED } from "@/lib/supabase/config";
import { enquiry, houseNotes, site } from "@/lib/content";
import { Section, SectionHeading, Lede } from "@/components/ui/Section";
import { Button, buttonClass } from "@/components/ui/Button";
import { todayKey } from "@/lib/dates";

const field =
  "w-full rounded-sm border border-stone bg-white px-4 py-3 text-[1rem] text-ink-900 placeholder:text-ink-300 transition-colors duration-300 ease-calm focus:border-lagoon-800 focus:outline-none";

const label = "block text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500";

export function InquiryForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string>("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError("");

    const data = new FormData(event.currentTarget);
    const checkIn = String(data.get("check_in") ?? "");
    const checkOut = String(data.get("check_out") ?? "");

    if (checkIn && checkOut && checkOut <= checkIn) {
      setStatus("error");
      setError("Check-out needs to be after check-in.");
      return;
    }

    if (!SUPABASE_CONFIGURED) {
      setStatus("error");
      setError(
        "The site is not connected to its database yet. Copy .env.local.example to .env.local and add your Supabase keys.",
      );
      return;
    }

    const guestsRaw = String(data.get("guests") ?? "");

    const { error: insertError } = await createClient().from("inquiries").insert({
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim() || null,
      check_in: checkIn || null,
      check_out: checkOut || null,
      guests: guestsRaw ? Number(guestsRaw) : null,
      message: String(data.get("message") ?? "").trim() || null,
    });

    if (insertError) {
      setStatus("error");
      setError("Something went wrong sending that. Please try again, or message us on Facebook.");
      return;
    }

    setStatus("sent");
  }

  return (
    <Section id="inquire" ruled>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeading eyebrow={enquiry.eyebrow}>{enquiry.heading}</SectionHeading>
          <Lede>{enquiry.body}</Lede>

          <ul className="mt-10 space-y-3 border-t border-stone pt-8">
            {houseNotes.map((note) => (
              <li key={note} className="flex gap-3 text-[0.875rem] leading-[1.65] text-ink-500">
                <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-lagoon-800" strokeWidth={1.5} />
                {note}
              </li>
            ))}
          </ul>

          {site.contact.facebook && (
            <a
              href={site.contact.facebook}
              target="_blank"
              rel="noreferrer"
              className={buttonClass("link", "mt-9")}
            >
              {enquiry.facebookLabel}
            </a>
          )}
        </div>

        <div className="hidden lg:col-span-1 lg:block" aria-hidden="true" />

        <div className="lg:col-span-7">
          {status === "sent" ? (
            <div className="rounded-md border border-stone bg-lagoon-50 px-8 py-14 text-center">
              <Check className="mx-auto h-6 w-6 text-lagoon-800" strokeWidth={1.25} />
              <h3 className="mt-6 font-display text-[1.875rem] font-light text-ink-900">
                {enquiry.successHeading}
              </h3>
              <p className="mx-auto mt-4 max-w-[38ch] text-[1rem] leading-[1.75] text-ink-500">
                {enquiry.successBody}
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-md border border-stone bg-white p-7 md:p-10"
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="name">
                    Name
                  </label>
                  <input id="name" name="name" required className={`${field} mt-3`} placeholder="Maria Santos" />
                </div>

                <div>
                  <label className={label} htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className={`${field} mt-3`}
                    placeholder="maria@email.com"
                  />
                </div>

                <div>
                  <label className={label} htmlFor="phone">
                    Mobile <span className="normal-case tracking-normal text-ink-300">(optional)</span>
                  </label>
                  <input id="phone" name="phone" className={`${field} mt-3`} placeholder="0917 000 0000" />
                </div>

                <div>
                  <label className={label} htmlFor="guests">
                    Guests
                  </label>
                  <input
                    id="guests"
                    name="guests"
                    type="number"
                    min={1}
                    max={20}
                    defaultValue={4}
                    className={`${field} mt-3`}
                  />
                </div>

                <div>
                  <label className={label} htmlFor="check_in">
                    Check in
                  </label>
                  <input
                    id="check_in"
                    name="check_in"
                    type="date"
                    min={todayKey()}
                    className={`${field} mt-3`}
                  />
                </div>

                <div>
                  <label className={label} htmlFor="check_out">
                    Check out
                  </label>
                  <input
                    id="check_out"
                    name="check_out"
                    type="date"
                    min={todayKey()}
                    className={`${field} mt-3`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={label} htmlFor="message">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className={`${field} mt-3 resize-y`}
                    placeholder="Tell us a little about your trip - who is coming, and anything you need."
                  />
                </div>
              </div>

              {status === "error" && (
                <p className="mt-6 rounded-sm border border-teak-600 bg-white px-4 py-3 text-[0.875rem] text-teak-600">
                  {error}
                </p>
              )}

              <div className="mt-9 flex items-center gap-5">
                <Button type="submit" disabled={status === "sending"}>
                  {status === "sending" && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />}
                  {status === "sending" ? "Sending" : enquiry.submitLabel}
                </Button>
                <p className="text-[0.78125rem] text-ink-300">No fees. No middleman.</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </Section>
  );
}
