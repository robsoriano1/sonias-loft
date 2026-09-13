import { loadEditableContent } from "@/lib/admin-data";
import { requireOwner } from "@/lib/roles";
import { ContentEditor } from "@/components/admin/ContentEditor";

export const revalidate = 0;

export default async function ContentPage() {
  await requireOwner();
  const content = await loadEditableContent();

  return (
    <div>
      <h1 className="font-display text-[2.5rem] font-light leading-[1.08] text-ink-900">
        The website
      </h1>
      <p className="mt-4 max-w-prose text-[0.9375rem] leading-[1.7] text-ink-500">
        Change what guests see without anyone touching the code. Saving publishes straight away.
        Emptying a section puts it back to how the site shipped.
      </p>

      <div className="mt-10">
        <ContentEditor content={content} />
      </div>
    </div>
  );
}
