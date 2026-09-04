import { availability } from "@/lib/content";
import { Section, SectionHeading, Lede } from "@/components/ui/Section";
import { AvailabilityCalendar } from "./AvailabilityCalendar";

export function Availability({ blocked }: { blocked: string[] }) {
  return (
    <Section id="availability" ruled className="bg-sand">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeading eyebrow={availability.eyebrow}>{availability.heading}</SectionHeading>
          <Lede>{availability.body}</Lede>
        </div>

        <div className="hidden lg:col-span-1 lg:block" aria-hidden="true" />

        <div className="lg:col-span-7">
          <AvailabilityCalendar blocked={blocked} />
        </div>
      </div>
    </Section>
  );
}
