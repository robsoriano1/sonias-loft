"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Send } from "lucide-react";
import { sendTestEmail } from "@/app/admin/actions";

/* One button, and it tells the truth. Whatever the mail provider says comes
   back verbatim rather than being flattened into "something went wrong",
   because the provider's own wording is usually the whole answer. */
export function TestEmailButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setResult(null);
          startTransition(async () => {
            const outcome = await sendTestEmail();
            setResult(
              outcome.ok
                ? { ok: true, text: outcome.message ?? "Sent." }
                : { ok: false, text: outcome.error },
            );
          });
        }}
        className="flex items-center gap-2 rounded-sm border border-stone bg-sand px-5 py-3 text-[0.6875rem] uppercase tracking-[0.15em] text-ink-500 transition-colors duration-300 ease-calm hover:border-ink-900 hover:text-ink-900 disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
        ) : (
          <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
        )}
        {pending ? "Sending" : "Send a test email"}
      </button>

      {result && (
        <p
          className={`mt-4 flex items-start gap-2.5 rounded-sm border px-4 py-3 text-[0.8125rem] leading-[1.65] ${
            result.ok ? "border-stone text-ink-500" : "border-teak-600 text-teak-600"
          }`}
        >
          {result.ok && <Check className="mt-0.5 h-4 w-4 shrink-0 text-lagoon-800" strokeWidth={1.5} />}
          <span className="break-words">{result.text}</span>
        </p>
      )}
    </div>
  );
}
