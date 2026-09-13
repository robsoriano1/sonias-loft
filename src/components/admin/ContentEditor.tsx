"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Check, Loader2, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import type { AmenityItem, ContentKey, GalleryItem, ReviewItem } from "@/lib/types";
import { AMENITY_ICONS } from "@/lib/types";
import type { EditableContent } from "@/lib/content-db";
import { resetContentBlock, saveContentBlock } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

/* ============================================================================
 *  Owner-editable content.
 *
 *  Four sections, one at a time, each editing a plain list. Local state until
 *  Save, so a half-finished edit never reaches the landing page - and an
 *  explicit Reset puts a section back to what ships in src/lib/content.ts.
 *
 *  Photos upload to Supabase Storage rather than the repo, which is the whole
 *  point: adding a picture should not need a developer and a redeploy.
 * ========================================================================== */

const field =
  "w-full rounded-sm border border-stone bg-sand px-3.5 py-2.5 text-[0.9375rem] text-ink-900 placeholder:text-ink-300 focus:border-lagoon-800 focus:outline-none";
const label = "block text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500";

const TABS: { key: ContentKey; label: string }[] = [
  { key: "gallery", label: "Gallery" },
  { key: "amenities", label: "Amenities" },
  { key: "house_rules", label: "House rules" },
  { key: "reviews", label: "Reviews" },
];

