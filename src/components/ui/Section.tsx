import type { ReactNode } from "react";

/* Section padding: 96-140px desktop, 56-72px mobile (design doc, section 04).
   max-w-content is 74rem. Everything sits on the same rhythm. */

type SectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  /** Adds the hairline rule above the section. */
  ruled?: boolean;
};

export function Section({ id, children, className = "", ruled = false }: SectionProps) {
  return (
    <section
      id={id}
      className={`${ruled ? "border-t border-stone" : ""} py-14 md:py-section lg:py-section-lg ${className}`}
    >
      <div className="mx-auto w-full max-w-content px-6 md:px-10">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

/* One serif headline per section. Never two competing. */
export function SectionHeading({
  eyebrow,
  children,
  className = "",
}: {
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-5 max-w-[24ch] font-display text-[2rem] font-light leading-[1.08] tracking-[-0.01em] text-ink-900 md:text-[2.5rem]">
        {children}
      </h2>
    </div>
  );
}

export function Lede({ children }: { children: ReactNode }) {
  return (
    <p className="mt-6 max-w-prose text-[1rem] leading-[1.75] text-ink-500 md:text-[1.1875rem]">
      {children}
    </p>
  );
}
