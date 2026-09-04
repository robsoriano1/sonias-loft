import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_CONFIGURED } from "@/lib/supabase/config";
import type { BlockedDate, Inquiry } from "@/lib/types";
import { site } from "@/lib/content";
import { InquiryTable } from "@/components/admin/InquiryTable";
import { CalendarManager } from "@/components/admin/CalendarManager";
import { signOut } from "./actions";
import { Button } from "@/components/ui/Button";
import { todayKey } from "@/lib/dates";

export const revalidate = 0;

export default async function AdminPage() {
  let inquiries: Inquiry[] = [];
  let blocked: string[] = [];
  let dbError = "";

  if (!SUPABASE_CONFIGURED) {
    dbError =
      "Supabase is not configured. Copy .env.local.example to .env.local, add your project URL and anon key, then restart the dev server.";
  } else {
    const supabase = createClient();

    const [inquiryResult, blockedResult] = await Promise.all([
      supabase.from("inquiries").select("*").order("created_at", { ascending: false }),
      supabase.from("blocked_dates").select("*"),
    ]);

    if (inquiryResult.error || blockedResult.error) {
      dbError =
        "Could not read from the database. Check that supabase/schema.sql has been run in the SQL Editor.";
    }

    inquiries = (inquiryResult.data as Inquiry[] | null) ?? [];
    blocked = ((blockedResult.data as BlockedDate[] | null) ?? []).map((row) => row.day);
  }

  const today = todayKey();
  const newCount = inquiries.filter((i) => i.status === "new").length;
  const upcoming = blocked.filter((d) => d >= today).length;

  return (
    <div className="min-h-screen bg-shell">
      {/* Bar */}
      <header className="sticky top-0 z-40 border-b border-stone bg-shell/95 shadow-lift backdrop-blur-sm">
        <div className="mx-auto flex h-[4.5rem] w-full max-w-content items-center justify-between px-6 md:px-10">
          <div className="flex items-baseline gap-4">
            <span className="font-display text-[1.375rem] text-ink-900">{site.name}</span>
            <span className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink-300">
              Owner
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 text-[0.8125rem] text-brass-600 underline decoration-brass-400 underline-offset-4"
            >
              View site
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>

            <form action={signOut}>
              <Button type="submit" variant="secondary" className="px-5 py-2.5">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-content px-6 py-12 md:px-10 md:py-16">
        <h1 className="font-display text-[2.5rem] font-light leading-[1.08] text-ink-900">
          Today at the loft
        </h1>

        {dbError && (
          <p className="mt-8 rounded-sm border border-teak-600 bg-sand px-5 py-4 text-[0.875rem] leading-[1.65] text-teak-600">
            {dbError}
          </p>
        )}

        {/* Three numbers, same treatment as the public site */}
        <dl className="mt-10 grid grid-cols-3 gap-8 border-t border-stone pt-9">
          {[
            { value: String(newCount), label: "New enquiries" },
            { value: String(inquiries.length), label: "Total enquiries" },
            { value: String(upcoming), label: "Days blocked" },
          ].map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-display text-[2rem] font-light leading-none text-ink-900">
                {stat.value}
              </dd>
              <p className="mt-3 text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500">
                {stat.label}
              </p>
            </div>
          ))}
        </dl>

        {/* Calendar */}
        <section className="mt-16">
          <p className="eyebrow">Calendar</p>
          <h2 className="mt-4 font-display text-[1.875rem] font-light text-ink-900">
            Mark the days you are taken
          </h2>
          <p className="mt-3 max-w-prose text-[0.9375rem] leading-[1.7] text-ink-500">
            Anything you block here shows as unavailable on the public calendar straight away.
          </p>

          <div className="mt-8">
            <CalendarManager blocked={blocked} />
          </div>
        </section>

        {/* Inquiries */}
        <section className="mt-20">
          <p className="eyebrow">Enquiries</p>
          <h2 className="mt-4 font-display text-[1.875rem] font-light text-ink-900">
            Who has written in
          </h2>
          <p className="mt-3 max-w-prose text-[0.9375rem] leading-[1.7] text-ink-500">
            Newest first. Change a status once you have replied so you can see what is still open.
          </p>

          <div className="mt-8">
            <InquiryTable inquiries={inquiries} />
          </div>
        </section>
      </main>
    </div>
  );
}
