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
import { amenities } from "@/lib/content";
import { Section, SectionHeading, Lede } from "@/components/ui/Section";

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

export function Amenities() {
  return (
    <Section id="amenities" ruled>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeading eyebrow={amenities.eyebrow}>{amenities.heading}</SectionHeading>
          <Lede>{amenities.body}</Lede>
        </div>

        {/* One clear empty column */}
        <div className="hidden lg:col-span-1 lg:block" aria-hidden="true" />

        <ul className="grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:col-span-7">
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
      </div>
    </Section>
  );
}
