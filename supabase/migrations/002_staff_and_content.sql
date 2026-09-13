-- ============================================================================
--  SONIA'S LOFT - phases 5 and 6
--  Run this AFTER 001_admin_rebuild.sql, in the Supabase SQL Editor.
--
--  Two jobs:
--    1. Roles. Until now "signed in" meant "the owner", so every policy said
--       `to authenticated using (true)`. The moment a second person can sign
--       in, that hands a cleaner the gate code, guest phone numbers and the
--       revenue figures. Everything below re-scopes those policies to owners
--       and gives staff a deliberately narrow surface.
--    2. Content the owner can edit without a redeploy.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. PROFILES - one row per sign-in, carrying the role
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  role         text not null default 'staff' check (role in ('owner', 'staff')),
  display_name text
);

-- Everyone who can already sign in today is an owner. Without this the
-- existing account would be demoted to staff by the default above and lock
-- itself out of its own dashboard.
insert into public.profiles (id, role, display_name)
select id, 'owner', coalesce(raw_user_meta_data ->> 'name', email)
from auth.users
on conflict (id) do nothing;

-- New accounts start as staff. The owner promotes them in Owner -> Settings.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (new.id, 'staff', coalesce(new.raw_user_meta_data ->> 'name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

/* SECURITY DEFINER on purpose: this is called from inside the policies on
   profiles itself, so it has to bypass RLS or it would recurse forever. */
create or replace function public.is_owner()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
     where id = auth.uid() and role = 'owner'
  )
$$;

revoke all on function public.is_owner() from public;
grant execute on function public.is_owner() to authenticated;

alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_owner());

drop policy if exists "owners manage profiles" on public.profiles;
create policy "owners manage profiles"
  on public.profiles for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

-- ---------------------------------------------------------------------------
-- 2. RE-SCOPE EVERYTHING THAT WAS "ANY SIGNED-IN USER"
--    Guest contact details, money, and the gate code are owner-only.
-- ---------------------------------------------------------------------------
drop policy if exists "owner can read inquiries"   on public.inquiries;
drop policy if exists "owner can update inquiries" on public.inquiries;
drop policy if exists "owner can delete inquiries" on public.inquiries;

create policy "owners read inquiries"
  on public.inquiries for select to authenticated using (public.is_owner());
create policy "owners update inquiries"
  on public.inquiries for update to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy "owners delete inquiries"
  on public.inquiries for delete to authenticated using (public.is_owner());

drop policy if exists "owner can insert blocked dates" on public.blocked_dates;
drop policy if exists "owner can delete blocked dates" on public.blocked_dates;

create policy "owners insert blocked dates"
  on public.blocked_dates for insert to authenticated with check (public.is_owner());
create policy "owners delete blocked dates"
  on public.blocked_dates for delete to authenticated using (public.is_owner());

drop policy if exists "owner can read all holds" on public.holds;
drop policy if exists "owner can write holds"    on public.holds;

create policy "owners read holds"
  on public.holds for select to authenticated using (public.is_owner());
create policy "owners write holds"
  on public.holds for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

/* The public availability calendar reads confirmed stays. That has to keep
   working for a signed-in staff member looking at the landing page too, not
   just for a logged-out visitor, so this covers both roles. Policies are
   OR'd, so an owner still reads everything through the policy above. */
drop policy if exists "anyone can read confirmed holds" on public.holds;
create policy "anyone can read confirmed holds"
  on public.holds for select to anon, authenticated using (status = 'confirmed');

drop policy if exists "owner only settings"       on public.settings;
drop policy if exists "owner only rate rules"     on public.rate_rules;
drop policy if exists "owner only guest messages" on public.guest_messages;
drop policy if exists "owner only incidents"      on public.incidents;

create policy "owners only settings"
  on public.settings for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy "owners only rate rules"
  on public.rate_rules for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy "owners only guest messages"
  on public.guest_messages for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy "owners only incidents"
  on public.incidents for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

