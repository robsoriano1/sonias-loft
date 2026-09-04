-- ============================================================================
--  SONIA'S LOFT - Supabase schema
--  Paste this whole file into the Supabase SQL Editor and hit Run.
--  (Dashboard -> SQL Editor -> New query -> paste -> Run)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. INQUIRIES  - one row per booking enquiry from the public form
-- ---------------------------------------------------------------------------
create table if not exists public.inquiries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  email       text not null,
  phone       text,
  check_in    date,
  check_out   date,
  guests      integer,
  message     text,
  status      text not null default 'new'
              check (status in ('new', 'replied', 'confirmed', 'archived'))
);

create index if not exists inquiries_created_at_idx
  on public.inquiries (created_at desc);

-- ---------------------------------------------------------------------------
-- 2. BLOCKED_DATES  - days the owner has marked unavailable
--    One row per blocked day. No row = available.
-- ---------------------------------------------------------------------------
create table if not exists public.blocked_dates (
  day         date primary key,
  note        text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
alter table public.inquiries    enable row level security;
alter table public.blocked_dates enable row level security;

-- Anyone (anon) may SUBMIT an enquiry, but nobody anonymous may read them.
drop policy if exists "anon can submit inquiries" on public.inquiries;
create policy "anon can submit inquiries"
  on public.inquiries for insert
  to anon, authenticated
  with check (true);

-- Only a signed-in owner can read / update / delete enquiries.
drop policy if exists "owner can read inquiries" on public.inquiries;
create policy "owner can read inquiries"
  on public.inquiries for select to authenticated using (true);

drop policy if exists "owner can update inquiries" on public.inquiries;
create policy "owner can update inquiries"
  on public.inquiries for update to authenticated using (true) with check (true);

drop policy if exists "owner can delete inquiries" on public.inquiries;
create policy "owner can delete inquiries"
  on public.inquiries for delete to authenticated using (true);

-- Blocked dates are PUBLIC to read (the landing page calendar needs them)
-- but only the owner can change them.
drop policy if exists "anyone can read blocked dates" on public.blocked_dates;
create policy "anyone can read blocked dates"
  on public.blocked_dates for select to anon, authenticated using (true);

drop policy if exists "owner can insert blocked dates" on public.blocked_dates;
create policy "owner can insert blocked dates"
  on public.blocked_dates for insert to authenticated with check (true);

drop policy if exists "owner can delete blocked dates" on public.blocked_dates;
create policy "owner can delete blocked dates"
  on public.blocked_dates for delete to authenticated using (true);

-- ============================================================================
--  CREATE THE OWNER LOGIN
--  Dashboard -> Authentication -> Users -> "Add user" -> "Create new user".
--  Use Tita Sonia's email + a strong password, and tick "Auto Confirm User".
--  Then turn OFF public sign-ups so nobody else can make an account:
--  Authentication -> Providers -> Email -> disable "Allow new users to sign up".
-- ============================================================================
