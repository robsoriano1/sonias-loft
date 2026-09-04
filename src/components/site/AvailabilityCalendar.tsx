"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  MONTH_NAMES,
  WEEKDAY_INITIALS,
  addMonths,
  monthGrid,
  toKey,
  todayKey,
} from "@/lib/dates";

/* ============================================================================
 *  Public availability calendar - read only.
 *  Blocked days are washed in sand with a strike; past days are simply faded.
 *  No colour beyond the palette, no glow, no rounded pills.
 * ========================================================================== */
export function AvailabilityCalendar({ blocked }: { blocked: string[] }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const blockedSet = useMemo(() => new Set(blocked), [blocked]);
  const today = todayKey();

  const months = [cursor, addMonths(cursor.year, cursor.month, 1)];

  return (
    <div className="rounded-md border border-stone bg-sand">
      {/* Month stepper */}
      <div className="flex items-center justify-between border-b border-stone px-5 py-4">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setCursor(addMonths(cursor.year, cursor.month, -1))}
          className="rounded-sm p-2 text-ink-500 transition-colors duration-300 ease-calm hover:bg-sand hover:text-ink-900"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        </button>

        <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500">
          {MONTH_NAMES[cursor.month]} {cursor.year}
        </p>

        <button
          type="button"
          aria-label="Next month"
          onClick={() => setCursor(addMonths(cursor.year, cursor.month, 1))}
          className="rounded-sm p-2 text-ink-500 transition-colors duration-300 ease-calm hover:bg-sand hover:text-ink-900"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      <div className="grid gap-10 p-5 sm:p-7 md:grid-cols-2 md:gap-8">
        {months.map(({ year, month }) => (
          <div key={`${year}-${month}`}>
            <p className="mb-5 font-display text-[1.25rem] font-normal text-ink-900">
              {MONTH_NAMES[month]} {year}
            </p>

            <div className="grid grid-cols-7 gap-y-1">
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
                const isToday = key === today;

                return (
                  <div
                    key={key}
                    title={isBlocked ? "Booked" : isPast ? "Past" : "Available"}
                    className={[
                      "flex h-9 items-center justify-center text-[0.875rem] tabular-nums",
                      isBlocked
                        ? "bg-shell text-ink-300 line-through"
                        : isPast
                          ? "text-ink-300"
                          : "text-ink-900",
                      isToday ? "font-medium underline decoration-brass-400 underline-offset-4" : "",
                    ].join(" ")}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 border-t border-stone px-5 py-4 sm:px-7">
        <span className="flex items-center gap-2.5 text-[0.78125rem] text-ink-500">
          <span className="h-3 w-3 border border-stone bg-sand" aria-hidden="true" />
          Available
        </span>
        <span className="flex items-center gap-2.5 text-[0.78125rem] text-ink-500">
          <span className="h-3 w-3 border border-stone bg-shell" aria-hidden="true" />
          Booked
        </span>
      </div>
    </div>
  );
}
