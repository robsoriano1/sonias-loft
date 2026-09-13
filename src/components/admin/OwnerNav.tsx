"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* Horizontal tabs, scrollable on a phone rather than wrapping into two rows.
   The admin side is used one-handed on a mobile more often than at a desk. */
const TABS = [
  { href: "/admin", label: "Today" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/settings", label: "Settings" },
];

export function OwnerNav() {
  const pathname = usePathname();

  return (
    <nav className="-mx-6 flex gap-1 overflow-x-auto px-6 md:mx-0 md:px-0">
      {TABS.map((tab) => {
        // /admin must not light up for /admin/enquiries.
        const active = tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={[
              "whitespace-nowrap border-b-2 px-4 py-3 text-[0.6875rem] uppercase tracking-[0.15em] transition-colors duration-300 ease-calm",
              active
                ? "border-ink-900 text-ink-900"
                : "border-transparent text-ink-500 hover:text-ink-900",
            ].join(" ")}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
