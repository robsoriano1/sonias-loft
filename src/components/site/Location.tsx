import { MapPin, Navigation2 } from "lucide-react";
import { location, site } from "@/lib/content";
import { Section, SectionHeading, Lede } from "@/components/ui/Section";
import { buttonClass } from "@/components/ui/Button";

/* ============================================================================
 *  LOCATION
 *  Guests booking a hillside stay need to know the drive is real before they
 *  arrive, not after. Map on the right, driving times and road notes on the
 *  left, nearby landmarks underneath - the same two-column rhythm as
 *  TheLoft, just with an embedded map standing in for a photo.
 * ========================================================================== */
export function Location() {
  return (
    <Section id="location" ruled>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeading eyebrow={location.eyebrow}>{location.heading}</SectionHeading>
          <Lede>{location.body}</Lede>

          <p className="mt-6 max-w-prose text-[0.875rem] leading-[1.65] text-ink-500">
            {location.roadNote}
          </p>

          <dl className="mt-10 grid grid-cols-3 gap-x-6 gap-y-8 border-t border-stone pt-8">
            {location.driveTimes.map((drive) => (
              <div key={drive.from}>
                <dt className="sr-only">Driving time from {drive.from}</dt>
                <dd className="font-display text-[1.5rem] font-light leading-none text-ink-900 md:text-[1.75rem]">
                  {drive.time}
                </dd>
                <p className="mt-3 text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500">
                  from {drive.from}
                </p>
              </div>
            ))}
          </dl>
        </div>

        {/* One clear empty column */}
        <div className="hidden lg:col-span-1 lg:block" aria-hidden="true" />

        <div className="lg:col-span-7">
          <div className="w-full overflow-hidden rounded-md border border-stone bg-sand">
            <iframe
              src={location.mapEmbedSrc}
              title={`Map showing ${site.name} in ${site.location}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block w-full"
              style={{ aspectRatio: "16/9", border: 0 }}
            />
          </div>

          <ul className="mt-8 grid gap-x-10 gap-y-5 sm:grid-cols-2">
            {location.landmarks.map((item) => (
              <li key={item.name} className="flex gap-3">
                <MapPin
                  className="mt-1 h-3.5 w-3.5 shrink-0 text-lagoon-800"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-[0.875rem] font-medium text-ink-900">{item.name}</p>
                  <p className="mt-0.5 text-[0.8125rem] text-ink-500">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>

          <a
            href={location.directionsHref}
            target="_blank"
            rel="noreferrer"
            className={buttonClass("secondary", "mt-8")}
          >
            <Navigation2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
            Get directions
          </a>
        </div>
      </div>
    </Section>
  );
}
