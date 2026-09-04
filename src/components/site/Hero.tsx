"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { hero, site } from "@/lib/content";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Lightbox } from "@/components/ui/Lightbox";
import { buttonClass } from "@/components/ui/Button";

/* ============================================================================
 *  HERO
 *  The pool photo leads - big, full-bleed, right under the header - with the
 *  title cascading in below it. Emphasis is on the water, not the copy.
 * ========================================================================== */
export function Hero() {
  const [open, setOpen] = useState(false);

  return (
    <section className="relative">
      {/* Full-bleed band, tall enough to lead the page */}
      <div className="relative w-full animate-fade-up">
        {/* TODO: IMAGE REPLACEMENT -> path comes from src/lib/content.ts (hero.image) */}
        <ImageFrame
          src={hero.image}
          alt={hero.imageAlt}
          ratio="16/9"
          priority
          zoomOnHover={false}
          sizes="100vw"
          className="h-[52vh] sm:h-[62vh] md:h-[72vh] xl:h-[78vh]"
          // The source is a tall portrait shot; a center crop lands on the
          // dim treeline. Bias down toward the lit, textured water instead.
          focalPoint="50% 78%"
          onZoom={() => setOpen(true)}
        />

        {/* A wave edge, not a hard line, where the photo meets the page -
            echoes the pool below it instead of just cutting the image off. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 90"
          preserveAspectRatio="none"
          className="pointer-events-none absolute -bottom-px left-0 h-[42px] w-full text-shell md:h-[64px]"
        >
          <path
            d="M0,36 C220,84 380,4 620,40 C860,76 1040,8 1260,38 C1350,50 1400,52 1440,44 L1440,90 L0,90 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Title, below the photo - one staggered cascade, each line a beat
          behind the last, rather than the whole block arriving as one unit. */}
      <div className="mx-auto w-full max-w-content px-6 pb-14 pt-12 md:px-10 md:pb-24 md:pt-16">
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <p className="eyebrow flex animate-fade-up items-center gap-2 [animation-delay:80ms]">
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
              {hero.eyebrow}
            </p>

            <h1 className="mt-7 max-w-[24ch] animate-fade-up font-display text-[3rem] font-light italic leading-[1.02] tracking-[-0.015em] text-ink-900 [animation-delay:160ms] sm:text-[3.75rem] lg:text-hero">
              {hero.heading}
            </h1>

            <p className="mt-6 max-w-[26ch] animate-fade-up font-display text-[1.5rem] font-light leading-[1.25] text-ink-700 [animation-delay:240ms] md:text-[1.875rem]">
              {hero.subheading}
            </p>

            <p className="mt-8 max-w-prose animate-fade-up text-[1rem] leading-[1.75] text-ink-500 [animation-delay:320ms] md:text-[1.1875rem]">
              {hero.body}
            </p>

            <div className="mt-10 flex animate-fade-up flex-wrap items-center gap-4 [animation-delay:400ms]">
              <a href={hero.primaryCta.href} className={buttonClass("primary")}>
                {hero.primaryCta.label}
              </a>
              <a href={hero.secondaryCta.href} className={buttonClass("secondary")}>
                {hero.secondaryCta.label}
              </a>
              {site.contact.facebook && (
                <a
                  href={site.contact.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonClass("link", "ml-1")}
                >
                  View on Facebook
                </a>
              )}
            </div>
          </div>

          {/* Keep one clear empty column in every text section (design doc 04). */}
          <div className="hidden lg:col-span-4 lg:block" aria-hidden="true" />
        </div>
      </div>

      <Lightbox
        images={[{ src: hero.image, alt: hero.imageAlt }]}
        index={open ? 0 : null}
        onClose={() => setOpen(false)}
        onIndexChange={() => {}}
      />
    </section>
  );
}
