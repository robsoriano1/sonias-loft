import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-shell px-6 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-5 font-display text-[2.5rem] font-light text-ink-900">
        That page is not here
      </h1>
      <p className="mt-4 max-w-prose text-[1rem] text-ink-500">
        The pool, though, is exactly where you left it.
      </p>
      <Link href="/" className={buttonClass("primary", "mt-10")}>
        Back to the loft
      </Link>
    </main>
  );
}
