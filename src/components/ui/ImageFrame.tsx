"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageIcon } from "lucide-react";

type Ratio = "16/9" | "3/4" | "1/1";

type Props = {
  src: string;
  alt: string;
  /** Design system allows 16:9 and 3:4 only. */
  ratio?: Ratio;
  sizes?: string;
  priority?: boolean;
  /** Slow 1.03 zoom on hover, per the motion rules. */
  zoomOnHover?: boolean;
  className?: string;
};

/* ============================================================================
 *  ImageFrame
 *  ---------------------------------------------------------------------------
 *  Holds the layout open whether or not the photo exists yet.
 *
 *  - Before upload: a sand-coloured skeleton with the expected filename on it,
 *    so the page is structurally complete and you know what to drop in.
 *  - After upload: the photo fades in over 400ms, zero layout shift.
 *
 *  Corners are 0 - the design system forbids rounding on images.
 * ========================================================================== */
export function ImageFrame({
  src,
  alt,
  ratio = "16/9",
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority = false,
  zoomOnHover = true,
  className = "",
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [missing, setMissing] = useState(false);

  const filename = src.split("/").pop() ?? src;
  const ready = loaded && !missing;

  return (
    <div
      className={`group relative isolate overflow-hidden bg-sand ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {/* Skeleton - visible until the real photo has decoded */}
      <div
        aria-hidden="true"
        className={`img-skeleton absolute inset-0 transition-opacity duration-500 ease-calm ${
          ready ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Filename hint, only while the photo is genuinely missing */}
      {missing && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-4 text-center"
        >
          <ImageIcon className="h-5 w-5 text-ink-300" strokeWidth={1.25} />
          <span className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500">
            {filename}
          </span>
          <span className="text-[0.78125rem] text-ink-300">
            drop this file in /public/images
          </span>
        </div>
      )}

      {!missing && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onLoad={() => setLoaded(true)}
          onError={() => setMissing(true)}
          className={`object-cover transition-[opacity,transform] duration-[400ms] ease-calm ${
            ready ? "opacity-100" : "opacity-0"
          } ${zoomOnHover ? "group-hover:scale-[1.03]" : ""}`}
        />
      )}
    </div>
  );
}
