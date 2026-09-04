"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  MONTH_NAMES,
  WEEKDAY_INITIALS,
  addMonths,
  monthGrid,
  nightsBetween,
  toKey,
  todayKey,
} from "@/lib/dates";
import { setBlockedRange, toggleBlockedDate } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";

/* ============================================================================
 *  Owner calendar.
 *  Click any day to flip it between Available and Booked. That is the whole
 *  interaction. A date-range control underneath handles a long stay in one go.
 *  State is deliberately dumb: server actions revalidate, Next re-renders.
 * ========================================================================== */
export function CalendarManager({ blocked }: { blocked: string[] }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [pending, startTransition] = useTransition();
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  const blockedSet = useMemo(() => new Set(blocked), [blocked]);
  const today = todayKey();
  const months = [cursor, addMonths(cursor.year, cursor.month, 1)];

  function applyRange(shouldBlock: boolean) {
    if (!rangeStart || !rangeEnd || rangeEnd <= rangeStart) return;
    const days = nightsBetween(rangeStart, rangeEnd);
    startTransition(() => {
      void setBlockedRange(days, shouldBlock);
    });
  }

  return (
    <div className="rounded-md border border-stone bg-sand">
      <div className="flex items-center justify-between border-b border-stone px-5 py-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setCursor(addMonths(cursor.year, cursor.month, -1))}
            className="rounded-sm p-2 text-ink-500 transition-colors duration-300 ease-calm hover:bg-sand hover:text-ink-900"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setCursor(addMonths(cursor.year, cursor.month, 1))}
            className="rounded-sm p-2 text-ink-500 transition-colors duration-300 ease-calm hover:bg-sand hover:text-ink-900"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500">
          {pending ? "Saving" : "Click a day to toggle it"}
        </p>

        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin text-ink-300" strokeWidth={1.5} />
        ) : (
          <span className="h-4 w-4" />
        )}
      </div>

      <div className="grid gap-10 p-5 sm:p-7 md:grid-cols-2 md:gap-8">
        {months.map(({ year, month }) => (
          <div key={`${year}-${month}`}>
            <p className="mb-5 font-display text-[1.25rem] font-normal text-ink-900">
              {MONTH_NAMES[month]} {year}
            </p>

            <div className="grid grid-cols-7 gap-1">
              {WEEKDAY_INITIALS.map((d, i) => (
                <div
                  key={`${d}-${i}`}
                  className="pb-2 text-center text-[0.6875rem] uppercase tracking-[0.1em] text-ink-300"
                >
                  {d}
                </div>
              ))}

              {monthGrid(year, month).map((day, i) => {
                if (day === null) return <div key={`pad-${i}`} />;

                const key = toKey(year, month, day);
                const isBlocked = blockedSet.has(key);
                const isPast = key < today;

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={pending}
                    title={isBlocked ? "Booked - click to free up" : "Available - click to block"}
                    onClick={() =>
                      startTransition(() => {
                        void toggleBlockedDate(key, isBlocked);
                      })
                    }
                    className={[
                      "flex h-10 items-center justify-center rounded-sm border text-[0.875rem] tabular-nums transition-colors duration-300 ease-calm disabled:cursor-wait",
                      isBlocked
                        ? "border-ink-900 bg-ink-900 text-shell hover:bg-ink-700"
                        : "border-stone bg-sand text-ink-900 hover:border-lagoon-800 hover:bg-lagoon-50",
                      isPast && !isBlocked ? "text-ink-300" : "",
                    ].join(" ")}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Range control */}
      <div className="border-t border-stone px-5 py-6 sm:px-7">
        <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500">
          Block a whole stay
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-[0.78125rem] text-ink-500" htmlFor="range-start">
              Check in
            </label>
            <input
              id="range-start"
              type="date"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              className="mt-2 rounded-sm border border-stone px-3 py-2.5 text-[0.9375rem] focus:border-lagoon-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[0.78125rem] text-ink-500" htmlFor="range-end">
              Check out
            </label>
            <input
              id="range-end"
              type="date"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              className="mt-2 rounded-sm border border-stone px-3 py-2.5 text-[0.9375rem] focus:border-lagoon-800 focus:outline-none"
            />
          </div>

          <Button type="button" onClick={() => applyRange(true)} disabled={pending} className="py-3">
            Block
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => applyRange(false)}
            disabled={pending}
            className="py-3"
          >
            Free up
          </Button>
        </div>

        <p className="mt-4 text-[0.78125rem] text-ink-300">
          Blocks every night from check-in up to, but not including, check-out.
        </p>
      </div>
    </div>
  );
}
