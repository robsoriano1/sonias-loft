"use client";

import { useState } from "react";
import { pool } from "@/lib/content";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Lightbox } from "@/components/ui/Lightbox";
import { Eyebrow } from "@/components/ui/Section";

/* ============================================================================
 *  THE POOL - the "card & section pattern in use" from the design document:
 *  a 3:4 photo hard against the left edge of the card, copy on the right,
 *  a hairline rule, then the three numbers.
 *  1px stone border, 4px corners, shadow-soft on hover. Nothing else.
 * ========================================================================== */
export function Pool() {
  const [open, setOpen] = useState(false);

  return (
    <section id="the-pool" className="border-t border-stone py-14 md:py-section lg:py-section-lg">
      <div className="mx-auto w-full max-w-content px-6 md:px-10">
        <div className="grid overflow-hidden rounded-md border border-stone bg-white transition-shadow duration-300 ease-calm hover:shadow-soft lg:grid-cols-2">
          {/* TODO: IMAGE REPLACEMENT -> path comes from src/lib/content.ts (pool.image) */}
          <ImageFrame
            src={pool.image}
            alt={pool.imageAlt}
            ratio="3/4"
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="h-full"
            onZoom={() => setOpen(true)}
          />

          <div className="flex flex-col justify-center px-7 py-12 md:px-14 md:py-16">
            <Eyebrow>{pool.eyebrow}</Eyebrow>

            <h2 className="mt-5 max-w-[16ch] font-display text-[2rem] font-light leading-[1.08] tracking-[-0.01em] text-ink-900 md:text-[2.5rem]">
              {pool.heading}
            </h2>

            <p className="mt-6 max-w-prose text-[1rem] leading-[1.75] text-ink-500 md:text-[1.1875rem]">
              {pool.body}
            </p>

            <dl className="mt-10 flex gap-10 border-t border-stone pt-8">
              {pool.stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="font-display text-[1.75rem] font-light leading-none text-ink-900">
                    {stat.value}
                  </dd>
                  <p className="mt-3 text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500">
                    {stat.label}
                  </p>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <Lightbox
        images={[{ src: pool.image, alt: pool.imageAlt }]}
        index={open ? 0 : null}
        onClose={() => setOpen(false)}
        onIndexChange={() => {}}
      />
    </section>
  );
}
