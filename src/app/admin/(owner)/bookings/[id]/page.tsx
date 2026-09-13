import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { loadHold } from "@/lib/admin-data";
import { SUPABASE_CONFIGURED } from "@/lib/supabase/config";
import { countNights, formatDateKey, todayKey } from "@/lib/dates";
import { formatPeso } from "@/lib/rates";
import type { GuestMessage } from "@/lib/types";
import { GuestMessagePanel } from "@/components/admin/GuestMessagePanel";
import { IncidentLog } from "@/components/admin/IncidentLog";

export const revalidate = 0;

export default async function BookingPage({ params }: { params: { id: string } }) {
  const { hold, inquiry, incidents, settings } = await loadHold(params.id);
  if (!hold) notFound();

  let messages: GuestMessage[] = [];
  if (SUPABASE_CONFIGURED) {
    const { data } = await createClient()
      .from("guest_messages")
      .select("*")
      .eq("hold_id", hold.id);
    messages = (data as GuestMessage[] | null) ?? [];
  }

  const nights = countNights(hold.check_in, hold.check_out);
  const hasCheckedOut = hold.check_out <= todayKey();
  const owed = incidents
    .filter((i) => i.status === "open" || i.status === "invoiced")
    .reduce((sum, i) => sum + Number(i.amount ?? 0), 0);

  return (
    <div>
      <Link
        href="/admin/calendar"
        className="flex items-center gap-1.5 text-[0.8125rem] text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        Back to the calendar
      </Link>

      <div className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-3">
        <h1 className="font-display text-[2.5rem] font-light leading-[1.08] text-ink-900">
          {hold.guest_name}
        </h1>
        <span
          className={[
            "rounded-sm border px-2.5 py-1 text-[0.625rem] uppercase tracking-[0.15em]",
            hold.status === "confirmed"
              ? "border-ink-900 bg-ink-900 text-shell"
              : hold.status === "tentative"
                ? "border-brass-600 text-brass-600"
                : "border-stone text-ink-300",
          ].join(" ")}
        >
          {hold.status}
        </span>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-stone pt-8 sm:grid-cols-4">
        <Fact label="Check in" value={formatDateKey(hold.check_in)} note={settings.checkin_window} />
        <Fact
          label="Check out"
          value={formatDateKey(hold.check_out)}
          note={settings.checkout_window}
        />
        <Fact label="Nights" value={String(nights)} />
        <Fact
          label="Agreed"
          value={hold.rate_total !== null ? formatPeso(Number(hold.rate_total)) : "-"}
        />
      </dl>

      {inquiry && (
        <section className="mt-10 rounded-md border border-stone bg-sand p-6">
          <p className="eyebrow">From the enquiry</p>
          <p className="mt-4 text-[0.9375rem] text-ink-700">
            <a
              href={`mailto:${inquiry.email}`}
              className="text-brass-600 underline decoration-brass-400 underline-offset-4"
            >
              {inquiry.email}
            </a>
            {inquiry.phone && <span className="ml-4 text-ink-500">{inquiry.phone}</span>}
            {inquiry.guests && <span className="ml-4 text-ink-500">{inquiry.guests} guests</span>}
          </p>
          {inquiry.message && (
            <p className="mt-4 max-w-prose border-l-2 border-stone pl-4 text-[0.9375rem] leading-[1.7] text-ink-500">
              {inquiry.message}
            </p>
          )}
        </section>
      )}

      {hold.note && !hold.note.startsWith("ical:") && (
        <p className="mt-6 text-[0.9375rem] leading-[1.7] text-ink-500">
          <span className="text-ink-300">Note: </span>
          {hold.note}
        </p>
      )}

      <section className="mt-14">
        <p className="eyebrow">Messages to the guest</p>
        <div className="mt-6">
          <GuestMessagePanel
            holdId={hold.id}
            messages={messages}
            canSend={Boolean(inquiry?.email)}
            hasCheckedOut={hasCheckedOut}
            isConfirmed={hold.status === "confirmed"}
          />
        </div>
      </section>

      <section className="mt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <p className="eyebrow">Incidents and extra charges</p>
          {owed > 0 && (
            <p className="text-[0.875rem] text-teak-600">{formatPeso(owed)} outstanding</p>
          )}
        </div>

        <div className="mt-6">
          <IncidentLog holdId={hold.id} incidents={incidents} />
        </div>
      </section>
    </div>
  );
}

function Fact({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <dt className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500">{label}</dt>
      <dd className="mt-2.5 font-display text-[1.25rem] font-light text-ink-900">{value}</dd>
      {note && <p className="mt-1 text-[0.75rem] text-ink-300">{note}</p>}
    </div>
  );
}
