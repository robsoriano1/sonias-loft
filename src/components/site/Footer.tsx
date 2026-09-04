import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { footer, site } from "@/lib/content";

export function Footer() {
  return (
    <footer className="border-t border-stone bg-white">
      <div className="mx-auto w-full max-w-content px-6 py-16 md:px-10 md:py-20">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <p className="font-display text-[1.875rem] font-light text-ink-900">
              {footer.heading}
            </p>
            <p className="mt-3 text-[0.875rem] text-ink-500">{footer.body}</p>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <a
              href={`mailto:${site.contact.email}`}
              className="flex items-center gap-2.5 text-[0.875rem] text-ink-500 transition-colors duration-300 ease-calm hover:text-ink-900"
            >
              <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
              {site.contact.email}
            </a>
            <a
              href={`tel:${site.contact.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-2.5 text-[0.875rem] text-ink-500 transition-colors duration-300 ease-calm hover:text-ink-900"
            >
              <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
              {site.contact.phone}
            </a>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-stone pt-8">
          <p className="text-[0.78125rem] text-ink-300">
            &copy; {new Date().getFullYear()} {site.name}. {footer.note}
          </p>
          {/* The owner's way in. Quiet on purpose. */}
          <Link
            href="/admin"
            className="text-[0.78125rem] text-ink-300 transition-colors duration-300 ease-calm hover:text-ink-500"
          >
            Owner
          </Link>
        </div>
      </div>
    </footer>
  );
}