-- ---------------------------------------------------------------------------
-- 3. TURNOVERS - the per-checkout checklist, and the whole of what staff do
-- ---------------------------------------------------------------------------
create table if not exists public.turnovers (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  hold_id        uuid not null unique references public.holds (id) on delete cascade,
  due_on         date not null,
  cleaning_done  boolean not null default false,
  restock_done   boolean not null default false,
  pool_done      boolean not null default false,
  damage_checked boolean not null default false,
  -- Staff flag that something is wrong; they never put a price on it. The
  -- owner turns a flagged turnover into a priced incident.
  damage_found   boolean not null default false,
  notes          text,
  completed_at   timestamptz,
  completed_by   uuid references auth.users (id) on delete set null
);

create index if not exists turnovers_due_idx on public.turnovers (due_on);

alter table public.turnovers enable row level security;

drop policy if exists "owners manage turnovers" on public.turnovers;
create policy "owners manage turnovers"
  on public.turnovers for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

-- Staff see the list and tick things off. They cannot create or delete one:
-- a turnover exists because a stay exists.
drop policy if exists "staff read turnovers" on public.turnovers;
create policy "staff read turnovers"
  on public.turnovers for select to authenticated using (true);

drop policy if exists "staff update turnovers" on public.turnovers;
create policy "staff update turnovers"
  on public.turnovers for update to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 4. STAFF_STAYS - the only window staff get onto a booking.
--    A view rather than a policy on holds, because the restriction that
--    matters here is which COLUMNS are visible, and RLS only does rows.
--    No rate_total, no note, no inquiry_id, so no route to guest contacts.
-- ---------------------------------------------------------------------------
create or replace view public.staff_stays
with (security_invoker = false) as
  select id, guest_name, check_in, check_out, status
    from public.holds
   where status = 'confirmed';

revoke all on public.staff_stays from anon, authenticated;
grant select on public.staff_stays to authenticated;

-- ---------------------------------------------------------------------------
-- 5. CONTENT_BLOCKS - gallery, amenities, house rules and reviews, editable
--    without a redeploy. Anything absent here falls back to src/lib/content.ts,
--    so the site renders correctly on a fresh database.
-- ---------------------------------------------------------------------------
create table if not exists public.content_blocks (
  key        text primary key check (key in ('gallery', 'amenities', 'house_rules', 'reviews')),
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.content_blocks enable row level security;

drop policy if exists "anyone reads content" on public.content_blocks;
create policy "anyone reads content"
  on public.content_blocks for select to anon, authenticated using (true);

drop policy if exists "owners write content" on public.content_blocks;
create policy "owners write content"
  on public.content_blocks for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

-- ---------------------------------------------------------------------------
-- 6. GALLERY STORAGE - so new photos do not need a redeploy either.
--    Public read (they are on the landing page), owner-only write.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

drop policy if exists "anyone reads gallery files" on storage.objects;
create policy "anyone reads gallery files"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'gallery');

drop policy if exists "owners upload gallery files" on storage.objects;
create policy "owners upload gallery files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'gallery' and public.is_owner());

drop policy if exists "owners replace gallery files" on storage.objects;
create policy "owners replace gallery files"
  on storage.objects for update to authenticated
  using (bucket_id = 'gallery' and public.is_owner());

drop policy if exists "owners delete gallery files" on storage.objects;
create policy "owners delete gallery files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'gallery' and public.is_owner());

-- ---------------------------------------------------------------------------
-- 7. Backfill a turnover for every confirmed stay already on the books, so
--    the staff list is not empty on day one.
-- ---------------------------------------------------------------------------
insert into public.turnovers (hold_id, due_on)
select id, check_out from public.holds
where status = 'confirmed'
on conflict (hold_id) do nothing;

-- ============================================================================
--  AFTER RUNNING THIS
--  Add each staff member: Authentication -> Users -> Add user (tick "Auto
--  Confirm User"). They land as staff automatically and can only reach /staff.
--  Promote someone to owner in the app: Owner -> Settings -> Who can sign in.
-- ============================================================================
