import { MapPin } from "lucide-react";
import { hero, site } from "@/lib/content";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { buttonClass } from "@/components/ui/Button";

/* ============================================================================
 *  HERO
 *  Display type at 76px (text-hero), light weight, 24ch measure.
 *  Photo is edge-anchored and full-bleed on mobile.
 * ========================================================================== */
export function Hero() {
  return (
    <section className="relative">
      <div className="mx-auto w-full max-w-content px-6 pb-14 pt-14 md:px-10 md:pb-24 md:pt-24">
        <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Copy */}
          <div className="animate-fade-up lg:col-span-8">
            <p className="eyebrow flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
              {hero.eyebrow}
            </p>

            <h1 className="mt-7 max-w-[24ch] font-display text-[3rem] font-light leading-[1.02] tracking-[-0.015em] text-ink-900 sm:text-[3.75rem] lg:text-hero">
              {hero.heading}
            </h1>

            <p className="mt-6 max-w-[26ch] font-display text-[1.5rem] font-light leading-[1.25] text-ink-700 md:text-[1.875rem]">
              {hero.subheading}
            </p>

            <p className="mt-8 max-w-prose text-[1rem] leading-[1.75] text-ink-500 md:text-[1.1875rem]">
              {hero.body}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
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
                  Message on Facebook
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
      <div className="w-full">
        {/* TODO: IMAGE REPLACEMENT -> path comes from src/lib/content.ts (hero.image) */}
        <ImageFrame
          src={hero.image}
          alt={hero.imageAlt}
          ratio="16/9"
          priority
          zoomOnHover={false}
          sizes="100vw"
          className="max-h-[70vh]"
        />
      </div>
    </section>
  );
}
