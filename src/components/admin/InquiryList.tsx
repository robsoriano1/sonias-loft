"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  CalendarPlus,
  Mail,
  MessageCircle,
  Phone,
  Repeat,
  Trash2,
} from "lucide-react";
import type { Inquiry, InquiryStatus } from "@/lib/types";
import { INQUIRY_STATUSES } from "@/lib/types";
import { guestKey, mailtoLink, smsLink, sortForPipeline, whatsappLink } from "@/lib/pipeline";
import { deleteInquiry, holdFromInquiry, setInquiryStatus } from "@/app/admin/actions";
import { countNights, formatDateKey, formatTimestamp } from "@/lib/dates";
import { ResponseBadge } from "./ResponseBadge";

/* ============================================================================
 *  The enquiry pipeline.
 *
 *  Cards, not a table: the owner works through these on a phone, and a
 *  seven-column table on a 390px screen is a horizontal-scrolling apology.
 *  Each card carries the whole job - who, when, how long they have waited,
 *  one tap to reply, one tap to move them along.
 * ========================================================================== */

const STATUS_STYLE: Record<InquiryStatus, string> = {
  new: "border-lagoon-800 bg-lagoon-50 text-lagoon-800",
  replied: "border-brass-600 text-brass-600",
  confirmed: "border-ink-900 bg-ink-900 text-shell",
  declined: "border-stone text-ink-300",
  expired: "border-stone text-ink-300",
};

type Filter = InquiryStatus | "all" | "open";

const FILTERS: Filter[] = ["open", "all", ...INQUIRY_STATUSES];