export function ContentEditor({ content }: { content: EditableContent }) {
  const [tab, setTab] = useState<ContentKey>("gallery");

  const [gallery, setGallery] = useState<GalleryItem[]>(content.gallery);
  const [amenities, setAmenities] = useState<AmenityItem[]>(content.amenities);
  const [rules, setRules] = useState<string[]>(content.houseRules);
  const [reviews, setReviews] = useState<ReviewItem[]>(content.reviews);

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {TABS.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => setTab(entry.key)}
            className={`rounded-sm border px-4 py-2 text-[0.6875rem] uppercase tracking-[0.15em] transition-colors duration-300 ease-calm ${
              tab === entry.key
                ? "border-ink-900 bg-ink-900 text-shell"
                : "border-stone bg-sand text-ink-500 hover:border-ink-900 hover:text-ink-900"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === "gallery" && (
        <Section
          contentKey="gallery"
          value={gallery}
          onReset={() => setGallery(content.gallery)}
          blurb="Photos on the landing page. Alt text is read aloud by screen readers and shown if an image fails to load, so describe what is actually in the picture."
        >
          <GalleryEditor items={gallery} onChange={setGallery} />
        </Section>
      )}

      {tab === "amenities" && (
        <Section
          contentKey="amenities"
          value={amenities}
          onReset={() => setAmenities(content.amenities)}
          blurb="The highlighted grid, not the full list behind 'Show all amenities'. Keep the detail line short and specific."
        >
          <AmenitiesEditor items={amenities} onChange={setAmenities} />
        </Section>
      )}

      {tab === "house_rules" && (
        <Section
          contentKey="house_rules"
          value={rules}
          onReset={() => setRules(content.houseRules)}
          blurb="Shown in full before the enquiry form. These are also the rules quoted in the confirmation email guests get."
        >
          <RulesEditor items={rules} onChange={setRules} />
        </Section>
      )}

      {tab === "reviews" && (
        <Section
          contentKey="reviews"
          value={reviews}
          onReset={() => setReviews(content.reviews)}
          blurb="Real guest words only. The score above these cards is set in the code, not here."
        >
          <ReviewsEditor items={reviews} onChange={setReviews} />
        </Section>
      )}
    </div>
  );
}

function Section({
  contentKey,
  value,
  blurb,
  onReset,
  children,
}: {
  contentKey: ContentKey;
  value: unknown[];
  blurb: string;
  onReset: () => void;
  children: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const [problem, setProblem] = useState("");
  const [saved, setSaved] = useState(false);

  return (
    <div>
      <p className="max-w-prose text-[0.875rem] leading-[1.7] text-ink-500">{blurb}</p>

      {problem && (
        <p className="mt-5 rounded-sm border border-teak-600 bg-sand px-4 py-3 text-[0.875rem] text-teak-600">
          {problem}
        </p>
      )}

      <div className="mt-7">{children}</div>

      <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-stone pt-7">
        <Button
          type="button"
          disabled={pending}
          className="py-3"
          onClick={() => {
            setProblem("");
            setSaved(false);
            startTransition(async () => {
              const result = await saveContentBlock(contentKey, value);
              if (result.ok) setSaved(true);
              else setProblem(result.error);
            });
          }}
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />}
          Publish changes
        </Button>

        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm("Put this section back to how the site shipped? Your edits are lost.")) {
              setSaved(false);
              startTransition(async () => {
                const result = await resetContentBlock(contentKey);
                if (result.ok) onReset();
                else setProblem(result.error);
              });
            }
          }}
          className="flex items-center gap-2 text-[0.8125rem] text-ink-500 underline decoration-stone underline-offset-4 hover:text-ink-900"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
          Reset to default
        </button>

        {saved && !pending && (
          <span className="flex items-center gap-2 text-[0.8125rem] text-lagoon-800">
            <Check className="h-4 w-4" strokeWidth={1.5} />
            Live on the site
          </span>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
 *  Shared row controls
 * ------------------------------------------------------------------------ */
function RowTools<T>({
  items,
  index,
  onChange,
  labelFor,
}: {
  items: T[];
  index: number;
  onChange: (next: T[]) => void;
  labelFor: string;
}) {
  function move(delta: number) {
    const next = [...items];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        aria-label={`Move ${labelFor} up`}
        disabled={index === 0}
        onClick={() => move(-1)}
        className="rounded-sm p-2 text-ink-300 hover:text-ink-900 disabled:opacity-30 disabled:hover:text-ink-300"
      >
        <ArrowUp className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        aria-label={`Move ${labelFor} down`}
        disabled={index === items.length - 1}
        onClick={() => move(1)}
        className="rounded-sm p-2 text-ink-300 hover:text-ink-900 disabled:opacity-30 disabled:hover:text-ink-300"
      >
        <ArrowDown className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        aria-label={`Remove ${labelFor}`}
        onClick={() => onChange(items.filter((_, i) => i !== index))}
        className="rounded-sm p-2 text-ink-300 hover:text-teak-600"
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
    </div>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-5 flex items-center gap-2 rounded-sm border border-stone bg-sand px-5 py-3 text-[0.6875rem] uppercase tracking-[0.15em] text-ink-500 transition-colors duration-300 ease-calm hover:border-ink-900 hover:text-ink-900"
    >
      <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
      {children}
    </button>
  );
}

/* --------------------------------------------------------------------------
 *  Gallery
 * ------------------------------------------------------------------------ */
function GalleryEditor({
  items,
  onChange,
}: {
  items: GalleryItem[];
  onChange: (next: GalleryItem[]) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError("");
    const supabase = createClient();
    const added: GalleryItem[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setUploadError("Only image files can go in the gallery.");
        continue;
      }

      // Collisions would silently overwrite someone else's photo, so the name
      // carries a timestamp rather than trusting whatever the phone called it.
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

      const { error } = await supabase.storage
        .from("gallery")
        .upload(path, file, { cacheControl: "31536000", upsert: false });

      if (error) {
        setUploadError(
          "That upload failed. If it keeps happening, the gallery storage bucket may not be set up yet.",
        );
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("gallery").getPublicUrl(path);

      added.push({ src: publicUrl, alt: "", ratio: "3/4" });
    }

    if (added.length > 0) onChange([...items, ...added]);
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <div>
      {uploadError && (
        <p className="mb-5 rounded-sm border border-teak-600 bg-sand px-4 py-3 text-[0.875rem] text-teak-600">
          {uploadError}
        </p>
      )}

      <ul className="space-y-3">
        {items.map((item, index) => (
          <li
            key={`${item.src}-${index}`}
            className="flex flex-wrap items-start gap-4 rounded-md border border-stone bg-sand p-4 sm:flex-nowrap"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm border border-stone bg-shell">
              {/* Unoptimised: these come from Supabase Storage at runtime, so
                  they are not in next.config's image domains and never will be
                  for a URL the owner uploads five minutes from now. */}
              {item.src && (
                <Image
                  src={item.src}
                  alt=""
                  fill
                  unoptimized
                  sizes="80px"
                  className="object-cover"
                />
              )}
            </div>

            <div className="min-w-[12rem] flex-1 space-y-3">
              <input
                value={item.alt}
                placeholder="Describe what is in the photo"
                onChange={(e) => {
                  const next = [...items];
                  next[index] = { ...item, alt: e.target.value };
                  onChange(next);
                }}
                className={field}
              />

              <div className="flex items-center gap-2">
                {(["3/4", "16/9"] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => {
                      const next = [...items];
                      next[index] = { ...item, ratio };
                      onChange(next);
                    }}
                    className={`rounded-sm border px-3 py-1.5 text-[0.625rem] uppercase tracking-[0.15em] transition-colors duration-300 ease-calm ${
                      item.ratio === ratio
                        ? "border-ink-900 bg-ink-900 text-shell"
                        : "border-stone text-ink-500 hover:border-ink-900"
                    }`}
                  >
                    {ratio === "3/4" ? "Portrait" : "Landscape"}
                  </button>
                ))}
              </div>
            </div>

            <RowTools items={items} index={index} onChange={onChange} labelFor="photo" />
          </li>
        ))}
      </ul>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => void upload(e.target.files)}
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInput.current?.click()}
        className="mt-5 flex items-center gap-2 rounded-sm border border-stone bg-sand px-5 py-3 text-[0.6875rem] uppercase tracking-[0.15em] text-ink-500 transition-colors duration-300 ease-calm hover:border-ink-900 hover:text-ink-900 disabled:opacity-50"
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
        ) : (
          <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
        )}
        {uploading ? "Uploading" : "Add photos"}
      </button>
    </div>
  );
}

/* --------------------------------------------------------------------------
 *  Amenities
 * ------------------------------------------------------------------------ */
function AmenitiesEditor({
  items,
  onChange,
}: {
  items: AmenityItem[];
  onChange: (next: AmenityItem[]) => void;
}) {
  function update(index: number, patch: Partial<AmenityItem>) {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  return (
    <div>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex flex-wrap items-start gap-4 rounded-md border border-stone bg-sand p-4 sm:flex-nowrap"
          >
            <div className="min-w-[12rem] flex-1 grid gap-3 sm:grid-cols-[8rem_1fr]">
              <select
                value={item.icon}
                onChange={(e) => update(index, { icon: e.target.value })}
                aria-label="Icon"
                className={field}
              >
                {!AMENITY_ICONS.includes(item.icon as (typeof AMENITY_ICONS)[number]) && (
                  <option value={item.icon}>{item.icon || "none"}</option>
                )}
                {AMENITY_ICONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>

              <input
                value={item.title}
                placeholder="Private pool"
                onChange={(e) => update(index, { title: e.target.value })}
                className={field}
              />

              <input
                value={item.detail}
                placeholder="1.2m deep, lit until midnight"
                onChange={(e) => update(index, { detail: e.target.value })}
                className={`${field} sm:col-span-2`}
              />
            </div>

            <RowTools items={items} index={index} onChange={onChange} labelFor="amenity" />
          </li>
        ))}
      </ul>

      <AddButton onClick={() => onChange([...items, { icon: "waves", title: "", detail: "" }])}>
        Add an amenity
      </AddButton>
    </div>
  );
}

/* --------------------------------------------------------------------------
 *  House rules
 * ------------------------------------------------------------------------ */
function RulesEditor({
  items,
  onChange,
}: {
  items: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div>
      <ul className="space-y-3">
        {items.map((rule, index) => (
          <li
            key={index}
            className="flex items-start gap-4 rounded-md border border-stone bg-sand p-4"
          >
            <span className="mt-3 w-5 shrink-0 text-right text-[0.8125rem] tabular-nums text-ink-300">
              {index + 1}
            </span>

            <textarea
              value={rule}
              rows={2}
              onChange={(e) => {
                const next = [...items];
                next[index] = e.target.value;
                onChange(next);
              }}
              className={`${field} resize-y`}
            />

            <RowTools items={items} index={index} onChange={onChange} labelFor="rule" />
          </li>
        ))}
      </ul>

      <AddButton onClick={() => onChange([...items, ""])}>Add a rule</AddButton>
    </div>
  );
}

/* --------------------------------------------------------------------------
 *  Reviews
 * ------------------------------------------------------------------------ */
function ReviewsEditor({
  items,
  onChange,
}: {
  items: ReviewItem[];
  onChange: (next: ReviewItem[]) => void;
}) {
  function update(index: number, patch: Partial<ReviewItem>) {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  return (
    <div>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex flex-wrap items-start gap-4 rounded-md border border-stone bg-sand p-4 sm:flex-nowrap"
          >
            <div className="min-w-[14rem] flex-1 space-y-3">
              <textarea
                value={item.quote}
                rows={3}
                placeholder="What the guest actually wrote"
                onChange={(e) => update(index, { quote: e.target.value })}
                className={`${field} resize-y`}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={item.name}
                  placeholder="Dawn Grace"
                  onChange={(e) => update(index, { name: e.target.value })}
                  className={field}
                />
                <input
                  value={item.detail}
                  placeholder="Facebook review"
                  onChange={(e) => update(index, { detail: e.target.value })}
                  className={field}
                />
              </div>

              <div>
                <label className={label} htmlFor={`review-image-${index}`}>
                  Photo path
                </label>
                <input
                  id={`review-image-${index}`}
                  value={item.image}
                  placeholder="/images/review-01.jpg"
                  onChange={(e) => update(index, { image: e.target.value })}
                  className={`${field} mt-2.5`}
                />
              </div>
            </div>

            <RowTools items={items} index={index} onChange={onChange} labelFor="review" />
          </li>
        ))}
      </ul>

      <AddButton
        onClick={() => onChange([...items, { image: "", quote: "", name: "", detail: "" }])}
      >
        Add a review
      </AddButton>
    </div>
  );
}
