import { site } from "./content";

/* ============================================================================
 *  Where this deployment actually lives.
 *
 *  site.url in content.ts is the domain the property would like to have, not
 *  necessarily one anybody owns. Links inside emails have to point at the
 *  real deployment or they go nowhere, so the guessing order is:
 *
 *    1. NEXT_PUBLIC_SITE_URL  - set it once a real domain exists
 *    2. Vercel's own production URL, then the per-deployment URL, both of
 *       which Vercel injects automatically and neither of which can be wrong
 *    3. site.url, as a last resort for local work
 * ========================================================================== */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  // Vercel supplies these without a protocol.
  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ?? null;
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return site.url.replace(/\/$/, "");
}
