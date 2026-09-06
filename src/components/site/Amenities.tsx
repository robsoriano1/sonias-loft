"use client";

import { useId, useState } from "react";
import {
  Waves,
  Wind,
  Wifi,
  UtensilsCrossed,
  Car,
  Tv,
  Trees,
  ShowerHead,
  Coffee,
  WashingMachine,
  Flame,
  Speaker,
  Check,
  type LucideIcon,
} from "lucide-react";
import { amenities, facilities } from "@/lib/content";
import { Section, SectionHeading, Lede } from "@/components/ui/Section";
import { Modal } from "@/components/ui/Modal";
import { buttonClass } from "@/components/ui/Button";

/* Map the plain-English icon names used in content.ts to Lucide icons.
   Add a new pair here if you want a new icon available in content.ts. */
const ICONS: Record<string, LucideIcon> = {
  waves: Waves,
  wind: Wind,
  wifi: Wifi,
  kitchen: UtensilsCrossed,
  car: Car,
  tv: Tv,
  trees: Trees,
  shower: ShowerHead,
  coffee: Coffee,
  washer: WashingMachine,
  grill: Flame,
  speaker: Speaker,
};

/* ============================================================================
 *  AMENITIES
 *  The curated grid is the highlight - a dozen items with real editorial
 *  detail. Everything else the property has lives behind "Show all N
 *  amenities" in a modal, categorised, with nothing that already appears
 *  above repeated under a different generic name.
 * ========================================================================== */
export function Amenities() {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  const extraCount = facilities.groups.reduce((count, group) => count + group.items.length, 0);
  const totalCount = amenities.items.length + extraCount;

  return (
    <Section id="amenities" ruled>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeading eyebrow={amenities.eyebrow}>{amenities.heading}</SectionHeading>
          <Lede>{amenities.body}</Lede>
        </div>

        {/* One clear empty column */}
        <div className="hidden lg:col-span-1 lg:block" aria-hidden="true" />

        <div className="lg:col-span-7">
          <ul className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
            {amenities.items.map((item) => {
              const Icon = ICONS[item.icon] ?? Check;
              return (
                <li key={item.title} className="flex gap-4">
                  <Icon
                    className="mt-1 h-[1.125rem] w-[1.125rem] shrink-0 text-lagoon-800"
                    strokeWidth={1.25}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-[1rem] font-medium text-ink-900">{item.title}</p>
                    <p className="mt-1 text-[0.875rem] leading-[1.65] text-ink-500">
                      {item.detail}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <button type="button" onClick={() => setOpen(true)} className={buttonClass("secondary", "mt-10")}>
            Show all {totalCount} amenities
          </button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} titleId={titleId} title={facilities.heading}>
        <div className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
          {facilities.groups.map((group) => (
            <div key={group.category}>
              <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink-900">
                {group.category}
              </p>
              <ul className="mt-4 space-y-2.5">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[0.875rem] leading-[1.6] text-ink-500">
                    <Check
                      className="mt-1 h-3.5 w-3.5 shrink-0 text-lagoon-800"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Modal>
    </Section>
  );
}
