"use client";

import { useState } from "react";
import { Quote } from "lucide-react";
import { reviews } from "@/lib/content";
import { Section, SectionHeading, Lede } from "@/components/ui/Section";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Lightbox } from "@/components/ui/Lightbox";

/* ============================================================================
 *  REVIEWS
 *  Three photo + quote cards. The photo slot is always held open (see
 *  ImageFrame) so there is always a space for guest pictures, even before
 *  any are uploaded. Quote and name only render once filled in.
 * ========================================================================== */
export function Reviews() {
  const [index, setIndex] = useState<number | null>(null);

  return (
    <Section id="reviews" ruled>
      <div className="lg:max-w-[36ch]">
        <SectionHeading eyebrow={reviews.eyebrow}>{reviews.heading}</SectionHeading>
        <Lede>{reviews.body}</Lede>
      </div>

      <ul className="mt-12 grid gap-6 md:grid-cols-3">
        {reviews.items.map((item, i) => (
          <li
            key={i}
            className="overflow-hidden rounded-md border border-stone bg-white"
          >
            {/* TODO: IMAGE REPLACEMENT -> path comes from src/lib/content.ts (reviews.items[].image) */}
            <ImageFrame
              src={item.image}
              alt={item.name ? `Photo from ${item.name}'s stay` : "Guest photo"}
              ratio="3/4"
              sizes="(min-width: 768px) 33vw, 100vw"
              zoomOnHover={false}
              onZoom={() => setIndex(i)}
            />

            {(item.quote || item.name) && (
              <div className="flex flex-col p-7">
                <Quote className="h-4 w-4 text-lagoon-800" strokeWidth={1.5} aria-hidden="true" />
                {item.quote && (
                  <p className="mt-4 text-[0.9375rem] leading-[1.75] text-ink-700">
                    {item.quote}
                  </p>
                )}
                {item.name && (
                  <p className="mt-6 text-[0.875rem] font-medium text-ink-900">{item.name}</p>
                )}
                {item.detail && (
                  <p className="mt-1 text-[0.78125rem] text-ink-500">{item.detail}</p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      <Lightbox
        images={reviews.items.map((item) => ({
          src: item.image,
          alt: item.name ? `Photo from ${item.name}'s stay` : "Guest photo",
        }))}
        index={index}
        onClose={() => setIndex(null)}
        onIndexChange={setIndex}
      />
    </Section>
  );
}
