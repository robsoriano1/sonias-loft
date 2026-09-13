"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TurnoverTaskKey } from "@/lib/types";
import { TURNOVER_TASKS } from "@/lib/types";

/* Staff actions. Anyone signed in may run these - that is deliberate, owners
   included - but they can only ever touch turnovers. Everything financial or
   guest-identifying is unreachable from here and from row-level security. */
async function requireSignedIn() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return { supabase, user };
}

const TASK_KEYS = TURNOVER_TASKS.map((task) => task.key) as readonly string[];

export type StaffResult = { ok: true } | { ok: false; error: string };

export async function toggleTurnoverTask(
  id: string,
  task: TurnoverTaskKey,
  done: boolean,
): Promise<StaffResult> {
  if (!TASK_KEYS.includes(task)) return { ok: false, error: "Unknown task." };

  const { supabase, user } = await requireSignedIn();

  const { data: existing } = await supabase
    .from("turnovers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return { ok: false, error: "That turnover no longer exists." };

  const next = { ...(existing as Record<string, unknown>), [task]: done };
  const allDone = TURNOVER_TASKS.every((t) => Boolean(next[t.key]));

  const { error } = await supabase
    .from("turnovers")
    .update({
      [task]: done,
      // Stamped when the last box is ticked, cleared if one is un-ticked, so
      // "finished" always means what it says.
      completed_at: allDone ? new Date().toISOString() : null,
      completed_by: allDone ? user.id : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, error: "Could not save that. Try again." };

  revalidatePath("/staff");
  revalidatePath("/admin");
  return { ok: true };
}

export async function saveTurnoverReport(form: FormData): Promise<void> {
  const { supabase } = await requireSignedIn();

  const id = String(form.get("id") ?? "");
  if (!id) return;

  await supabase
    .from("turnovers")
    .update({
      notes: String(form.get("notes") ?? "").trim() || null,
      damage_found: form.get("damage_found") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/staff");
  revalidatePath("/admin");
}

export async function staffSignOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
