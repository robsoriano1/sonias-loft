import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* ============================================================================
 *  Buttons - exactly the four the design document specifies.
 *
 *    primary   ink filled, hovers to lagoon
 *    secondary hairline outline on white
 *    tertiary  lagoon-50 wash, lagoon-800 text
 *    link      brass underline (brass NEVER fills a button)
 *
 *  Corners 2px. Tracking +0.08em. 250-400ms ease-calm.
 * ========================================================================== */

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "link";

const base =
  "inline-flex items-center justify-center gap-2 text-[0.78125rem] font-medium uppercase tracking-[0.08em] transition-colors duration-300 ease-calm disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary:
    "rounded-sm bg-ink-900 px-7 py-4 text-shell hover:bg-lagoon-800 hover:shadow-glow",
  secondary:
    "rounded-sm border border-stone bg-sand px-7 py-4 text-ink-900 hover:border-ink-900",
  tertiary:
    "rounded-sm bg-lagoon-50 px-7 py-4 text-lagoon-800 hover:bg-lagoon-300 hover:text-ink-900 hover:shadow-glow",
  link:
    "border-b border-brass-400 pb-0.5 text-brass-600 hover:border-brass-600",
};

export function buttonClass(variant: ButtonVariant = "primary", extra = "") {
  return `${base} ${variants[variant]} ${extra}`.trim();
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

export function Button({ variant = "primary", className = "", children, ...rest }: ButtonProps) {
  return (
    <button className={buttonClass(variant, className)} {...rest}>
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

export function ButtonLink({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, className)} {...rest}>
      {children}
    </Link>
  );
}
