"use client";

import { useState } from "react";
import { theLoft } from "@/lib/content";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Lightbox } from "@/components/ui/Lightbox";
import { Section, SectionHeading, Lede } from "@/components/ui/Section";

export function TheLoft() {
  const [open, setOpen] = useState(false);

  return (
    <Section id="the-loft">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeading eyebrow={theLoft.eyebrow}>{theLoft.heading}</SectionHeading>
          <Lede>{theLoft.body}</Lede>

          <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-stone pt-10 sm:grid-cols-4">
            {theLoft.stats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-[2rem] font-light leading-none text-ink-900">
                  {stat.value}
                </dd>
                <p className="mt-3 text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </dl>
        </div>

        {/* One clear empty column */}
        <div className="hidden lg:col-span-1 lg:block" aria-hidden="true" />

        <div className="lg:col-span-6">
          {/* TODO: IMAGE REPLACEMENT -> path comes from src/lib/content.ts (theLoft.image) */}
          <ImageFrame
            src={theLoft.image}
            alt={theLoft.imageAlt}
            ratio="16/9"
            sizes="(min-width: 1024px) 50vw, 100vw"
            // Tall portrait source; bias down from a plain center crop so the
            // lit windows and pool show instead of mostly roofline and sky.
            focalPoint="50% 60%"
            onZoom={() => setOpen(true)}
          />
        </div>
      </div>

      <Lightbox
        images={[{ src: theLoft.image, alt: theLoft.imageAlt }]}
        index={open ? 0 : null}
        onClose={() => setOpen(false)}
        onIndexChange={() => {}}
      />
    </Section>
  );
}
