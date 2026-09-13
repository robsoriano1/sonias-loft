"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import type { Profile, Role } from "@/lib/types";
import { setDisplayName, setUserRole } from "@/app/admin/actions";

/* Who can sign in, and what they get to see. Accounts themselves are created
   in the Supabase dashboard - this is only about what an existing account is
   allowed to do, which is the part that should not require a developer. */
export function PeoplePanel({
  people,
  currentUserId,
}: {
  people: (Profile & { email?: string | null })[];
  currentUserId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [problem, setProblem] = useState("");
  const [saved, setSaved] = useState("");

  function run(id: string, action: () => Promise<{ ok: boolean; error?: string }>) {
    setProblem("");
    setSaved("");
    startTransition(async () => {
      const result = await action();
      if (!result.ok && result.error) setProblem(result.error);
      else setSaved(id);
    });
  }

  return (
    <div className="rounded-md border border-stone bg-sand">
      {problem && (
        <p className="border-b border-stone px-6 py-4 text-[0.875rem] text-teak-600">{problem}</p>
      )}

      {people.length === 0 ? (
        <p className="px-6 py-8 text-[0.9375rem] leading-[1.7] text-ink-500">
          Nobody is listed yet. If this looks wrong, migration 002 may not have been run against the
          database.
        </p>
      ) : (
        <ul>
          {people.map((person) => {
            const isYou = person.id === currentUserId;

            return (
              <li
                key={person.id}
                className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-b border-stone px-6 py-5 last:border-b-0"
              >
                <div className="min-w-[12rem] flex-1">
                  <input
                    defaultValue={person.display_name ?? ""}
                    placeholder="Add a name"
                    disabled={pending}
                    onBlur={(e) => {
                      if (e.target.value.trim() !== (person.display_name ?? "")) {
                        run(person.id, () => setDisplayName(person.id, e.target.value));
                      }
                    }}
                    className="w-full border-0 bg-transparent p-0 text-[1rem] text-ink-900 placeholder:text-ink-300 focus:outline-none"
                  />
                  <p className="mt-1 text-[0.78125rem] text-ink-300">
                    {person.email ?? person.id.slice(0, 8)}
                    {isYou && " · you"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {saved === person.id && !pending && (
                    <Check className="h-4 w-4 text-lagoon-800" strokeWidth={1.5} />
                  )}

                  {(["staff", "owner"] as Role[]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      disabled={pending || person.role === role || (isYou && role === "staff")}
                      title={
                        isYou && role === "staff"
                          ? "You cannot step yourself down"
                          : `Make this person ${role === "owner" ? "an owner" : "staff"}`
                      }
                      onClick={() => run(person.id, () => setUserRole(person.id, role))}
                      className={[
                        "rounded-sm border px-4 py-2 text-[0.6875rem] uppercase tracking-[0.15em] transition-colors duration-300 ease-calm",
                        person.role === role
                          ? "border-ink-900 bg-ink-900 text-shell"
                          : "border-stone text-ink-500 hover:border-ink-900 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-40",
                      ].join(" ")}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="border-t border-stone px-6 py-5 text-[0.78125rem] leading-[1.7] text-ink-300">
        Owners see everything. Staff only ever see the turnover checklist - no guest contact
        details, no money, no settings. New accounts start as staff. Add one in Supabase under
        Authentication &rarr; Users, and tick &ldquo;Auto Confirm User&rdquo;.
      </p>
    </div>
  );
}
