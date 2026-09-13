"use client";

import { useState, useTransition } from "react";
import { Check, Mail, Send } from "lucide-react";
import type { GuestMessage } from "@/lib/types";
import { sendConfirmationNow, sendReviewRequest } from "@/app/admin/actions";
import { formatTimestamp } from "@/lib/dates";

/* The two lifecycle emails. Both are sent automatically at the right moment -
   confirmation when a stay is confirmed, the review nudge after checkout -
   but the owner can fire either by hand if a send failed or a guest asks. */
export function GuestMessagePanel({
  holdId,
  messages,
  canSend,
  hasCheckedOut,
  isConfirmed,
}: {
  holdId: string;
  messages: GuestMessage[];
  canSend: boolean;
  hasCheckedOut: boolean;
  isConfirmed: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [problem, setProblem] = useState("");

  const confirmation = messages.find((m) => m.kind === "confirmation");
  const review = messages.find((m) => m.kind === "review_request");

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setProblem("");
    startTransition(async () => {
      const result = await action();
      if (!result.ok && result.error) setProblem(result.error);
    });
  }

  return (
    <div className="rounded-md border border-stone bg-sand">
      {problem && (
        <p className="border-b border-stone px-6 py-4 text-[0.875rem] text-teak-600">{problem}</p>
      )}

      {!canSend && (
        <p className="border-b border-stone px-6 py-4 text-[0.875rem] leading-[1.6] text-ink-500">
          This stay is not linked to an enquiry, so there is no email address on file. Nothing can be
          sent to the guest from here.
        </p>
      )}

      <Row
        title="Booking confirmation"
        description="Directions, gate code, check-in window and the house notes."
        message={confirmation}
        disabled={!canSend || pending || !isConfirmed}
        disabledNote={!isConfirmed ? "Confirm the stay first" : undefined}
        onSend={() => run(() => sendConfirmationNow(holdId))}
      />

      <Row
        title="Review request"
        description="A short nudge with a link, sent after they have gone home."
        message={review}
        disabled={!canSend || pending || !hasCheckedOut}
        disabledNote={!hasCheckedOut ? "Available after checkout" : undefined}
        onSend={() => run(() => sendReviewRequest(holdId))}
      />
    </div>
  );
}

function Row({
  title,
  description,
  message,
  disabled,
  disabledNote,
  onSend,
}: {
  title: string;
  description: string;
  message?: GuestMessage;
  disabled: boolean;
  disabledNote?: string;
  onSend: () => void;
}) {
  const sent = Boolean(message?.sent_at);

  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4 border-b border-stone px-6 py-6 last:border-b-0">
      <div className="flex-1">
        <p className="flex items-center gap-2.5 text-[0.9375rem] text-ink-900">
          <Mail className="h-4 w-4 text-ink-300" strokeWidth={1.5} />
          {title}
        </p>
        <p className="mt-2 max-w-prose text-[0.8125rem] leading-[1.6] text-ink-500">
          {description}
        </p>

        {sent && (
          <p className="mt-3 flex items-center gap-2 text-[0.78125rem] text-ink-300">
            <Check className="h-3.5 w-3.5 text-lagoon-800" strokeWidth={1.5} />
            Sent {formatTimestamp(message!.sent_at!)} to {message!.to_email}
          </p>
        )}

        {message?.error && !sent && (
          <p className="mt-3 text-[0.78125rem] leading-[1.6] text-teak-600">
            Last attempt failed: {message.error}
          </p>
        )}
      </div>

      <div className="text-right">
        <button
          type="button"
          disabled={disabled}
          onClick={onSend}
          className="flex items-center gap-2 rounded-sm border border-stone px-4 py-2.5 text-[0.6875rem] uppercase tracking-[0.15em] text-ink-500 transition-colors duration-300 ease-calm hover:border-ink-900 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
          {sent ? "Send again" : "Send now"}
        </button>
        {disabledNote && <p className="mt-2 text-[0.75rem] text-ink-300">{disabledNote}</p>}
      </div>
    </div>
  );
}
