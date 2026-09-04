/* Shared env plumbing.

   The placeholder fallbacks let you run `npm run build` before you have
   filled in .env.local - the site renders, the calendar is simply empty and
   the form reports that it cannot reach the database. Fill in .env.local
   (copy .env.local.example) and everything wires itself up.

   Supabase renamed the browser-safe key: older projects call it the
   "anon" key, newer ones the "publishable" key (sb_publishable_...).
   Either variable name works. */

const KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";

export const SUPABASE_ANON_KEY = KEY ?? "placeholder-anon-key";

export const SUPABASE_CONFIGURED =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(KEY);
