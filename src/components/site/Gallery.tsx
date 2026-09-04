import { gallery } from "@/lib/content";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Section, SectionHeading, Lede } from "@/components/ui/Section";

export function Gallery() {
  return (
    <Section id="gallery" ruled className="bg-white">
      <div className="max-w-prose">
        <SectionHeading eyebrow={gallery.eyebrow}>{gallery.heading}</SectionHeading>
        <Lede>{gallery.body}</Lede>
      </div>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {gallery.items.map((item) => (
          // TODO: IMAGE REPLACEMENT -> paths come from src/lib/content.ts (gallery.items)
          <ImageFrame
            key={item.src}
            src={item.src}
            alt={item.alt}
            ratio={item.ratio as "16/9" | "3/4"}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        ))}
      </div>
    </Section>
  );
}
