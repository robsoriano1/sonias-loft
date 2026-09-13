"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import type { StaffStay, Turnover, TurnoverTaskKey } from "@/lib/types";
import { TURNOVER_TASKS, isTurnoverComplete } from "@/lib/types";
import { saveTurnoverReport, toggleTurnoverTask } from "@/app/staff/actions";
import { formatDateKey } from "@/lib/dates";
import { Button } from "@/components/ui/Button";

/* ============================================================================
 *  One checkout, one card.
 *
 *  Big tap targets and one column: this is used standing up, on a phone, by
 *  someone holding cleaning things in the other hand. The guest's name and
 *  the date are all the identifying detail here - no contact details, no
 *  money, because staff have no business with either and the database would
 *  refuse to hand them over anyway.
 * ========================================================================== */
export function TurnoverCard({ turnover, stay }: { turnover: Turnover; stay?: StaffStay }) {
  const [pending, startTransition] = useTransition();
  const [problem, setProblem] = useState("");
  const [reporting, setReporting] = useState(false);

  const complete = isTurnoverComplete(turnover);

  function toggle(task: TurnoverTaskKey, done: boolean) {
    setProblem("");
    startTransition(async () => {
      const result = await toggleTurnoverTask(turnover.id, task, done);
      if (!result.ok) setProblem(result.error);
    });
  }

  return (
    <article
      className={[
        "rounded-md border bg-sand p-6",
        complete ? "border-stone opacity-70" : "border-stone",
        turnover.damage_found ? "border-teak-600" : "",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
        <div>
          <p className="font-display text-[1.375rem] font-light text-ink-900">
            {stay?.guest_name ?? "Stay"}
          </p>
          <p className="mt-1.5 text-[0.8125rem] text-ink-500">
            Out {formatDateKey(turnover.due_on)}
          </p>
        </div>

        {complete ? (
          <span className="flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.15em] text-lagoon-800">
            <Check className="h-4 w-4" strokeWidth={1.5} />
            Done
          </span>
        ) : (
          pending && <Loader2 className="h-4 w-4 animate-spin text-ink-300" strokeWidth={1.5} />
        )}
      </div>

      {problem && <p className="mt-4 text-[0.8125rem] text-teak-600">{problem}</p>}

      {/* The checklist. Whole row is the tap target. */}
      <ul className="mt-6 space-y-2">
        {TURNOVER_TASKS.map((task) => {
          const done = turnover[task.key];

          return (
            <li key={task.key}>
              <button
                type="button"
                disabled={pending}
                aria-pressed={done}
                onClick={() => toggle(task.key, !done)}
                className={[
                  "flex w-full items-start gap-4 rounded-sm border px-4 py-3.5 text-left transition-colors duration-300 ease-calm disabled:cursor-wait",
                  done
                    ? "border-ink-900 bg-ink-900 text-shell"
                    : "border-stone bg-sand text-ink-900 hover:border-ink-900",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className={[
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border",
                    done ? "border-shell" : "border-stone",
                  ].join(" ")}
                >
                  {done && <Check className="h-3.5 w-3.5" strokeWidth={2} />}
                </span>

                <span>
                  <span className="block text-[0.9375rem]">{task.label}</span>
                  <span
                    className={`mt-0.5 block text-[0.78125rem] ${done ? "text-stone" : "text-ink-500"}`}
                  >
                    {task.detail}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Anything worth telling Sonia */}
      {reporting ? (
        <form
          action={(formData) => {
            startTransition(async () => {
              await saveTurnoverReport(formData);
              setReporting(false);
            });
          }}
          className="mt-6 border-t border-stone pt-6"
        >
          <input type="hidden" name="id" value={turnover.id} />

          <label
            className="block text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500"
            htmlFor={`notes-${turnover.id}`}
          >
            Anything to report
          </label>
          <textarea
            id={`notes-${turnover.id}`}
            name="notes"
            rows={3}
            defaultValue={turnover.notes ?? ""}
            placeholder="Chipped plate in the kitchen. Pool needs chlorine."
            className="mt-3 w-full resize-y rounded-sm border border-stone bg-sand px-3.5 py-2.5 text-[0.9375rem] text-ink-900 placeholder:text-ink-300 focus:border-lagoon-800 focus:outline-none"
          />

          <label className="mt-4 flex items-start gap-3 text-[0.875rem] leading-[1.6] text-ink-700">
            <input
              type="checkbox"
              name="damage_found"
              defaultChecked={turnover.damage_found}
              className="mt-1 h-4 w-4 accent-teak-600"
            />
            <span>
              Something is damaged or missing
              <span className="mt-0.5 block text-[0.78125rem] text-ink-500">
                Sonia gets told. Leave the cost to her.
              </span>
            </span>
          </label>

          <div className="mt-5 flex gap-3">
            <Button type="submit" disabled={pending} className="py-2.5">
              Save
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setReporting(false)}
              className="py-2.5"
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-6 border-t border-stone pt-5">
          {turnover.damage_found && (
            <p className="mb-3 flex items-center gap-2 text-[0.8125rem] text-teak-600">
              <AlertTriangle className="h-4 w-4" strokeWidth={1.5} />
              Damage reported
            </p>
          )}

          {turnover.notes && (
            <p className="mb-3 text-[0.875rem] leading-[1.65] text-ink-500">{turnover.notes}</p>
          )}

          <button
            type="button"
            onClick={() => setReporting(true)}
            className="text-[0.8125rem] text-brass-600 underline decoration-brass-400 underline-offset-4"
          >
            {turnover.notes || turnover.damage_found ? "Edit the report" : "Report something"}
          </button>
        </div>
      )}
    </article>
  );
}
