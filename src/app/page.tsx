import { createClient } from "@/lib/supabase/server";
import { SUPABASE_CONFIGURED } from "@/lib/supabase/config";
import { publicBlockedDays } from "@/lib/availability";
import type { Hold } from "@/lib/types";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { TheLoft } from "@/components/site/TheLoft";
import { Gallery } from "@/components/site/Gallery";
import { Pool } from "@/components/site/Pool";
import { Amenities } from "@/components/site/Amenities";
import { Location } from "@/components/site/Location";
import { HouseRules } from "@/components/site/HouseRules";
import { Reviews } from "@/components/site/Reviews";
import { Availability } from "@/components/site/Availability";
import { InquiryForm } from "@/components/site/InquiryForm";
import { Footer } from "@/components/site/Footer";
import { FloatingContact } from "@/components/site/FloatingContact";

// Blocked dates change whenever the owner toggles one, so don't cache the page.
export const revalidate = 0;

/* Two things make a night unavailable to a visitor: a confirmed stay, and a
   day the owner blocked by hand. Tentative holds are deliberately left out -
   an enquiry that has not firmed up must not scare off a guest who would
   have booked. Row-level security enforces the same split, so this only ever
   receives confirmed holds anyway. */
async function getBlockedDates(): Promise<string[]> {
  if (!SUPABASE_CONFIGURED) return [];
  try {
    const supabase = createClient();

    const [blockedRes, holdRes] = await Promise.all([
      supabase.from("blocked_dates").select("day"),
      supabase.from("holds").select("*").eq("status", "confirmed"),
    ]);

    const blocked = ((blockedRes.data as { day: string }[] | null) ?? []).map((row) => row.day);
    return publicBlockedDays((holdRes.data as Hold[] | null) ?? [], blocked);
  } catch {
    // Never let a database hiccup take the landing page down.
    return [];
  }
}

export default async function HomePage() {
  const blocked = await getBlockedDates();

  return (
    <>
      <Header />
      <main>
        <Hero />
        <TheLoft />
        <Gallery />
        <Pool />
        <Amenities />
        <Location />
        <HouseRules />
        <Reviews />
        <Availability blocked={blocked} />
        <InquiryForm />
      </main>
      <Footer />
      <FloatingContact />
    </>
  );
}
