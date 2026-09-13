import { loadAdminData, loadPeople } from "@/lib/admin-data";
import { saveSettings } from "@/app/admin/actions";
import { MAIL_CONFIGURED } from "@/lib/notify";
import { requireOwner } from "@/lib/roles";
import { Button } from "@/components/ui/Button";
import { RateCard } from "@/components/admin/RateCard";
import { PeoplePanel } from "@/components/admin/PeoplePanel";

export const revalidate = 0;

const field =
  "w-full rounded-sm border border-stone bg-sand px-3.5 py-2.5 text-[0.9375rem] text-ink-900 placeholder:text-ink-300 focus:border-lagoon-800 focus:outline-none";
const label = "block text-[0.6875rem] uppercase tracking-[0.2em] text-ink-500";
const hint = "mt-2 text-[0.78125rem] leading-[1.6] text-ink-300";

export default async function SettingsPage() {
  const [user, { settings, rateRules, error }, people] = await Promise.all([
    requireOwner(),
    loadAdminData(),
    loadPeople(),
  ]);

  return (
    <div>
      <h1 className="font-display text-[2.5rem] font-light leading-[1.08] text-ink-900">
        Settings
      </h1>

      {error && (
        <p className="mt-8 rounded-sm border border-teak-600 bg-sand px-5 py-4 text-[0.875rem] leading-[1.65] text-teak-600">
          {error}
        </p>
      )}

      {!MAIL_CONFIGURED && (
        <p className="mt-8 rounded-sm border border-teak-600 bg-sand px-5 py-4 text-[0.875rem] leading-[1.65] text-teak-600">
          Email is switched off because <code>RESEND_API_KEY</code> is not set in Vercel. New
          enquiries will still be saved, but nobody will be told about them and guests will not get
          their confirmation.
        </p>
      )}

      {/* Operational rules */}
      <form action={saveSettings} className="mt-10 rounded-md border border-stone bg-sand p-6 md:p-8">
        <p className="eyebrow">House rules that the software enforces</p>

        <div className="mt-7 grid gap-6 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="weekend_min_nights">
              Weekend minimum nights
            </label>
            <input
              id="weekend_min_nights"
              name="weekend_min_nights"
              type="number"
              min={1}
              max={14}
              defaultValue={settings.weekend_min_nights}
              className={`${field} mt-3`}
            />
            <p className={hint}>
              A stay including a Friday or Saturday night cannot be confirmed below this. The public
              page says two.
            </p>
          </div>

          <div>
            <label className={label} htmlFor="turnover_buffer_nights">
              Cleaning buffer, in nights
            </label>
            <input
              id="turnover_buffer_nights"
              name="turnover_buffer_nights"
              type="number"
              min={0}
              max={7}
              defaultValue={settings.turnover_buffer_nights}
              className={`${field} mt-3`}
            />
            <p className={hint}>
              Nights to keep clear between one guest leaving and the next arriving. Zero allows
              same-day turnarounds.
            </p>
          </div>

          <div>
            <label className={label} htmlFor="checkin_window">
              Check-in window
            </label>
            <input
              id="checkin_window"
              name="checkin_window"
              defaultValue={settings.checkin_window}
              className={`${field} mt-3`}
            />
          </div>

          <div>
            <label className={label} htmlFor="checkout_window">
              Check-out window
            </label>
            <input
              id="checkout_window"
              name="checkout_window"
              defaultValue={settings.checkout_window}
              className={`${field} mt-3`}
            />
          </div>
        </div>

        <div className="mt-9 border-t border-stone pt-8">
          <p className="eyebrow">What guests are told</p>

          <div className="mt-7 grid gap-6 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="notify_email">
                Send new enquiries to
              </label>
              <input
                id="notify_email"
                name="notify_email"
                type="email"
                defaultValue={settings.notify_email ?? ""}
                placeholder="sonia@email.com"
                className={`${field} mt-3`}
              />
              <p className={hint}>Where the alert lands the moment somebody enquires.</p>
            </div>

            <div>
              <label className={label} htmlFor="gate_code">
                Gate code
              </label>
              <input
                id="gate_code"
                name="gate_code"
                defaultValue={settings.gate_code ?? ""}
                placeholder="1234"
                className={`${field} mt-3`}
              />
              <p className={hint}>
                Included in the confirmation email. Stored in the database, never in the code.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className={label} htmlFor="directions_note">
                Directions note
              </label>
              <textarea
                id="directions_note"
                name="directions_note"
                rows={3}
                defaultValue={settings.directions_note ?? ""}
                placeholder="Leave blank to use the hill and incline note from the public site."
                className={`${field} mt-3 resize-y`}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={label} htmlFor="review_url">
                Review link
              </label>
              <input
                id="review_url"
                name="review_url"
                type="url"
                defaultValue={settings.review_url ?? ""}
                placeholder="https://g.page/r/..."
                className={`${field} mt-3`}
              />
              <p className={hint}>
                Where the post-checkout nudge sends guests. Falls back to the Facebook page.
              </p>
            </div>
          </div>
        </div>

        <Button type="submit" className="mt-9 py-3.5">
          Save settings
        </Button>
      </form>

      {/* Rates */}
      <section className="mt-14">
        <p className="eyebrow">Rates</p>
        <h2 className="mt-4 font-display text-[1.875rem] font-light text-ink-900">
          What a night costs
        </h2>
        <p className="mt-3 max-w-prose text-[0.9375rem] leading-[1.7] text-ink-500">
          Friday and Saturday nights take the weekend rate. A season overrides the base rate for the
          dates it covers - if two seasons overlap, the higher priority wins.
        </p>

        <div className="mt-8">
          <RateCard rules={rateRules} />
        </div>
      </section>

      {/* People */}
      <section className="mt-14">
        <p className="eyebrow">Access</p>
        <h2 className="mt-4 font-display text-[1.875rem] font-light text-ink-900">
          Who can sign in
        </h2>

        <div className="mt-8">
          <PeoplePanel people={people} currentUserId={user.id} />
        </div>
      </section>
    </div>
  );
}
