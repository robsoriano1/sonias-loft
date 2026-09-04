import { createClient } from "@/lib/supabase/server";
import { SUPABASE_CONFIGURED } from "@/lib/supabase/config";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { TheLoft } from "@/components/site/TheLoft";
import { Gallery } from "@/components/site/Gallery";
import { Pool } from "@/components/site/Pool";
import { Amenities } from "@/components/site/Amenities";
import { HouseRules } from "@/components/site/HouseRules";
import { Reviews } from "@/components/site/Reviews";
import { Availability } from "@/components/site/Availability";
import { InquiryForm } from "@/components/site/InquiryForm";
import { Footer } from "@/components/site/Footer";

// Blocked dates change whenever the owner toggles one, so don't cache the page.
export const revalidate = 0;

async function getBlockedDates(): Promise<string[]> {
  if (!SUPABASE_CONFIGURED) return [];
  try {
    const { data } = await createClient().from("blocked_dates").select("day");
    return (data ?? []).map((row: { day: string }) => row.day);
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
        <HouseRules />
        <Reviews />
        <Availability blocked={blocked} />
        <InquiryForm />
      </main>
      <Footer />
    </>
  );
}
