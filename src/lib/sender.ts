/* Sender-address validation, kept apart from ./notify so it can be tested
   without dragging in `server-only` and the Resend SDK. Pure and takes the
   value as an argument rather than reading the environment itself. */

/* Resend wants either "someone@domain.com" or "Name <someone@domain.com>".
   Anything else is refused at the API with a message about the from field,
   which is a long way round to discover a stray bracket in an env var. */
const BARE_EMAIL = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
/* Padding inside the brackets is allowed and trimmed off. A copy-paste often
   carries it, it is unambiguous, and rejecting it would report a valid-looking
   address as invalid - which sends someone hunting for a problem elsewhere. */
const NAMED_EMAIL = /^[^<>]+<\s*[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+\s*>$/;

/** Null when the sender is well-formed, otherwise a sentence saying what is
    wrong with it, quoting the value so it can be compared to the variable. */
export function validateSender(value: string): string | null {
  const trimmed = value.trim();
  if (BARE_EMAIL.test(trimmed) || NAMED_EMAIL.test(trimmed)) return null;

  const brackets = (trimmed.match(/</g) ?? []).length;
  if (brackets > 1) {
    return `NOTIFY_FROM has ${brackets} "<" characters but should have one: Name <someone@domain.com>. It is currently ${trimmed}`;
  }

  return `NOTIFY_FROM is not a valid sender. Use someone@domain.com or Name <someone@domain.com>. It is currently ${trimmed}`;
}

export type ParsedSender = { name: string | null; email: string };

/* Resend takes the whole "Name <email>" string; SendGrid wants the two parts
   separately. Splitting it here keeps that difference out of the transports. */
export function parseSender(value: string): ParsedSender | null {
  const trimmed = value.trim();
  if (validateSender(trimmed)) return null;

  const angled = trimmed.match(/^(.*)<([^<>]+)>$/);
  if (!angled) return { name: null, email: trimmed };

  const name = angled[1].trim().replace(/^"(.*)"$/, "$1").trim();
  return { name: name || null, email: angled[2].trim() };
}
