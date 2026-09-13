import type { Inquiry } from "@/lib/types";
import { responseState } from "@/lib/pipeline";

/* How long this guest waited, or has been waiting.
   `now` is passed down from the server render rather than read here, so the
   server and the client agree on the number and React does not complain
   about a hydration mismatch. */
export function ResponseBadge({ inquiry, now }: { inquiry: Inquiry; now?: string }) {
  const state = responseState(inquiry, now);

  if (state.settled) {
    return (
      <span className="text-[0.75rem] tabular-nums text-ink-300" title="Time taken to reply">
        replied in {state.label}
      </span>
    );
  }

  return (
    <span
      title={state.overdue ? "Past the same-day reply promise" : "Waiting for a reply"}
      className={[
        "rounded-sm border px-2.5 py-1 text-[0.6875rem] uppercase tracking-[0.15em] tabular-nums",
        state.overdue ? "border-teak-600 text-teak-600" : "border-stone text-ink-500",
      ].join(" ")}
    >
      {state.label}
      {state.overdue ? " overdue" : " waiting"}
    </span>
  );
}
