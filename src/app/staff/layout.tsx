import type { ReactNode } from "react";
import Link from "next/link";
import { site } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { currentUser } from "@/lib/roles";
import { staffSignOut } from "./actions";

export const revalidate = 0;

export default async function StaffLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();

  return (
    <div className="min-h-screen bg-shell">
      <header className="sticky top-0 z-40 border-b border-stone bg-shell/95 shadow-lift backdrop-blur-sm">
        <div className="mx-auto flex h-[4.5rem] w-full max-w-content items-center justify-between px-6 md:px-10">
          <div className="flex items-baseline gap-4">
            <span className="font-display text-[1.375rem] text-ink-900">{site.name}</span>
            <span className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink-300">
              Turnovers
            </span>
          </div>

          <div className="flex items-center gap-5">
            {/* Owners land here too when they follow a link; give them a way back. */}
            {user?.role === "owner" && (
              <Link
                href="/admin"
                className="text-[0.8125rem] text-brass-600 underline decoration-brass-400 underline-offset-4"
              >
                Owner view
              </Link>
            )}

            <form action={staffSignOut}>
              <Button type="submit" variant="secondary" className="px-5 py-2.5">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-content px-6 py-10 md:px-10 md:py-14">{children}</main>
    </div>
  );
}
