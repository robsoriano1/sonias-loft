import { amenities, gallery, houseRules, reviews } from "./content";
import type { AmenityItem, ContentKey, GalleryItem, ReviewItem } from "./types";

/* ============================================================================
 *  Owner-editable content.
 *
 *  src/lib/content.ts stays the source of truth for structure, copy that
 *  never changes, and the defaults. This module layers anything the owner has
 *  edited in the admin over the top.
 *
 *  Nothing here can take the landing page down. Every resolver validates the
 *  stored JSON and falls back to the code defaults item by item, so a
 *  half-written row, a missing table, or a database that has never had
 *  migration 002 run against it all render the site exactly as it ships.
 * ========================================================================== */

export type EditableContent = {
  gallery: GalleryItem[];
  amenities: AmenityItem[];
  houseRules: string[];
  reviews: ReviewItem[];
};

export const CONTENT_DEFAULTS: EditableContent = {
  gallery: gallery.items.map((item) => ({ ...item })) as GalleryItem[],
  amenities: amenities.items.map((item) => ({ ...item })) as AmenityItem[],
  houseRules: [...houseRules.items],
  reviews: reviews.items.map((item) => ({ ...item })) as ReviewItem[],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

function parseGallery(value: unknown): GalleryItem[] | null {
  if (!Array.isArray(value)) return null;

  const items = value.filter(isRecord).flatMap<GalleryItem>((raw) => {
    const src = text(raw.src);
    if (!src) return [];
    // The design system allows exactly two crops; anything else would break
    // the grid, so an unrecognised value becomes the portrait default.
    const ratio = raw.ratio === "16/9" ? "16/9" : "3/4";
    return [{ src, alt: text(raw.alt), ratio }];
  });

  return items.length > 0 ? items : null;
}

function parseAmenities(value: unknown): AmenityItem[] | null {
  if (!Array.isArray(value)) return null;

  const items = value.filter(isRecord).flatMap<AmenityItem>((raw) => {
    const title = text(raw.title);
    if (!title) return [];
    return [{ icon: text(raw.icon) || "check", title, detail: text(raw.detail) }];
  });

  return items.length > 0 ? items : null;
}

function parseHouseRules(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const items = value.map(text).filter(Boolean);
  return items.length > 0 ? items : null;
}

function parseReviews(value: unknown): ReviewItem[] | null {
  if (!Array.isArray(value)) return null;

  const items = value.filter(isRecord).flatMap<ReviewItem>((raw) => {
    const quote = text(raw.quote);
    if (!quote) return [];
    return [
      {
        image: text(raw.image),
        quote,
        name: text(raw.name) || "Guest",
        detail: text(raw.detail),
      },
    ];
  });

  return items.length > 0 ? items : null;
}

/** Fold stored rows over the defaults. Unknown keys and junk are ignored. */
export function resolveContent(rows: { key: string; value: unknown }[]): EditableContent {
  const resolved: EditableContent = {
    gallery: CONTENT_DEFAULTS.gallery,
    amenities: CONTENT_DEFAULTS.amenities,
    houseRules: CONTENT_DEFAULTS.houseRules,
    reviews: CONTENT_DEFAULTS.reviews,
  };

  for (const row of rows) {
    switch (row.key as ContentKey) {
      case "gallery":
        resolved.gallery = parseGallery(row.value) ?? resolved.gallery;
        break;
      case "amenities":
        resolved.amenities = parseAmenities(row.value) ?? resolved.amenities;
        break;
      case "house_rules":
        resolved.houseRules = parseHouseRules(row.value) ?? resolved.houseRules;
        break;
      case "reviews":
        resolved.reviews = parseReviews(row.value) ?? resolved.reviews;
        break;
    }
  }

  return resolved;
}
