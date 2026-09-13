"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { RateRule } from "@/lib/types";
import { deleteRateRule, saveRateRule } from "@/app/admin/actions";
import { formatPeso } from "@/lib/rates";
import { formatDateKey } from "@/lib/dates";
import { Button } from "@/components/ui/Button";

const field =
  "w-full rounded-sm border border-stone bg-sand px-3 py-2 text-[0.9375rem] text-ink-900 placeholder:text-ink-300 focus:border-lagoon-800 focus:outline-none";
const label = "block text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500";

export function RateCard({ rules }: { rules: RateRule[] }) {
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);

  const base = rules.filter((r) => !r.starts_on);
  const seasons = rules.filter((r) => r.starts_on);

  return (
    <div>
      <div className="space-y-4">
        {base.map((rule) => (
          <RuleRow key={rule.id} rule={rule} pending={pending} />
        ))}

        {seasons.map((rule) => (
          <RuleRow key={rule.id} rule={rule} pending={pending} />
        ))}
      </div>

      {adding ? (
        <form
          action={(formData) => {
            startTransition(async () => {
              await saveRateRule(formData);
              setAdding(false);
            });
          }}
          className="mt-5 rounded-md border border-stone bg-sand p-6"
        >
          <p className="eyebrow">New season</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <label className={label} htmlFor="new_label">
                Name
              </label>
              <input
                id="new_label"
                name="label"
                required
                placeholder="Christmas week"
                className={`${field} mt-2.5`}
              />
            </div>

            <div>
              <label className={label} htmlFor="new_starts">
                From
              </label>
              <input
                id="new_starts"
                name="starts_on"
                type="date"
                required
                style={{ colorScheme: "dark" }}
                className={`${field} mt-2.5`}
              />
            </div>

            <div>
              <label className={label} htmlFor="new_ends">
                Until
              </label>
              <input
                id="new_ends"
                name="ends_on"
                type="date"
                required
                style={{ colorScheme: "dark" }}
                className={`${field} mt-2.5`}
              />
            </div>

            <div>
              <label className={label} htmlFor="new_priority">
                Priority
              </label>
              <input
                id="new_priority"
                name="priority"
                type="number"
                defaultValue={10}
                className={`${field} mt-2.5`}
              />
            </div>

            <div>
              <label className={label} htmlFor="new_weekday">
                Weekday rate
              </label>
              <input
                id="new_weekday"
                name="weekday_rate"
                type="number"
                min={0}
                required
                className={`${field} mt-2.5`}
              />
            </div>

            <div>
              <label className={label} htmlFor="new_weekend">
                Weekend rate
              </label>
              <input
                id="new_weekend"
                name="weekend_rate"
                type="number"
                min={0}
                required
                className={`${field} mt-2.5`}
              />
            </div>
          </div>

          <div className="mt-7 flex gap-4">
            <Button type="submit" disabled={pending} className="py-3">
              Add season
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAdding(false)}
              className="py-3"
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-5 flex items-center gap-2 rounded-sm border border-stone bg-sand px-5 py-3 text-[0.6875rem] uppercase tracking-[0.15em] text-ink-500 transition-colors duration-300 ease-calm hover:border-ink-900 hover:text-ink-900"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          Add a season
        </button>
      )}
    </div>
  );
}

function RuleRow({ rule, pending }: { rule: RateRule; pending: boolean }) {
  const [, startTransition] = useTransition();
  const isBase = !rule.starts_on;

  return (
    <form action={saveRateRule} className="rounded-md border border-stone bg-sand p-6">
      <input type="hidden" name="id" value={rule.id} />
      <input type="hidden" name="priority" value={rule.priority} />
      {isBase && <input type="hidden" name="starts_on" value="" />}
      {isBase && <input type="hidden" name="ends_on" value="" />}

      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex-1">
          <input
            name="label"
            defaultValue={rule.label}
            className="w-full border-0 bg-transparent p-0 font-display text-[1.25rem] font-light text-ink-900 focus:outline-none"
          />
          <p className="mt-1 text-[0.78125rem] text-ink-300">
            {isBase
              ? "Applies to every night without a season over it"
              : `${formatDateKey(rule.starts_on)} to ${formatDateKey(rule.ends_on)} · priority ${rule.priority}`}
          </p>
        </div>

        {!isBase && (
          <button
            type="button"
            disabled={pending}
            aria-label={`Delete the ${rule.label} season`}
            onClick={() => {
              if (confirm(`Delete the "${rule.label}" season?`)) {
                startTransition(() => {
                  void deleteRateRule(rule.id);
                });
              }
            }}
            className="rounded-sm p-2 text-ink-300 transition-colors duration-300 ease-calm hover:text-teak-600"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {!isBase && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor={`start-${rule.id}`}>
              From
            </label>
            <input
              id={`start-${rule.id}`}
              name="starts_on"
              type="date"
              defaultValue={rule.starts_on ?? ""}
              style={{ colorScheme: "dark" }}
              className={`${field} mt-2.5`}
            />
          </div>
          <div>
            <label className={label} htmlFor={`end-${rule.id}`}>
              Until
            </label>
            <input
              id={`end-${rule.id}`}
              name="ends_on"
              type="date"
              defaultValue={rule.ends_on ?? ""}
              style={{ colorScheme: "dark" }}
              className={`${field} mt-2.5`}
            />
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor={`weekday-${rule.id}`}>
            Sun to Thu nights
          </label>
          <input
            id={`weekday-${rule.id}`}
            name="weekday_rate"
            type="number"
            min={0}
            defaultValue={rule.weekday_rate}
            className={`${field} mt-2.5`}
          />
          <p className="mt-2 text-[0.75rem] text-ink-300">
            {Number(rule.weekday_rate) > 0 ? formatPeso(rule.weekday_rate) : "Not set yet"}
          </p>
        </div>

        <div>
          <label className={label} htmlFor={`weekend-${rule.id}`}>
            Fri and Sat nights
          </label>
          <input
            id={`weekend-${rule.id}`}
            name="weekend_rate"
            type="number"
            min={0}
            defaultValue={rule.weekend_rate}
            className={`${field} mt-2.5`}
          />
          <p className="mt-2 text-[0.75rem] text-ink-300">
            {Number(rule.weekend_rate) > 0 ? formatPeso(rule.weekend_rate) : "Not set yet"}
          </p>
        </div>
      </div>

      <Button type="submit" variant="secondary" disabled={pending} className="mt-6 py-2.5">
        Save
      </Button>
    </form>
  );
}
