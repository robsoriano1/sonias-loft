"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_CONFIGURED } from "@/lib/supabase/config";
import { site } from "@/lib/content";
import { Button } from "@/components/ui/Button";

const field =
  "w-full rounded-sm border border-stone bg-sand px-4 py-3 text-[1rem] text-ink-900 placeholder:text-ink-300 transition-colors duration-300 ease-calm focus:border-lagoon-800 focus:outline-none";
const label = "block text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    if (!SUPABASE_CONFIGURED) {
      setBusy(false);
      setError("Supabase is not configured yet. Add your keys to .env.local.");
      return;
    }

    const data = new FormData(event.currentTarget);
    const { error: signInError } = await createClient().auth.signInWithPassword({
      email: String(data.get("email") ?? "").trim(),
      password: String(data.get("password") ?? ""),
    });

    if (signInError) {
      setBusy(false);
      setError("That email and password did not match. Please try again.");
      return;
    }

    router.replace(params.get("next") ?? "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-stone bg-sand p-8 md:p-10">
      <div className="space-y-6">
        <div>
          <label className={label} htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" className={`${field} mt-3`} />
        </div>

        <div>
          <label className={label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={`${field} mt-3`}
          />
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-sm border border-teak-600 px-4 py-3 text-[0.875rem] text-teak-600">
          {error}
        </p>
      )}

      <Button type="submit" disabled={busy} className="mt-8 w-full">
        {busy && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />}
        {busy ? "Signing in" : "Sign in"}
      </Button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-shell px-6 py-20">
      <div className="w-full max-w-[26rem]">
        <p className="eyebrow">Owner access</p>
        <h1 className="mt-5 font-display text-[2.5rem] font-light leading-[1.08] text-ink-900">
          {site.name}
        </h1>
        <p className="mt-4 text-[0.9375rem] leading-[1.7] text-ink-500">
          Sign in to see enquiries and manage the calendar.
        </p>

        <div className="mt-10">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
