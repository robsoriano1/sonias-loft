import { siteUrl } from "@/lib/site-url";
import { importIcalFeed } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";

/* Server component: the feed token is an env secret, and this is only ever
   rendered behind the owner's session. */
export function IcalPanel() {
  const token = process.env.ICAL_TOKEN;
  const base = siteUrl();
  const feedUrl = token ? `${base}/api/calendar/${token}` : null;

  return (
    <div className="rounded-md border border-stone bg-sand p-6 md:p-7">
      <p className="eyebrow">Syncing</p>
      <h2 className="mt-4 font-display text-[1.875rem] font-light text-ink-900">
        Keep other listings in step
      </h2>

      <p className="mt-4 max-w-prose text-[0.9375rem] leading-[1.7] text-ink-500">
        If the loft is ever listed on Airbnb or anywhere else, point that listing at this feed so it
        stops selling nights that are already taken here.
      </p>

      {feedUrl ? (
        <div className="mt-6">
          <label
            className="block text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500"
            htmlFor="ical-url"
          >
            Your private feed address
          </label>
          <input
            id="ical-url"
            readOnly
            defaultValue={feedUrl}
            className="mt-3 w-full rounded-sm border border-stone bg-shell px-3.5 py-2.5 font-mono text-[0.8125rem] text-ink-700 focus:border-lagoon-800 focus:outline-none"
          />
          <p className="mt-3 text-[0.78125rem] leading-[1.6] text-ink-300">
            Treat this like a password - anyone with the link can see when the loft is booked.
            Confirmed stays and hand-blocked days go out; tentative holds never do.
          </p>
        </div>
      ) : (
        <p className="mt-6 rounded-sm border border-stone px-4 py-3 text-[0.8125rem] leading-[1.6] text-ink-500">
          Sharing is switched off. Set <code className="text-brass-600">ICAL_TOKEN</code> in Vercel
          to a long random string and the feed address will appear here.
        </p>
      )}

      {/* Import */}
      <form action={importIcalFeed} className="mt-9 border-t border-stone pt-7">
        <label
          className="block text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500"
          htmlFor="ical-import"
        >
          Pull in another calendar
        </label>
        <p className="mt-3 max-w-prose text-[0.8125rem] leading-[1.6] text-ink-500">
          Paste the iCal link from Airbnb or wherever else the loft is listed. Anything booked there
          is brought in as a confirmed stay so it cannot be double-sold here.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <input
            id="ical-import"
            name="url"
            type="url"
            required
            placeholder="https://www.airbnb.com/calendar/ical/....ics"
            className="min-w-[16rem] flex-1 rounded-sm border border-stone bg-sand px-3.5 py-2.5 text-[0.9375rem] text-ink-900 placeholder:text-ink-300 focus:border-lagoon-800 focus:outline-none"
          />
          <Button type="submit" variant="secondary" className="py-3">
            Import now
          </Button>
        </div>
      </form>
    </div>
  );
}
