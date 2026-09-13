import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { site } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { signOut } from "../actions";
import { OwnerNav } from "@/components/admin/OwnerNav";
import { requireOwner } from "@/lib/roles";

export const revalidate = 0;

/* The chrome every signed-in owner screen sits inside. /admin/login is
   deliberately outside this route group so it keeps its own bare layout.

   The role check here covers every page in the group; row-level security is
   what actually stops a staff account reading any of this, so the redirect
   is about not showing someone a screen that would only render empty. */
export default async function OwnerLayout({ children }: { children: ReactNode }) {
  await requireOwner();

  return (
    <div className="min-h-screen bg-shell">
      <header className="sticky top-0 z-40 border-b border-stone bg-shell/95 shadow-lift backdrop-blur-sm">
        <div className="mx-auto w-full max-w-content px-6 md:px-10">
          <div className="flex h-[4.5rem] items-center justify-between">
            <div className="flex items-baseline gap-4">
              <Link href="/admin" className="font-display text-[1.375rem] text-ink-900">
                {site.name}
              </Link>
              <span className="hidden text-[0.6875rem] uppercase tracking-[0.2em] text-ink-300 sm:inline">
                Owner
              </span>
            </div>

            <div className="flex items-center gap-5 sm:gap-6">
              <Link
                href="/"
                target="_blank"
                className="hidden items-center gap-1.5 text-[0.8125rem] text-brass-600 underline decoration-brass-400 underline-offset-4 sm:flex"
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

          <OwnerNav />
        </div>
      </header>

      <main className="mx-auto w-full max-w-content px-6 py-10 md:px-10 md:py-14">{children}</main>
    </div>
  );
}
