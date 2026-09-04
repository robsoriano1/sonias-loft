import { Check } from "lucide-react";
import { houseRules } from "@/lib/content";
import { Section, SectionHeading, Lede } from "@/components/ui/Section";

export function HouseRules() {
  return (
    <Section id="house-rules" ruled>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeading eyebrow={houseRules.eyebrow}>{houseRules.heading}</SectionHeading>
          <Lede>{houseRules.body}</Lede>
        </div>

        {/* One clear empty column */}
        <div className="hidden lg:col-span-1 lg:block" aria-hidden="true" />

        <ul className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:col-span-7">
          {houseRules.items.map((rule) => (
            <li key={rule} className="flex gap-3 text-[0.875rem] leading-[1.65] text-ink-500">
              <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-lagoon-800" strokeWidth={1.5} />
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
