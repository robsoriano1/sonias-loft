"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Incident, IncidentStatus } from "@/lib/types";
import { INCIDENT_KINDS, INCIDENT_STATUSES } from "@/lib/types";
import { addIncident, deleteIncident, setIncidentStatus } from "@/app/admin/actions";
import { formatPeso } from "@/lib/rates";
import { formatTimestamp } from "@/lib/dates";
import { Button } from "@/components/ui/Button";

const field =
  "w-full rounded-sm border border-stone bg-sand px-3.5 py-2.5 text-[0.9375rem] text-ink-900 placeholder:text-ink-300 focus:border-lagoon-800 focus:outline-none";
const label = "block text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500";

const KIND_LABEL: Record<string, string> = {
  damage: "Damage",
  pet_cleaning: "Pet cleaning",
  missing_item: "Missing item",
  other: "Other",
};

/* The fees in the house rules - the ₱2,500 pet deep-clean above all - need
   somewhere to live other than a text message the owner later can't find. */
export function IncidentLog({ holdId, incidents }: { holdId: string; incidents: Incident[] }) {
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);

  return (
    <div>
      {incidents.length === 0 ? (
        <p className="rounded-md border border-stone bg-sand px-6 py-8 text-[0.9375rem] text-ink-500">
          Nothing logged against this stay.
        </p>
      ) : (
        <ul className="space-y-3">
          {incidents.map((incident) => (
            <li key={incident.id} className="rounded-md border border-stone bg-sand p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500">
                  {KIND_LABEL[incident.kind] ?? incident.kind}
                </p>
                <p className="font-display text-[1.125rem] font-light text-ink-900">
                  {incident.amount !== null ? formatPeso(Number(incident.amount)) : "-"}
                </p>
              </div>

              <p className="mt-3 text-[0.9375rem] leading-[1.7] text-ink-700">
                {incident.description}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone pt-4">
                {INCIDENT_STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={pending || incident.status === status}
                    onClick={() =>
                      startTransition(() => {
                        void setIncidentStatus(incident.id, status as IncidentStatus, holdId);
                      })
                    }
                    className={[
                      "rounded-sm border px-3 py-1.5 text-[0.625rem] uppercase tracking-[0.15em] transition-colors duration-300 ease-calm disabled:cursor-default",
                      incident.status === status
                        ? status === "settled" || status === "waived"
                          ? "border-ink-900 bg-ink-900 text-shell"
                          : "border-teak-600 text-teak-600"
                        : "border-stone text-ink-500 hover:border-ink-900 hover:text-ink-900",
                    ].join(" ")}
                  >
                    {status}
                  </button>
                ))}

                <span className="flex-1" />

                <span className="text-[0.75rem] text-ink-300">
                  {formatTimestamp(incident.created_at)}
                </span>

                <button
                  type="button"
                  disabled={pending}
                  aria-label="Delete this incident"
                  onClick={() => {
                    if (confirm("Delete this incident?")) {
                      startTransition(() => {
                        void deleteIncident(incident.id, holdId);
                      });
                    }
                  }}
                  className="rounded-sm p-1.5 text-ink-300 transition-colors duration-300 ease-calm hover:text-teak-600"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <form
          action={(formData) => {
            startTransition(async () => {
              await addIncident(formData);
              setAdding(false);
            });
          }}
          className="mt-5 rounded-md border border-stone bg-sand p-6"
        >
          <input type="hidden" name="hold_id" value={holdId} />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="incident_kind">
                What happened
              </label>
              <select id="incident_kind" name="kind" className={`${field} mt-3`}>
                {INCIDENT_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {KIND_LABEL[kind]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={label} htmlFor="incident_amount">
                Amount{" "}
                <span className="normal-case tracking-normal text-ink-300">(optional)</span>
              </label>
              <input
                id="incident_amount"
                name="amount"
                type="number"
                min={0}
                step={1}
                placeholder="2500"
                className={`${field} mt-3`}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={label} htmlFor="incident_description">
                Notes
              </label>
              <textarea
                id="incident_description"
                name="description"
                rows={3}
                required
                placeholder="Dog was not diapered - deep clean needed in the second bedroom."
                className={`${field} mt-3 resize-y`}
              />
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <Button type="submit" disabled={pending} className="py-3">
              Log it
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
          Log an incident
        </button>
      )}
    </div>
  );
}
