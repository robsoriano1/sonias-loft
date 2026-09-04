"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { nav, site } from "@/lib/content";
import { buttonClass } from "@/components/ui/Button";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300 ease-calm ${
        scrolled
          ? "border-stone bg-shell/95 shadow-lift backdrop-blur-sm"
          : "border-transparent bg-shell"
      }`}
    >
      <div className="mx-auto flex h-[4.5rem] w-full max-w-content items-center justify-between px-6 md:px-10">
        <Link
          href="/"
          className="font-display text-[1.375rem] font-normal tracking-[-0.01em] text-ink-900"
        >
          {site.name}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-9 lg:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[0.875rem] text-ink-500 transition-colors duration-300 ease-calm hover:text-ink-900"
            >
              {item.label}
            </a>
          ))}
          <a href="#enquire" className={buttonClass("tertiary", "px-6 py-3")}>
            Check dates
          </a>
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="-mr-2 p-2 text-ink-900 lg:hidden"
        >
          {open ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-stone bg-shell lg:hidden">
          <nav className="mx-auto flex max-w-content flex-col gap-1 px-6 py-5">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-3 text-[1rem] text-ink-700"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#enquire"
              onClick={() => setOpen(false)}
              className={buttonClass("primary", "mt-4 w-full")}
            >
              Book your stay
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
