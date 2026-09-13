import { loadAdminData } from "@/lib/admin-data";
import { CalendarBoard } from "@/components/admin/CalendarBoard";
import { HoldList } from "@/components/admin/HoldList";
import { IcalPanel } from "@/components/admin/IcalPanel";

export const revalidate = 0;

export default async function CalendarPage() {
  const { holds, blockedDays, inquiries, settings, rateRules, error } = await loadAdminData();

  // Guest contact details, so a stay can link back to whoever asked for it.
  const inquiryIndex = Object.fromEntries(
    inquiries.map((i) => [i.id, { name: i.name, email: i.email, phone: i.phone }]),
  );

  return (
    <div>
      <h1 className="font-display text-[2.5rem] font-light leading-[1.08] text-ink-900">
        The calendar
      </h1>
      <p className="mt-4 max-w-prose text-[0.9375rem] leading-[1.7] text-ink-500">
        Confirmed stays show on the public site straight away. Tentative holds stay private, so an
        enquiry in progress never scares off a second guest before it firms up.
      </p>

      {error && (
        <p className="mt-8 rounded-sm border border-teak-600 bg-sand px-5 py-4 text-[0.875rem] leading-[1.65] text-teak-600">
          {error}
        </p>
      )}

      <section className="mt-10">
        <CalendarBoard holds={holds} blocked={blockedDays} />
      </section>

      <section className="mt-16">
        <p className="eyebrow">Stays</p>
        <h2 className="mt-4 font-display text-[1.875rem] font-light text-ink-900">
          Who is booked in
        </h2>

        <div className="mt-8">
          <HoldList
            holds={holds}
            blocked={blockedDays}
            settings={settings}
            rateRules={rateRules}
            inquiryIndex={inquiryIndex}
          />
        </div>
      </section>

      <section className="mt-16">
        <IcalPanel />
      </section>
    </div>
  );
}
