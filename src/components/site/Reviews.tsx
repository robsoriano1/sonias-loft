import { Quote } from "lucide-react";
import { reviews } from "@/lib/content";
import { Section, SectionHeading, Lede } from "@/components/ui/Section";

/* ============================================================================
 *  REVIEWS
 *  A grid of quote cards. Entries with no quote in content.ts are skipped,
 *  so this section stays out of the way until real reviews are added.
 * ========================================================================== */
export function Reviews() {
  const items = reviews.items.filter((item) => item.quote.trim().length > 0);

  return (
    <Section id="reviews" ruled>
      <div className="lg:max-w-[36ch]">
        <SectionHeading eyebrow={reviews.eyebrow}>{reviews.heading}</SectionHeading>
        <Lede>{reviews.body}</Lede>
      </div>

      {items.length > 0 ? (
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((item, index) => (
            <li
              key={`${item.name}-${index}`}
              className="flex flex-col rounded-md border border-stone bg-white p-7"
            >
              <Quote className="h-4 w-4 text-lagoon-800" strokeWidth={1.5} aria-hidden="true" />
              <p className="mt-4 text-[0.9375rem] leading-[1.75] text-ink-700">{item.quote}</p>
              <p className="mt-6 text-[0.875rem] font-medium text-ink-900">{item.name}</p>
              {item.detail && (
                <p className="mt-1 text-[0.78125rem] text-ink-500">{item.detail}</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-12 text-[0.875rem] text-ink-300">
          {/* Placeholder until real reviews are added in src/lib/content.ts */}
          Reviews are on their way.
        </p>
      )}
    </Section>
  );
}
