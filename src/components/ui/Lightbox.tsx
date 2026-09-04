"use client";

import { useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type LightboxImage = { src: string; alt: string };

type Props = {
  images: LightboxImage[];
  /** null closes the lightbox. */
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

/* ============================================================================
 *  LIGHTBOX
 *  Full-screen photo viewer. Esc closes, arrow keys navigate, click on the
 *  backdrop closes. Shared across every gallery of photos on the site.
 * ========================================================================== */
export function Lightbox({ images, index, onClose, onIndexChange }: Props) {
  const open = index !== null;
  const count = images.length;

  const goPrev = useCallback(() => {
    if (index === null) return;
    onIndexChange((index - 1 + count) % count);
  }, [index, count, onIndexChange]);

  const goNext = useCallback(() => {
    if (index === null) return;
    onIndexChange((index + 1) % count);
  }, [index, count, onIndexChange]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, goPrev, goNext]);

  if (index === null) return null;
  const current = images[index];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={current.alt}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-shell/97 px-4 py-6 animate-fade-up"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center text-ink-900/80 transition-colors duration-300 ease-calm hover:text-ink-900 md:right-6 md:top-6"
      >
        <X className="h-6 w-6" strokeWidth={1.5} />
      </button>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              goPrev();
            }}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-ink-900/80 transition-colors duration-300 ease-calm hover:text-ink-900 md:left-6"
          >
            <ChevronLeft className="h-7 w-7" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              goNext();
            }}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-ink-900/80 transition-colors duration-300 ease-calm hover:text-ink-900 md:right-6"
          >
            <ChevronRight className="h-7 w-7" strokeWidth={1.5} />
          </button>
        </>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element -- full-size original, no fixed box to size against */}
      <img
        src={current.src}
        alt={current.alt}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[88vh] max-w-[92vw] object-contain"
      />

      {count > 1 && (
        <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[0.78125rem] tracking-[0.1em] text-ink-900/70">
          {index + 1} / {count}
        </p>
      )}
    </div>
  );
}
