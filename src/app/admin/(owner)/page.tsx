import Link from "next/link";
import { AlertTriangle, ArrowRight, MailWarning } from "lucide-react";
import { loadAdminData, loadFlaggedTurnovers } from "@/lib/admin-data";
import { needingReply, responseState } from "@/lib/pipeline";
import { arrivalsBetween, departuresBetween } from "@/lib/availability";
import { monthPerformance, formatPeso } from "@/lib/rates";
import { INQUIRY_SOURCES } from "@/lib/types";
import { addDays, addMonths, formatDayMonth, todayKey } from "@/lib/dates";
import { MONTH_NAMES } from "@/lib/dates";
import { MAIL_CONFIGURED } from "@/lib/notify";
import { ResponseBadge } from "@/components/admin/ResponseBadge";

export const revalidate = 0;

/* How far back a missing notification is still worth mentioning. Older than
   this and nobody can do anything about it. */
const NOTIFY_WARNING_DAYS = 7;

export default async function DashboardPage() {
  const [{ inquiries, holds, settings, rateRules, error }, flagged] = await Promise.all([
    loadAdminData(),
    loadFlaggedTurnovers(),
  ]);

  const holdsById = Object.fromEntries(holds.map((hold) => [hold.id, hold]));

  const today = todayKey();
  const now = new Date();
  const thisMonth = { year: now.getFullYear(), month: now.getMonth() };
  const lastMonth = addMonths(thisMonth.year, thisMonth.month, -1);

  const open = needingReply(inquiries);
  const oldest = open[0];
  const overdue = open.filter((i) => responseState(i, now.toISOString()).overdue);

  /* Only recent enquiries. notified_at did not exist before the migration, so
     every enquiry taken before then is null and would otherwise be reported
     as a failed send forever - and a notification that failed months ago is
     not something anyone can act on now anyway. */
  const notifyCutoff = addDays(today, -NOTIFY_WARNING_DAYS);
  const unnotified = inquiries.filter(
    (i) => i.status === "new" && !i.notified_at && i.created_at.slice(0, 10) >= notifyCutoff,
  );

  const arrivals = arrivalsBetween(holds, today, 7);
  const departures = departuresBetween(holds, today, 7);

  const current = monthPerformance(holds, rateRules, thisMonth.year, thisMonth.month);
  const previous = monthPerformance(holds, rateRules, lastMonth.year, lastMonth.month);
  const occupancyDelta = current.occupancy - previous.occupancy;

  const sourceCounts = INQUIRY_SOURCES.map((source) => ({
    source,
    count: inquiries.filter((i) => i.source === source).length,
  })).filter((row) => row.count > 0);
  const sourceTotal = sourceCounts.reduce((sum, row) => sum + row.count, 0);

  return (
    <div>
      <h1 className="font-display text-[2.5rem] font-light leading-[1.08] text-ink-900">
        Today at the loft
      </h1>

      {error && (
        <p className="mt-8 rounded-sm border border-teak-600 bg-sand px-5 py-4 text-[0.875rem] leading-[1.65] text-teak-600">
          {error}
        </p>
      )}

      {/* The thing that matters most, given the same-day promise on the site. */}
      <section className="mt-10 rounded-md border border-stone bg-sand p-7 md:p-9">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <p className="eyebrow">Waiting on you</p>
            <p className="mt-3 font-display text-[2.5rem] font-light leading-none text-ink-900">
              {open.length}
            </p>
          </div>

          {overdue.length > 0 && (
            <p className="flex items-center gap-2 text-[0.875rem] text-teak-600">
              <AlertTriangle className="h-4 w-4" strokeWidth={1.5} />
              {overdue.length} past the same-day promise
            </p>
          )}
        </div>

        {oldest ? (
          <div className="mt-7 border-t border-stone pt-7">
            <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500">
              Longest waiting
            </p>

            <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <p className="font-display text-[1.5rem] font-light text-ink-900">{oldest.name}</p>
              <ResponseBadge inquiry={oldest} />
            </div>

            <p className="mt-2 text-[0.875rem] text-ink-500">
              {oldest.check_in && oldest.check_out
                ? `${formatDayMonth(oldest.check_in)} to ${formatDayMonth(oldest.check_out)}`
                : "No dates given"}
              {oldest.guests ? ` · ${oldest.guests} guests` : ""}
            </p>

            {oldest.message && (
              <p className="mt-4 max-w-prose text-[0.9375rem] leading-[1.7] text-ink-500">
                {oldest.message}
              </p>
            )}

            <Link
              href="/admin/enquiries"
              className="mt-6 inline-flex items-center gap-1.5 text-[0.8125rem] text-brass-600 underline decoration-brass-400 underline-offset-4"
            >
              Reply to this one
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </div>
        ) : (
          <p className="mt-6 text-[0.9375rem] text-ink-500">
            Nothing is waiting. Every enquiry has had a reply.
          </p>
        )}

        {/* Two different problems wearing the same symptom, so they get two
            different sentences: email was never switched on, or it is on and
            a send failed. Only the second is a fault. */}
        {unnotified.length > 0 && (
          <p
            className={`mt-7 flex items-start gap-2.5 rounded-sm border px-4 py-3 text-[0.8125rem] leading-[1.6] ${
              MAIL_CONFIGURED ? "border-teak-600 text-teak-600" : "border-stone text-ink-500"
            }`}
          >
            <MailWarning className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>
              {MAIL_CONFIGURED ? (
                <>
                  The alert for {unnotified.length === 1 ? "a new enquiry" : `${unnotified.length} new enquiries`}{" "}
                  did not send. Check the notification address in{" "}
                  <Link href="/admin/settings" className="underline underline-offset-4">
                    Settings
                  </Link>
                  .
                </>
              ) : (
                <>
                  Email alerts are not switched on yet, so nobody was told about{" "}
                  {unnotified.length === 1 ? "a new enquiry" : `${unnotified.length} new enquiries`}{" "}
                  from the last {NOTIFY_WARNING_DAYS} days. Enquiries are still being saved
                  safely - they just need somebody to look here.
                </>
              )}
            </span>
          </p>
        )}
      </section>

      {/* What the staff have flagged. Unpriced on purpose - they report it,
          the owner decides what it costs. */}
      {flagged.length > 0 && (
        <section className="mt-14">
          <p className="eyebrow">Flagged by staff</p>

          <ul className="mt-6 space-y-3">
            {flagged.map((turnover) => {
              const hold = holdsById[turnover.hold_id];

              return (
                <li
                  key={turnover.id}
                  className="rounded-md border border-teak-600 bg-sand px-5 py-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <p className="text-[0.9375rem] text-ink-900">
                      {hold ? (
                        <Link
                          href={`/admin/bookings/${hold.id}`}
                          className="underline decoration-stone underline-offset-4 hover:decoration-ink-900"
                        >
                          {hold.guest_name}
                        </Link>
                      ) : (
                        "A stay"
                      )}
                    </p>
                    <span className="text-[0.8125rem] tabular-nums text-ink-500">
                      out {formatDayMonth(turnover.due_on)}
                    </span>
                  </div>

                  {turnover.notes && (
                    <p className="mt-2 text-[0.875rem] leading-[1.65] text-ink-500">
                      {turnover.notes}
                    </p>
                  )}

                  {hold && (
                    <Link
                      href={`/admin/bookings/${hold.id}`}
                      className="mt-3 inline-block text-[0.8125rem] text-brass-600 underline decoration-brass-400 underline-offset-4"
                    >
                      Log it as a charge
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Next seven days */}
      <section className="mt-14">
        <p className="eyebrow">The next seven days</p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <ArrivalList title="Checking in" holds={arrivals} dateOf={(h) => h.check_in} />
          <ArrivalList title="Checking out" holds={departures} dateOf={(h) => h.check_out} />
        </div>
      </section>

      {/* Money */}
      <section className="mt-14">
        <p className="eyebrow">{MONTH_NAMES[thisMonth.month]} so far</p>

        <dl className="mt-6 grid grid-cols-2 gap-6 border-t border-stone pt-8 lg:grid-cols-4">
          <Stat
            label="Occupancy"
            value={`${current.occupancy}%`}
            note={
              previous.nightsAvailable > 0
                ? `${occupancyDelta >= 0 ? "+" : ""}${occupancyDelta} pts vs ${MONTH_NAMES[lastMonth.month].slice(0, 3)}`
                : undefined
            }
          />
          <Stat label="Nights sold" value={String(current.nightsSold)} />
          <Stat
            label="Revenue"
            value={current.revenue > 0 ? formatPeso(current.revenue) : "-"}
            note={current.revenue === 0 ? "Set your rates in Settings" : undefined}
          />
          <Stat label="Avg nightly" value={current.adr > 0 ? formatPeso(current.adr) : "-"} />
        </dl>
      </section>

      {/* Where enquiries come from */}
      {sourceTotal > 0 && (
        <section className="mt-14">
          <p className="eyebrow">Where enquiries come from</p>

          <ul className="mt-6 space-y-3 border-t border-stone pt-8">
            {sourceCounts.map((row) => (
              <li key={row.source} className="flex items-center gap-4">
                <span className="w-20 text-[0.8125rem] capitalize text-ink-700">{row.source}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-sm bg-shell">
                  <span
                    className="block h-full bg-lagoon-800"
                    style={{ width: `${Math.round((row.count / sourceTotal) * 100)}%` }}
                  />
                </span>
                <span className="w-8 text-right text-[0.8125rem] tabular-nums text-ink-500">
                  {row.count}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-16 border-t border-stone pt-7 text-[0.78125rem] leading-[1.7] text-ink-300">
        Weekend minimum {settings.weekend_min_nights} nights · turnover buffer{" "}
        {settings.turnover_buffer_nights}{" "}
        {settings.turnover_buffer_nights === 1 ? "night" : "nights"} ·{" "}
        <Link href="/admin/settings" className="underline underline-offset-4">
          change
        </Link>
      </p>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="font-display text-[2rem] font-light leading-none text-ink-900">{value}</dd>
      <p className="mt-3 text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500">{label}</p>
      {note && <p className="mt-1.5 text-[0.75rem] text-ink-300">{note}</p>}
    </div>
  );
}

function ArrivalList({
  title,
  holds,
  dateOf,
}: {
  title: string;
  holds: { id: string; guest_name: string; status: string; check_in: string; check_out: string }[];
  dateOf: (h: { check_in: string; check_out: string }) => string;
}) {
  return (
    <div className="rounded-md border border-stone bg-sand p-6">
      <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500">{title}</p>

      {holds.length === 0 ? (
        <p className="mt-4 text-[0.875rem] text-ink-300">Nobody this week.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {holds.map((hold) => (
            <li key={hold.id} className="flex items-baseline justify-between gap-4">
              <Link
                href={`/admin/bookings/${hold.id}`}
                className="text-[0.9375rem] text-ink-900 underline decoration-stone underline-offset-4 hover:decoration-ink-900"
              >
                {hold.guest_name}
              </Link>
              <span className="whitespace-nowrap text-[0.8125rem] tabular-nums text-ink-500">
                {formatDayMonth(dateOf(hold))}
                {hold.status === "tentative" && (
                  <span className="ml-2 text-brass-600">tentative</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