export function InquiryList({
  inquiries,
  now,
  repeatKeys,
  heldInquiryIds,
  propertyName,
}: {
  inquiries: Inquiry[];
  now: string;
  repeatKeys: string[];
  heldInquiryIds: string[];
  propertyName: string;
}) {
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<Filter>("open");
  const [problem, setProblem] = useState("");

  const repeats = useMemo(() => new Set(repeatKeys), [repeatKeys]);
  const held = useMemo(() => new Set(heldInquiryIds), [heldInquiryIds]);
  const sorted = useMemo(() => sortForPipeline(inquiries), [inquiries]);

  const rows = sorted.filter((i) => {
    if (filter === "all") return true;
    if (filter === "open") return i.status === "new" || i.status === "replied";
    return i.status === filter;
  });

  function countFor(value: Filter) {
    if (value === "all") return inquiries.length;
    if (value === "open")
      return inquiries.filter((i) => i.status === "new" || i.status === "replied").length;
    return inquiries.filter((i) => i.status === value).length;
  }

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setProblem("");
    startTransition(async () => {
      const result = await action();
      if (!result.ok && result.error) setProblem(result.error);
    });
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-sm border px-4 py-2 text-[0.6875rem] uppercase tracking-[0.15em] transition-colors duration-300 ease-calm ${
              filter === value
                ? "border-ink-900 bg-ink-900 text-shell"
                : "border-stone bg-sand text-ink-500 hover:border-ink-900 hover:text-ink-900"
            }`}
          >
            {value}
            <span className={filter === value ? "ml-2 text-stone" : "ml-2 text-ink-300"}>
              {countFor(value)}
            </span>
          </button>
        ))}
      </div>

      {problem && (
        <p className="mb-6 rounded-sm border border-teak-600 bg-sand px-4 py-3 text-[0.875rem] text-teak-600">
          {problem}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="rounded-md border border-stone bg-sand px-8 py-16 text-center">
          <p className="font-display text-[1.5rem] font-light text-ink-900">
            {filter === "open" ? "Nothing is waiting" : "Nothing here yet"}
          </p>
          <p className="mt-3 text-[0.9375rem] text-ink-500">
            {filter === "open"
              ? "Every enquiry has had a reply."
              : "Enquiries from the website land here."}
          </p>
        </div>
      ) : (
        <ul className={`space-y-4 ${pending ? "opacity-60" : ""}`}>
          {rows.map((row) => {
            const isRepeat = repeats.has(guestKey(row));
            const whatsapp = whatsappLink(row, propertyName);
            const sms = smsLink(row, propertyName);
            const nights =
              row.check_in && row.check_out ? countNights(row.check_in, row.check_out) : 0;

            return (
              <li key={row.id} className="rounded-md border border-stone bg-sand p-6 md:p-7">
                {/* Who, and how long they have waited */}
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-display text-[1.375rem] font-light text-ink-900">
                        {row.name}
                      </p>
                      {isRepeat && (
                        <span
                          title="This guest has enquired before"
                          className="flex items-center gap-1.5 rounded-sm border border-brass-400 px-2 py-0.5 text-[0.625rem] uppercase tracking-[0.15em] text-brass-600"
                        >
                          <Repeat className="h-3 w-3" strokeWidth={1.5} />
                          Repeat
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-[0.8125rem] text-ink-300">
                      {formatTimestamp(row.created_at)} · via {row.source}
                    </p>
                  </div>

                  <ResponseBadge inquiry={row} now={now} />
                </div>

                {/* Dates */}
                <p className="mt-5 text-[0.9375rem] text-ink-700">
                  {row.check_in && row.check_out ? (
                    <>
                      {formatDateKey(row.check_in)}
                      <span className="mx-2 text-ink-300">to</span>
                      {formatDateKey(row.check_out)}
                      <span className="ml-2 text-ink-500">
                        ({nights} {nights === 1 ? "night" : "nights"}
                        {row.guests ? `, ${row.guests} guests` : ""})
                      </span>
                    </>
                  ) : (
                    <span className="text-ink-300">No dates given</span>
                  )}
                </p>

                {row.message && (
                  <p className="mt-4 max-w-prose border-l-2 border-stone pl-4 text-[0.9375rem] leading-[1.7] text-ink-500">
                    {row.message}
                  </p>
                )}

                {/* One tap to reply, pre-filled */}
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-stone pt-5">
                  <a
                    href={mailtoLink(row, propertyName)}
                    className="flex items-center gap-2 text-[0.8125rem] text-brass-600 underline decoration-brass-400 underline-offset-4"
                  >
                    <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Email
                  </a>

                  {whatsapp && (
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-[0.8125rem] text-brass-600 underline decoration-brass-400 underline-offset-4"
                    >
                      <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                      WhatsApp
                    </a>
                  )}

                  {sms && (
                    <a
                      href={sms}
                      className="flex items-center gap-2 text-[0.8125rem] text-ink-500 underline decoration-stone underline-offset-4"
                    >
                      <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
                      SMS
                    </a>
                  )}

                  <span className="text-[0.8125rem] text-ink-300">{row.email}</span>
                </div>

                {/* Move it along */}
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {INQUIRY_STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={pending || row.status === status}
                      onClick={() => run(() => setInquiryStatus(row.id, status))}
                      className={[
                        "rounded-sm border px-3.5 py-2 text-[0.6875rem] uppercase tracking-[0.15em] transition-colors duration-300 ease-calm disabled:cursor-default",
                        row.status === status
                          ? STATUS_STYLE[status]
                          : "border-stone text-ink-500 hover:border-ink-900 hover:text-ink-900",
                      ].join(" ")}
                    >
                      {status}
                    </button>
                  ))}

                  <span className="flex-1" />

                  {row.check_in && row.check_out && !held.has(row.id) && (
                    <button
                      type="button"
                      disabled={pending}
                      title="Put these dates on the calendar as a tentative hold"
                      onClick={() => run(() => holdFromInquiry(row.id))}
                      className="flex items-center gap-2 rounded-sm border border-stone px-3.5 py-2 text-[0.6875rem] uppercase tracking-[0.15em] text-ink-500 transition-colors duration-300 ease-calm hover:border-ink-900 hover:text-ink-900"
                    >
                      <CalendarPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Hold dates
                    </button>
                  )}

                  {held.has(row.id) && (
                    <Link
                      href="/admin/calendar"
                      className="text-[0.75rem] uppercase tracking-[0.15em] text-ink-300 underline underline-offset-4"
                    >
                      On the calendar
                    </Link>
                  )}

                  <button
                    type="button"
                    disabled={pending}
                    aria-label={`Delete enquiry from ${row.name}`}
                    onClick={() => {
                      if (confirm(`Delete the enquiry from ${row.name}? This cannot be undone.`)) {
                        run(() => deleteInquiry(row.id));
                      }
                    }}
                    className="rounded-sm p-2 text-ink-300 transition-colors duration-300 ease-calm hover:text-teak-600"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
