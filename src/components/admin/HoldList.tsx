"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Plus, Trash2, X } from "lucide-react";
import type { Hold, HoldStatus, RateRule, Settings } from "@/lib/types";
import { validateStay, canConfirm } from "@/lib/availability";
import { quoteStay, formatPeso } from "@/lib/rates";
import { countNights, formatDateKey, todayKey } from "@/lib/dates";
import { deleteHold, saveHold, setHoldStatus } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";

const field =
  "w-full rounded-sm border border-stone bg-sand px-3.5 py-2.5 text-[0.9375rem] text-ink-900 placeholder:text-ink-300 focus:border-lagoon-800 focus:outline-none";
const label = "block text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500";

type GuestInfo = { name: string; email: string; phone: string | null };

export function HoldList({
  holds,
  blocked,
  settings,
  rateRules,
  inquiryIndex,
}: {
  holds: Hold[];
  blocked: string[];
  settings: Settings;
  rateRules: RateRule[];
  inquiryIndex: Record<string, GuestInfo>;
}) {
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [problem, setProblem] = useState("");

  const today = todayKey();
  const active = holds.filter((h) => h.status !== "released");
  const past = holds.filter((h) => h.status === "released" || h.check_out < today);
  const upcoming = active.filter((h) => h.check_out >= today);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setProblem("");
    startTransition(async () => {
      const result = await action();
      if (!result.ok && result.error) setProblem(result.error);
      else setAdding(false);
    });
  }

  return (
    <div>
      {problem && (
        <p className="mb-6 flex items-start gap-2.5 rounded-sm border border-teak-600 bg-sand px-4 py-3 text-[0.875rem] leading-[1.6] text-teak-600">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
          {problem}
        </p>
      )}

      {adding ? (
        <HoldForm
          holds={holds}
          blocked={blocked}
          settings={settings}
          rateRules={rateRules}
          pending={pending}
          onCancel={() => setAdding(false)}
          onSave={(input) => run(() => saveHold(input))}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 rounded-sm border border-stone bg-sand px-5 py-3 text-[0.6875rem] uppercase tracking-[0.15em] text-ink-500 transition-colors duration-300 ease-calm hover:border-ink-900 hover:text-ink-900"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          Add a stay
        </button>
      )}

      {upcoming.length === 0 ? (
        <div className="mt-8 rounded-md border border-stone bg-sand px-8 py-14 text-center">
          <p className="font-display text-[1.5rem] font-light text-ink-900">No stays booked</p>
          <p className="mt-3 text-[0.9375rem] text-ink-500">
            Hold an enquiry&apos;s dates from the Enquiries tab, or add a stay by hand.
          </p>
        </div>
      ) : (
        <ul className={`mt-8 space-y-4 ${pending ? "opacity-60" : ""}`}>
          {upcoming.map((hold) => (
            <HoldRow
              key={hold.id}
              hold={hold}
              holds={holds}
              blocked={blocked}
              settings={settings}
              rateRules={rateRules}
              guest={hold.inquiry_id ? inquiryIndex[hold.inquiry_id] : undefined}
              pending={pending}
              onStatus={(status) => run(() => setHoldStatus(hold.id, status))}
              onDelete={() => run(() => deleteHold(hold.id))}
            />
          ))}
        </ul>
      )}

      {past.length > 0 && (
        <details className="mt-10 group">
          <summary className="cursor-pointer text-[0.8125rem] text-ink-500 underline decoration-stone underline-offset-4">
            {past.length} past or released {past.length === 1 ? "stay" : "stays"}
          </summary>
          <ul className="mt-5 space-y-2">
            {past.map((hold) => (
              <li
                key={hold.id}
                className="flex flex-wrap items-baseline justify-between gap-3 border-b border-stone pb-2 text-[0.875rem] text-ink-500"
              >
                <Link
                  href={`/admin/bookings/${hold.id}`}
                  className="underline decoration-stone underline-offset-4"
                >
                  {hold.guest_name}
                </Link>
                <span className="tabular-nums text-ink-300">
                  {formatDateKey(hold.check_in)} to {formatDateKey(hold.check_out)}
                  {hold.status === "released" && " · released"}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function HoldRow({
  hold,
  holds,
  blocked,
  settings,
  rateRules,
  guest,
  pending,
  onStatus,
  onDelete,
}: {
  hold: Hold;
  holds: Hold[];
  blocked: string[];
  settings: Settings;
  rateRules: RateRule[];
  guest?: GuestInfo;
  pending: boolean;
  onStatus: (status: HoldStatus) => void;
  onDelete: () => void;
}) {
  // What would stand in the way of confirming this stay right now.
  const problems = useMemo(
    () =>
      validateStay({
        checkIn: hold.check_in,
        checkOut: hold.check_out,
        holds,
        blockedDays: blocked,
        settings,
        ignoreHoldId: hold.id,
        intent: "confirmed",
      }),
    [hold, holds, blocked, settings],
  );

  const nights = countNights(hold.check_in, hold.check_out);
  const value =
    hold.rate_total ?? quoteStay(hold.check_in, hold.check_out, rateRules).total;

  return (
    <li className="rounded-md border border-stone bg-sand p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/admin/bookings/${hold.id}`}
              className="font-display text-[1.375rem] font-light text-ink-900 underline decoration-stone underline-offset-[6px] hover:decoration-ink-900"
            >
              {hold.guest_name}
            </Link>
            <span
              className={[
                "rounded-sm border px-2.5 py-1 text-[0.625rem] uppercase tracking-[0.15em]",
                hold.status === "confirmed"
                  ? "border-ink-900 bg-ink-900 text-shell"
                  : "border-brass-600 text-brass-600",
              ].join(" ")}
            >
              {hold.status}
            </span>
          </div>

          <p className="mt-2 text-[0.9375rem] text-ink-700">
            {formatDateKey(hold.check_in)}
            <span className="mx-2 text-ink-300">to</span>
            {formatDateKey(hold.check_out)}
            <span className="ml-2 text-ink-500">
              ({nights} {nights === 1 ? "night" : "nights"})
            </span>
          </p>

          {guest && <p className="mt-1.5 text-[0.8125rem] text-ink-300">{guest.email}</p>}
        </div>

        <p className="font-display text-[1.25rem] font-light text-ink-900">
          {value > 0 ? formatPeso(value) : <span className="text-ink-300">No rate</span>}
        </p>
      </div>

      {problems.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-l-2 border-teak-600 pl-4">
          {problems.map((p, i) => (
            <li key={i} className="text-[0.8125rem] leading-[1.6] text-teak-600">
              {p.message}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-stone pt-5">
        {hold.status !== "confirmed" && (
          <button
            type="button"
            disabled={pending || !canConfirm(problems)}
            title={
              canConfirm(problems)
                ? "Confirm this stay and email the guest"
                : "Sort the conflicts above first"
            }
            onClick={() => onStatus("confirmed")}
            className="flex items-center gap-2 rounded-sm border border-ink-900 bg-ink-900 px-4 py-2 text-[0.6875rem] uppercase tracking-[0.15em] text-shell transition-colors duration-300 ease-calm hover:bg-lagoon-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
            Confirm
          </button>
        )}

        {hold.status === "confirmed" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => onStatus("tentative")}
            className="rounded-sm border border-stone px-4 py-2 text-[0.6875rem] uppercase tracking-[0.15em] text-ink-500 transition-colors duration-300 ease-calm hover:border-ink-900 hover:text-ink-900"
          >
            Back to tentative
          </button>
        )}

        <button
          type="button"
          disabled={pending}
          title="Free these dates up without deleting the record"
          onClick={() => onStatus("released")}
          className="flex items-center gap-2 rounded-sm border border-stone px-4 py-2 text-[0.6875rem] uppercase tracking-[0.15em] text-ink-500 transition-colors duration-300 ease-calm hover:border-ink-900 hover:text-ink-900"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          Release
        </button>

        <span className="flex-1" />

        <button
          type="button"
          disabled={pending}
          aria-label={`Delete the stay for ${hold.guest_name}`}
          onClick={() => {
            if (confirm(`Delete ${hold.guest_name}'s stay entirely? Releasing keeps the record.`)) {
              onDelete();
            }
          }}
          className="rounded-sm p-2 text-ink-300 transition-colors duration-300 ease-calm hover:text-teak-600"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </li>
  );
}

function HoldForm({
  holds,
  blocked,
  settings,
  rateRules,
  pending,
  onCancel,
  onSave,
}: {
  holds: Hold[];
  blocked: string[];
  settings: Settings;
  rateRules: RateRule[];
  pending: boolean;
  onCancel: () => void;
  onSave: (input: {
    guestName: string;
    checkIn: string;
    checkOut: string;
    status: HoldStatus;
    rateTotal?: string;
    note?: string;
    force?: boolean;
  }) => void;
}) {
  const [guestName, setGuestName] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [status, setStatus] = useState<HoldStatus>("tentative");
  const [rateTotal, setRateTotal] = useState("");
  const [note, setNote] = useState("");

  // Live conflict preview, so the owner never has to submit to find out.
  const problems =
    checkIn && checkOut
      ? validateStay({
          checkIn,
          checkOut,
          holds,
          blockedDays: blocked,
          settings,
          intent: status === "confirmed" ? "confirmed" : "tentative",
        })
      : [];

  const quote = checkIn && checkOut ? quoteStay(checkIn, checkOut, rateRules) : null;
  const blocking = !canConfirm(problems);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ guestName, checkIn, checkOut, status, rateTotal, note, force: true });
      }}
      className="rounded-md border border-stone bg-sand p-6 md:p-7"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label} htmlFor="guest_name">
            Guest name
          </label>
          <input
            id="guest_name"
            required
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className={`${field} mt-3`}
            placeholder="Maria Santos"
          />
        </div>

        <div>
          <label className={label} htmlFor="hold_in">
            Check in
          </label>
          <input
            id="hold_in"
            type="date"
            required
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            style={{ colorScheme: "dark" }}
            className={`${field} mt-3`}
          />
        </div>

        <div>
          <label className={label} htmlFor="hold_out">
            Check out
          </label>
          <input
            id="hold_out"
            type="date"
            required
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            style={{ colorScheme: "dark" }}
            className={`${field} mt-3`}
          />
        </div>

        <div>
          <label className={label} htmlFor="hold_status">
            Status
          </label>
          <select
            id="hold_status"
            value={status}
            onChange={(e) => setStatus(e.target.value as HoldStatus)}
            className={`${field} mt-3`}
          >
            <option value="tentative">Tentative</option>
            <option value="confirmed">Confirmed</option>
          </select>
        </div>

        <div>
          <label className={label} htmlFor="hold_rate">
            Agreed total{" "}
            <span className="normal-case tracking-normal text-ink-300">(optional)</span>
          </label>
          <input
            id="hold_rate"
            type="number"
            min={0}
            step={1}
            value={rateTotal}
            onChange={(e) => setRateTotal(e.target.value)}
            className={`${field} mt-3`}
            placeholder={quote && quote.total > 0 ? String(quote.total) : "From the rate card"}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={label} htmlFor="hold_note">
            Note <span className="normal-case tracking-normal text-ink-300">(optional)</span>
          </label>
          <input
            id="hold_note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`${field} mt-3`}
            placeholder="Arriving late, bringing a small dog"
          />
        </div>
      </div>

      {quote && quote.total > 0 && !rateTotal && (
        <p className="mt-5 text-[0.8125rem] text-ink-500">
          Rate card says {formatPeso(quote.total)} for {quote.nights}{" "}
          {quote.nights === 1 ? "night" : "nights"}.
        </p>
      )}

      {problems.length > 0 && (
        <ul className="mt-5 space-y-1.5 border-l-2 border-teak-600 pl-4">
          {problems.map((p, i) => (
            <li key={i} className="text-[0.8125rem] leading-[1.6] text-teak-600">
              {p.message}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-7 flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending || blocking} className="py-3">
          Save stay
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="py-3">
          Cancel
        </Button>
        {blocking && (
          <p className="text-[0.78125rem] text-teak-600">
            Sort the conflicts above before saving.
          </p>
        )}
      </div>
    </form>
  );
}
