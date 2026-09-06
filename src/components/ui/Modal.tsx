"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  /** Must match the id on the visible heading passed as `title`. */
  titleId: string;
  title: string;
  children: ReactNode;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* ============================================================================
 *  MODAL
 *  A small, dependency-free dialog: Esc closes, backdrop click closes, focus
 *  is trapped inside while open and returned to the trigger on close, and
 *  the header (with its close button) stays put while the body scrolls.
 *  Same fixed-overlay idiom as Lightbox, just a centred card instead of a
 *  full-bleed photo.
 * ========================================================================== */
export function Modal({ open, onClose, titleId, title, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;

    triggerRef.current = document.activeElement;
    closeButtonRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusables = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      (triggerRef.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-shell/80 backdrop-blur-xl animate-fade-up sm:items-center sm:px-4 sm:py-6"
    >
      <div
        ref={panelRef}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-md border border-stone bg-sand shadow-lift sm:max-w-2xl sm:rounded-md"
      >
        {/* Sticky header - stays visible above the scrolling body below. */}
        <div className="flex shrink-0 items-center justify-between border-b border-stone bg-sand px-6 py-5 sm:px-8">
          <h2 id={titleId} className="font-display text-[1.375rem] font-light text-ink-900">
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-ink-500 transition-colors duration-300 ease-calm hover:text-ink-900"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-7 sm:px-8 sm:py-8">{children}</div>
      </div>
    </div>
  );
}
