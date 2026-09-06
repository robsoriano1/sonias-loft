"use client";

import { useState, type ReactNode } from "react";
import { MessageCircle, X } from "lucide-react";
import { quickContact } from "@/lib/content";

/* Official brand glyphs (via Simple Icons), inlined so the floating button
   doesn't depend on an extra icon package for three logos. */
const WHATSAPP_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413";
const VIBER_PATH =
  "M11.4 0C9.473.028 5.333.344 3.02 2.467 1.302 4.187.696 6.7.633 9.817.57 12.933.488 18.776 6.12 20.36h.003l-.004 2.416s-.037.977.61 1.177c.777.242 1.234-.5 1.98-1.302.407-.44.972-1.084 1.397-1.58 3.85.326 6.812-.416 7.15-.525.776-.252 5.176-.816 5.892-6.657.74-6.02-.36-9.83-2.34-11.546-.596-.55-3.006-2.3-8.375-2.323 0 0-.395-.025-1.037-.017zm.058 1.693c.545-.004.88.017.88.017 4.542.02 6.717 1.388 7.222 1.846 1.675 1.435 2.53 4.868 1.906 9.897v.002c-.604 4.878-4.174 5.184-4.832 5.395-.28.09-2.882.737-6.153.524 0 0-2.436 2.94-3.197 3.704-.12.12-.26.167-.352.144-.13-.033-.166-.188-.165-.414l.02-4.018c-4.762-1.32-4.485-6.292-4.43-8.895.054-2.604.543-4.738 1.996-6.173 1.96-1.773 5.474-2.018 7.11-2.03zm.38 2.602c-.167 0-.303.135-.304.302 0 .167.133.303.3.305 1.624.01 2.946.537 4.028 1.592 1.073 1.046 1.62 2.468 1.633 4.334.002.167.14.3.307.3.166-.002.3-.138.3-.304-.014-1.984-.618-3.596-1.816-4.764-1.19-1.16-2.692-1.753-4.447-1.765zm-3.96.695c-.19-.032-.4.005-.616.117l-.01.002c-.43.247-.816.562-1.146.932-.002.004-.006.004-.008.008-.267.323-.42.638-.46.948-.008.046-.01.093-.007.14 0 .136.022.27.065.4l.013.01c.135.48.473 1.276 1.205 2.604.42.768.903 1.5 1.446 2.186.27.344.56.673.87.984l.132.132c.31.308.64.6.984.87.686.543 1.418 1.027 2.186 1.447 1.328.733 2.126 1.07 2.604 1.206l.01.014c.13.042.265.064.402.063.046.002.092 0 .138-.008.31-.036.627-.19.948-.46.004 0 .003-.002.008-.005.37-.33.683-.72.93-1.148l.003-.01c.225-.432.15-.842-.18-1.12-.004 0-.698-.58-1.037-.83-.36-.255-.73-.492-1.113-.71-.51-.285-1.032-.106-1.248.174l-.447.564c-.23.283-.657.246-.657.246-3.12-.796-3.955-3.955-3.955-3.955s-.037-.426.248-.656l.563-.448c.277-.215.456-.737.17-1.248-.217-.383-.454-.756-.71-1.115-.25-.34-.826-1.033-.83-1.035-.137-.165-.31-.265-.502-.297zm4.49.88c-.158.002-.29.124-.3.282-.01.167.115.312.282.324 1.16.085 2.017.466 2.645 1.15.63.688.93 1.524.906 2.57-.002.168.13.306.3.31.166.003.305-.13.31-.297.025-1.175-.334-2.193-1.067-2.994-.74-.81-1.777-1.253-3.05-1.346h-.024zm.463 1.63c-.16.002-.29.127-.3.287-.008.167.12.31.288.32.523.028.875.175 1.113.422.24.245.388.62.416 1.164.01.167.15.295.318.287.167-.008.295-.15.287-.317-.03-.644-.215-1.178-.58-1.557-.367-.378-.893-.574-1.52-.607h-.018z";
const MESSENGER_PATH =
  "M12 0C5.24 0 0 4.952 0 11.64c0 3.499 1.434 6.521 3.769 8.61a.96.96 0 0 1 .323.683l.065 2.135a.96.96 0 0 0 1.347.85l2.381-1.053a.96.96 0 0 1 .641-.046A13 13 0 0 0 12 23.28c6.76 0 12-4.952 12-11.64S18.76 0 12 0m6.806 7.44c.522-.03.971.567.63 1.094l-4.178 6.457a.707.707 0 0 1-.977.208l-3.87-2.504a.44.44 0 0 0-.49.007l-4.363 3.01c-.637.438-1.415-.317-.995-.966l4.179-6.457a.706.706 0 0 1 .977-.21l3.87 2.505c.15.097.344.094.491-.007l4.362-3.008a.7.7 0 0 1 .364-.13";

function BrandIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

type Channel = {
  key: string;
  label: string;
  href: string;
  background: string;
  icon: ReactNode;
};

/* ============================================================================
 *  FLOATING CONTACT
 *  A bottom-right dial that opens onto WhatsApp / Viber / Messenger - the
 *  channels Antipolo guests actually expect, alongside the enquiry form.
 *  Brand colours here on purpose: recognisability matters more than the
 *  site palette for a button whose whole job is "tap the one you already use."
 * ========================================================================== */
export function FloatingContact() {
  const [open, setOpen] = useState(false);

  const message = encodeURIComponent(quickContact.prefilledMessage);
  const channels: Channel[] = [];

  if (quickContact.whatsappNumber) {
    channels.push({
      key: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/${quickContact.whatsappNumber}?text=${message}`,
      background: "bg-[#25D366] hover:bg-[#1FBF5C]",
      icon: <BrandIcon path={WHATSAPP_PATH} />,
    });
  }
  if (quickContact.viberNumber) {
    channels.push({
      key: "viber",
      label: "Viber",
      // Opens the Viber app directly; there is no reliable universal web
      // fallback for a cold-start 1:1 chat without a linked invite code.
      href: `viber://chat?number=${encodeURIComponent(quickContact.viberNumber)}`,
      background: "bg-[#7360F2] hover:bg-[#5F4FE0]",
      icon: <BrandIcon path={VIBER_PATH} />,
    });
  }
  if (quickContact.messengerUsername) {
    channels.push({
      key: "messenger",
      label: "Messenger",
      href: `https://m.me/${quickContact.messengerUsername}`,
      background: "bg-[#00B2FF] hover:bg-[#0090D1]",
      icon: <BrandIcon path={MESSENGER_PATH} />,
    });
  }

  if (channels.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {open && (
        <ul className="flex flex-col items-end gap-3">
          {channels.map((channel, i) => (
            <li
              key={channel.key}
              className="flex animate-fade-up items-center gap-3"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="rounded-sm bg-ink-900 px-3 py-1.5 text-[0.75rem] font-medium text-shell shadow-soft">
                {channel.label}
              </span>
              <a
                href={channel.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`Message us on ${channel.label}`}
                className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lift transition-colors duration-300 ease-calm ${channel.background}`}
              >
                {channel.icon}
              </a>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close quick contact menu" : "Message us"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-900 text-shell shadow-lift transition-transform duration-300 ease-calm hover:scale-105 hover:bg-lagoon-800"
      >
        {open ? (
          <X className="h-6 w-6" strokeWidth={1.5} />
        ) : (
          <MessageCircle className="h-6 w-6" strokeWidth={1.5} />
        )}
      </button>
    </div>
  );
}
