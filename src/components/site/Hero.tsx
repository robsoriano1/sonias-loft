"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { hero, site } from "@/lib/content";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Lightbox } from "@/components/ui/Lightbox";
import { buttonClass } from "@/components/ui/Button";

/* ============================================================================
 *  HERO
 *  Display type at 76px (text-hero), light weight, 24ch measure.
 *  Photo is edge-anchored and full-bleed on mobile.
 * ========================================================================== */
export function Hero() {
  const [open, setOpen] = useState(false);

  return (
    <section className="relative">
      <div className="mx-auto w-full max-w-content px-6 pb-14 pt-14 md:px-10 md:pb-24 md:pt-24">
        <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Copy - one staggered cascade on load, each line a beat behind
              the last, rather than the whole block arriving as one unit. */}
          <div className="lg:col-span-8">
            <p className="eyebrow flex animate-fade-up items-center gap-2">
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
              {hero.eyebrow}
            </p>

            <h1 className="mt-7 max-w-[24ch] animate-fade-up font-display text-[3rem] font-light italic leading-[1.02] tracking-[-0.015em] text-ink-900 [animation-delay:90ms] sm:text-[3.75rem] lg:text-hero">
              {hero.heading}
            </h1>

            <p className="mt-6 max-w-[26ch] animate-fade-up font-display text-[1.5rem] font-light leading-[1.25] text-ink-700 [animation-delay:180ms] md:text-[1.875rem]">
              {hero.subheading}
            </p>

            <p className="mt-8 max-w-prose animate-fade-up text-[1rem] leading-[1.75] text-ink-500 [animation-delay:270ms] md:text-[1.1875rem]">
              {hero.body}
            </p>

            <div className="mt-10 flex animate-fade-up flex-wrap items-center gap-4 [animation-delay:360ms]">
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

          {/* Keep one clear empty column in every text section (design doc 04).
              The hero deliberately carries NO second photo - the full-bleed
              band below is the one large image. Airiness is the product. */}
          <div className="hidden lg:col-span-4 lg:block" aria-hidden="true" />
        </div>
      </div>

      {/* Full-bleed 16:9 band under the fold */}
      <div className="relative w-full animate-fade-up [animation-delay:420ms]">
        {/* TODO: IMAGE REPLACEMENT -> path comes from src/lib/content.ts (hero.image) */}
        <ImageFrame
          src={hero.image}
          alt={hero.imageAlt}
          ratio="16/9"
          priority
          zoomOnHover={false}
          sizes="100vw"
          // Capped tighter than the design's 70vh: the source photo is only
          // 1154px wide (a compressed phone export), so on retina/4K screens
          // a taller band forces more upscaling and looks soft. Shrinking the
          // rendered width keeps the crop closer to native resolution.
          className="max-h-[58vh] xl:max-h-[560px]"
          // The source is a tall portrait shot; a center crop lands on the
          // dim treeline. Bias down toward the lit pool instead.
          focalPoint="50% 72%"
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

      <Lightbox
        images={[{ src: hero.image, alt: hero.imageAlt }]}
        index={open ? 0 : null}
        onClose={() => setOpen(false)}
        onIndexChange={() => {}}
      />
    </section>
  );
}
