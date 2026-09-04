"use client";

import { useState, useTransition } from "react";
import { Mail, Phone, Trash2 } from "lucide-react";
import type { Inquiry, InquiryStatus } from "@/lib/types";
import { deleteInquiry, setInquiryStatus } from "@/app/admin/actions";
import { formatDateKey, formatTimestamp } from "@/lib/dates";

const STATUSES: InquiryStatus[] = ["new", "replied", "confirmed", "archived"];

const STATUS_STYLE: Record<InquiryStatus, string> = {
  new: "border-lagoon-800 text-lagoon-800",
  replied: "border-brass-600 text-brass-600",
  confirmed: "border-ink-900 text-ink-900",
  archived: "border-stone text-ink-300",
};

export function InquiryTable({ inquiries }: { inquiries: Inquiry[] }) {
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<InquiryStatus | "all">("all");

  const rows = filter === "all" ? inquiries : inquiries.filter((i) => i.status === filter);

  return (
    <div>
      {/* Filter row */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {(["all", ...STATUSES] as const).map((value) => (
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
            {value !== "all" && (
              <span className="ml-2 text-ink-300">
                {inquiries.filter((i) => i.status === value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-md border border-stone bg-sand px-8 py-16 text-center">
          <p className="font-display text-[1.5rem] font-light text-ink-900">Nothing here yet</p>
          <p className="mt-3 text-[0.9375rem] text-ink-500">
            Enquiries from the website land in this table.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-stone bg-sand">
          <table className="w-full min-w-[62rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-stone">
                {["Guest", "Dates", "Guests", "Message", "Received", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-4 text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ink-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-stone align-top last:border-b-0 ${
                    pending ? "opacity-60" : ""
                  }`}
                >
                  <td className="px-5 py-5">
                    <p className="text-[0.9375rem] font-medium text-ink-900">{row.name}</p>
                    <a
                      href={`mailto:${row.email}`}
                      className="mt-1.5 flex items-center gap-2 text-[0.8125rem] text-brass-600 underline decoration-brass-400 underline-offset-4"
                    >
                      <Mail className="h-3 w-3" strokeWidth={1.5} />
                      {row.email}
                    </a>
                    {row.phone && (
                      <a
                        href={`tel:${row.phone.replace(/\s/g, "")}`}
                        className="mt-1 flex items-center gap-2 text-[0.8125rem] text-ink-500"
                      >
                        <Phone className="h-3 w-3" strokeWidth={1.5} />
                        {row.phone}
                      </a>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-5 py-5 text-[0.875rem] text-ink-700">
                    {formatDateKey(row.check_in)}
                    <span className="mx-2 text-ink-300">to</span>
                    {formatDateKey(row.check_out)}
                  </td>

                  <td className="px-5 py-5 text-[0.875rem] tabular-nums text-ink-700">
                    {row.guests ?? "-"}
                  </td>

                  <td className="max-w-[22rem] px-5 py-5 text-[0.875rem] leading-[1.65] text-ink-500">
                    {row.message || <span className="text-ink-300">-</span>}
                  </td>

                  <td className="whitespace-nowrap px-5 py-5 text-[0.8125rem] text-ink-500">
                    {formatTimestamp(row.created_at)}
                  </td>

                  <td className="px-5 py-5">
                    <select
                      value={row.status}
                      disabled={pending}
                      onChange={(e) => {
                        const next = e.target.value as InquiryStatus;
                        startTransition(() => {
                          void setInquiryStatus(row.id, next);
                        });
                      }}
                      className={`rounded-sm border bg-sand px-3 py-2 text-[0.6875rem] uppercase tracking-[0.15em] focus:outline-none ${STATUS_STYLE[row.status]}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-5 py-5">
                    <button
                      type="button"
                      disabled={pending}
                      aria-label={`Delete enquiry from ${row.name}`}
                      onClick={() => {
                        if (confirm(`Delete the enquiry from ${row.name}? This cannot be undone.`)) {
                          startTransition(() => {
                            void deleteInquiry(row.id);
                          });
                        }
                      }}
                      className="rounded-sm p-2 text-ink-300 transition-colors duration-300 ease-calm hover:bg-sand hover:text-teak-600"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
