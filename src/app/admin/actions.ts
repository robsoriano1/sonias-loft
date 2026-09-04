"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { InquiryStatus } from "@/lib/types";

/* Every action re-checks the session. The middleware already guards the
   routes, but actions are their own endpoints - guard them too. */
async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return supabase;
}

export async function setInquiryStatus(id: string, status: InquiryStatus) {
  const supabase = await requireUser();
  await supabase.from("inquiries").update({ status }).eq("id", id);
  revalidatePath("/admin");
}

export async function deleteInquiry(id: string) {
  const supabase = await requireUser();
  await supabase.from("inquiries").delete().eq("id", id);
  revalidatePath("/admin");
}

/** Toggle one day between blocked and available. */
export async function toggleBlockedDate(day: string, currentlyBlocked: boolean) {
  const supabase = await requireUser();

  if (currentlyBlocked) {
    await supabase.from("blocked_dates").delete().eq("day", day);
  } else {
    await supabase.from("blocked_dates").upsert({ day }, { onConflict: "day" });
  }

  revalidatePath("/admin");
  revalidatePath("/");
}

/** Block or clear a whole range at once - used by the "Block range" control. */
export async function setBlockedRange(days: string[], blocked: boolean) {
  if (days.length === 0) return;
  const supabase = await requireUser();

  if (blocked) {
    await supabase.from("blocked_dates").upsert(
      days.map((day) => ({ day })),
      { onConflict: "day" },
    );
  } else {
    await supabase.from("blocked_dates").delete().in("day", days);
  }

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
