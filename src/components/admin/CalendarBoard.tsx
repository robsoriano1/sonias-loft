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
import { occupancyMap } from "@/lib/availability";
import type { Hold } from "@/lib/types";
import { setBlockedRange, toggleBlockedDate } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";

/* ============================================================================
 *  Owner calendar.
 *
 *  Three things can make a night unavailable and the owner needs to tell them
 *  apart at a glance:
 *
 *    confirmed stay   ink filled      - the guest is coming, it is public
 *    tentative hold   brass outline   - an enquiry in progress, private
 *    blocked by hand  hatched sand    - maintenance, family, whatever
 *
 *  Clicking a day still toggles the hand-block, exactly as it always has.
 *  Stays are managed in the list underneath, not by clicking days, because a
 *  stay is a range with a guest attached rather than a loose day.
 * ========================================================================== */
export function CalendarBoard({ holds, blocked }: { holds: Hold[]; blocked: string[] }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [pending, startTransition] = useTransition();
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  const blockedSet = useMemo(() => new Set(blocked), [blocked]);
  const occupancy = useMemo(() => occupancyMap(holds), [holds]);
  const byNight = useMemo(() => {
    const map = new Map<string, Hold>();
    for (const hold of holds) {
      if (hold.status === "released") continue;
      for (const night of nightsBetween(hold.check_in, hold.check_out)) {
        const existing = map.get(night);
        if (!existing || (existing.status !== "confirmed" && hold.status === "confirmed")) {
          map.set(night, hold);
        }
      }
    }
    return map;
  }, [holds]);

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
            className="rounded-sm p-2 text-ink-500 transition-colors duration-300 ease-calm hover:text-ink-900"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setCursor(addMonths(cursor.year, cursor.month, 1))}
            className="rounded-sm p-2 text-ink-500 transition-colors duration-300 ease-calm hover:text-ink-900"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500">
          {pending ? "Saving" : "Click a day to block it by hand"}
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
                const occupied = occupancy.get(key);
                const hold = byNight.get(key);
                const isPast = key < today;

                const title = hold
                  ? `${hold.guest_name} - ${occupied === "confirmed" ? "confirmed" : "tentative"}${isBlocked ? ", also blocked by hand" : ""}`
                  : isBlocked
                    ? "Blocked by hand - click to free up"
                    : "Available - click to block";

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={pending}
                    title={title}
                    onClick={() =>
                      startTransition(() => {
                        void toggleBlockedDate(key, isBlocked);
                      })
                    }
                    className={[
                      "relative flex h-10 items-center justify-center rounded-sm border text-[0.875rem] tabular-nums transition-colors duration-300 ease-calm disabled:cursor-wait",
                      occupied === "confirmed"
                        ? "border-ink-900 bg-ink-900 text-shell hover:bg-ink-700"
                        : occupied === "tentative"
                          ? "border-brass-600 bg-sand text-brass-600 hover:bg-shell"
                          : isBlocked
                            ? "border-stone bg-shell text-ink-300 line-through hover:border-ink-900"
                            : "border-stone bg-sand text-ink-900 hover:border-lagoon-800 hover:bg-lagoon-50",
                      isPast && !occupied && !isBlocked ? "text-ink-300" : "",
                    ].join(" ")}
                  >
                    {day}
                    {/* A stay and a hand-block on the same night - rare, but the
                        owner should be able to see it rather than wonder. */}
                    {occupied && isBlocked && (
                      <span className="absolute right-1 top-1 h-1 w-1 rounded-full bg-teak-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 border-t border-stone px-5 py-4 sm:px-7">
        <Key className="border-ink-900 bg-ink-900" label="Confirmed" />
        <Key className="border-brass-600 bg-sand" label="Tentative" />
        <Key className="border-stone bg-shell" label="Blocked by hand" />
        <Key className="border-stone bg-sand" label="Available" />
      </div>

      {/* Range control */}
      <div className="border-t border-stone px-5 py-6 sm:px-7">
        <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500">
          Block a stretch by hand
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-[0.78125rem] text-ink-500" htmlFor="range-start">
              From
            </label>
            <input
              id="range-start"
              type="date"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              style={{ colorScheme: "dark" }}
              className="mt-2 rounded-sm border border-stone bg-sand px-3 py-2.5 text-[0.9375rem] text-ink-900 focus:border-lagoon-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[0.78125rem] text-ink-500" htmlFor="range-end">
              Until
            </label>
            <input
              id="range-end"
              type="date"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              style={{ colorScheme: "dark" }}
              className="mt-2 rounded-sm border border-stone bg-sand px-3 py-2.5 text-[0.9375rem] text-ink-900 focus:border-lagoon-800 focus:outline-none"
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
          Blocks every night from the first date up to, but not including, the second.
        </p>
      </div>
    </div>
  );
}

function Key({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2.5 text-[0.78125rem] text-ink-500">
      <span className={`h-3 w-3 border ${className}`} aria-hidden="true" />
      {label}
    </span>
  );
}
