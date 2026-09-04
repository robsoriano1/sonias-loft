"use client";

import { useState } from "react";
import { Facebook } from "lucide-react";
import { gallery, site } from "@/lib/content";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Lightbox } from "@/components/ui/Lightbox";
import { Section, SectionHeading, Lede } from "@/components/ui/Section";
import { buttonClass } from "@/components/ui/Button";

export function Gallery() {
  const [index, setIndex] = useState<number | null>(null);

  return (
    <Section id="gallery" ruled className="bg-white">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-prose">
          <SectionHeading eyebrow={gallery.eyebrow}>{gallery.heading}</SectionHeading>
          <Lede>{gallery.body}</Lede>
        </div>

        {site.contact.facebookPhotos && (
          <a
            href={site.contact.facebookPhotos}
            target="_blank"
            rel="noreferrer"
            className={buttonClass("link", "shrink-0")}
          >
            <Facebook className="h-3.5 w-3.5" strokeWidth={1.5} />
            More photos on Facebook
          </a>
        )}
      </div>

      {/* Masonry columns, not a grid - a 3:4 and a 16:9 photo can sit side
          by side without leaving a ragged gap under the shorter one. */}
      <div className="mt-14 columns-1 gap-4 sm:columns-2 lg:columns-3 lg:gap-5">
        {gallery.items.map((item, i) => (
          // TODO: IMAGE REPLACEMENT -> paths come from src/lib/content.ts (gallery.items)
          <div key={item.src} className="mb-4 break-inside-avoid lg:mb-5">
            <ImageFrame
              src={item.src}
              alt={item.alt}
              ratio={item.ratio as "16/9" | "3/4"}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              onZoom={() => setIndex(i)}
            />
          </div>
        ))}
      </div>

      <Lightbox
        images={gallery.items.map((item) => ({ src: item.src, alt: item.alt }))}
        index={index}
        onClose={() => setIndex(null)}
        onIndexChange={setIndex}
      />
    </Section>
  );
}
