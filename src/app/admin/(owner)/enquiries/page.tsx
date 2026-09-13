import { loadAdminData } from "@/lib/admin-data";
import { repeatGuestKeys } from "@/lib/pipeline";
import { site } from "@/lib/content";
import { InquiryList } from "@/components/admin/InquiryList";

export const revalidate = 0;

export default async function EnquiriesPage() {
  const { inquiries, holds, error } = await loadAdminData();

  // Computed once on the server so the list and every badge agree on "now".
  const now = new Date().toISOString();
  const repeats = Array.from(repeatGuestKeys(inquiries));
  const heldInquiryIds = holds
    .filter((h) => h.status !== "released" && h.inquiry_id)
    .map((h) => h.inquiry_id as string);

  return (
    <div>
      <h1 className="font-display text-[2.5rem] font-light leading-[1.08] text-ink-900">
        Who has written in
      </h1>
      <p className="mt-4 max-w-prose text-[0.9375rem] leading-[1.7] text-ink-500">
        Longest waiting first. Move an enquiry along as you deal with it, and the response clock
        stops the first time you reply.
      </p>

      {error && (
        <p className="mt-8 rounded-sm border border-teak-600 bg-sand px-5 py-4 text-[0.875rem] leading-[1.65] text-teak-600">
          {error}
        </p>
      )}

      <div className="mt-10">
        <InquiryList
          inquiries={inquiries}
          now={now}
          repeatKeys={repeats}
          heldInquiryIds={heldInquiryIds}
          propertyName={site.name}
        />
      </div>
    </div>
  );
}
