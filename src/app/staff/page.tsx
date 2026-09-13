import { createClient } from "@/lib/supabase/server";
import { SUPABASE_CONFIGURED } from "@/lib/supabase/config";
import { requireSignedIn } from "@/lib/roles";
import { addDays, todayKey } from "@/lib/dates";
import type { StaffStay, Turnover } from "@/lib/types";
import { isTurnoverComplete } from "@/lib/types";
import { TurnoverCard } from "@/components/staff/TurnoverCard";

export const revalidate = 0;

/* How far ahead to show. Far enough to plan tomorrow, short enough that the
   list is the day's work rather than a backlog. */
const HORIZON_DAYS = 10;

export default async function StaffPage() {
  const user = await requireSignedIn();

  const today = todayKey();
  let turnovers: Turnover[] = [];
  let stays: Record<string, StaffStay> = {};
  let error = "";

  if (!SUPABASE_CONFIGURED) {
    error = "This site is not connected to its database yet.";
  } else {
    const supabase = createClient();

    const [turnoverRes, stayRes] = await Promise.all([
      supabase
        .from("turnovers")
        .select("*")
        .gte("due_on", addDays(today, -14))
        .lte("due_on", addDays(today, HORIZON_DAYS))
        .order("due_on", { ascending: true }),
      // The narrow view - guest name and dates, nothing else exists here.
      supabase.from("staff_stays").select("*"),
    ]);

    if (turnoverRes.error) {
      error =
        "Could not load the list. If this keeps happening, tell Sonia the turnovers table needs setting up.";
    }

    turnovers = (turnoverRes.data as Turnover[] | null) ?? [];
    stays = Object.fromEntries(
      ((stayRes.data as StaffStay[] | null) ?? []).map((stay) => [stay.id, stay]),
    );
  }

  const outstanding = turnovers.filter((t) => !isTurnoverComplete(t));
  const overdue = outstanding.filter((t) => t.due_on < today);
  const dueToday = outstanding.filter((t) => t.due_on === today);
  const upcoming = outstanding.filter((t) => t.due_on > today);
  const done = turnovers.filter(isTurnoverComplete);

  return (
    <div>
      <h1 className="font-display text-[2.5rem] font-light leading-[1.08] text-ink-900">
        {user.name ? `Hello, ${user.name.split(" ")[0]}` : "Turnovers"}
      </h1>
      <p className="mt-4 max-w-prose text-[0.9375rem] leading-[1.7] text-ink-500">
        Each guest leaving needs the house turned around. Tick things off as you go - it saves on
        its own.
      </p>

      {error && (
        <p className="mt-8 rounded-sm border border-teak-600 bg-sand px-5 py-4 text-[0.875rem] leading-[1.65] text-teak-600">
          {error}
        </p>
      )}

      {outstanding.length === 0 && !error && (
        <div className="mt-10 rounded-md border border-stone bg-sand px-8 py-16 text-center">
          <p className="font-display text-[1.5rem] font-light text-ink-900">All caught up</p>
          <p className="mt-3 text-[0.9375rem] text-ink-500">
            Nothing needs turning around right now.
          </p>
        </div>
      )}

      <Group title="Overdue" turnovers={overdue} stays={stays} tone="urgent" />
      <Group title="Today" turnovers={dueToday} stays={stays} />
      <Group title="Coming up" turnovers={upcoming} stays={stays} />

      {done.length > 0 && (
        <details className="mt-12">
          <summary className="cursor-pointer text-[0.8125rem] text-ink-500 underline decoration-stone underline-offset-4">
            {done.length} finished
          </summary>
          <div className="mt-5 space-y-4">
            {done.map((turnover) => (
              <TurnoverCard
                key={turnover.id}
                turnover={turnover}
                stay={stays[turnover.hold_id]}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function Group({
  title,
  turnovers,
  stays,
  tone,
}: {
  title: string;
  turnovers: Turnover[];
  stays: Record<string, StaffStay>;
  tone?: "urgent";
}) {
  if (turnovers.length === 0) return null;

  return (
    <section className="mt-12">
      <p
        className={`text-[0.6875rem] uppercase tracking-[0.2em] ${
          tone === "urgent" ? "text-teak-600" : "text-ink-500"
        }`}
      >
        {title}
      </p>

      <div className="mt-5 space-y-4">
        {turnovers.map((turnover) => (
          <TurnoverCard key={turnover.id} turnover={turnover} stay={stays[turnover.hold_id]} />
        ))}
      </div>
    </section>
  );
}
