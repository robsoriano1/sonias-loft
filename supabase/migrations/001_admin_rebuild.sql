-- ============================================================================
--  SONIA'S LOFT - admin rebuild, phases 1-4
--  Run this AFTER schema.sql, in the Supabase SQL Editor.
--  (Dashboard -> SQL Editor -> New query -> paste -> Run)
--
--  Everything here is additive except the inquiries.status constraint, which
--  widens the pipeline and folds the old 'archived' state into 'declined'.
--  blocked_dates is left exactly as it was, so the public calendar keeps
--  reading the same rows it always has.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. INQUIRIES - wider status pipeline, reply tracking, source
-- ---------------------------------------------------------------------------
alter table public.inquiries drop constraint if exists inquiries_status_check;
update public.inquiries set status = 'declined' where status = 'archived';
alter table public.inquiries add constraint inquiries_status_check
  check (status in ('new', 'replied', 'confirmed', 'declined', 'expired'));

-- When the owner first responded. Drives the response-time indicator and,
-- later, the average-response-time number on the dashboard.
alter table public.inquiries add column if not exists first_reply_at timestamptz;

-- Whether the new-inquiry notification actually fired. A failed send stays
-- visible instead of silently breaking the same-day promise.
alter table public.inquiries add column if not exists notified_at timestamptz;

-- Where the enquiry came from, for the dashboard channel breakdown.
alter table public.inquiries add column if not exists source text not null default 'direct';
alter table public.inquiries drop constraint if exists inquiries_source_check;
alter table public.inquiries add constraint inquiries_source_check
  check (source in ('direct', 'facebook', 'referral', 'other'));

-- ---------------------------------------------------------------------------
-- 2. HOLDS - a stay, tentative or confirmed, optionally tied to an enquiry
--    Stored as a half-open range [check_in, check_out): the guest sleeps
--    check_in..check_out-1 and leaves on check_out, so back-to-back stays
--    share a date without overlapping.
-- ---------------------------------------------------------------------------
create table if not exists public.holds (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  inquiry_id  uuid references public.inquiries (id) on delete set null,
  guest_name  text not null,
  check_in    date not null,
  check_out   date not null,
  status      text not null default 'tentative'
              check (status in ('tentative', 'confirmed', 'released')),
  rate_total  numeric(12, 2),
  note        text,
  constraint holds_dates_ordered check (check_out > check_in)
);

create index if not exists holds_range_idx on public.holds (check_in, check_out);
create index if not exists holds_status_idx on public.holds (status);
create index if not exists holds_inquiry_idx on public.holds (inquiry_id);

-- ---------------------------------------------------------------------------
-- 3. SETTINGS - one row, id always 1. Holds the operational knobs and the
--    things that must never live in the repo (gate code).
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  id                     integer primary key default 1 check (id = 1),
  updated_at             timestamptz not null default now(),
  turnover_buffer_nights integer not null default 0 check (turnover_buffer_nights >= 0),
  weekend_min_nights     integer not null default 2 check (weekend_min_nights >= 1),
  notify_email           text,
  gate_code              text,
  checkin_window         text not null default '9am - 7pm',
  checkout_window        text not null default '7am - 5pm',
  directions_note        text,
  review_url             text
);

insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 4. RATE_RULES - weekday/weekend base rate plus dated seasonal overrides.
--    The rule with the highest priority whose date range covers a night wins;
--    a rule with null dates is the always-on base.
-- ---------------------------------------------------------------------------
create table if not exists public.rate_rules (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  label        text not null,
  starts_on    date,
  ends_on      date,
  weekday_rate numeric(12, 2) not null check (weekday_rate >= 0),
  weekend_rate numeric(12, 2) not null check (weekend_rate >= 0),
  priority     integer not null default 0,
  constraint rate_rules_range check (
    (starts_on is null and ends_on is null) or
    (starts_on is not null and ends_on is not null and ends_on >= starts_on)
  )
);

create index if not exists rate_rules_priority_idx on public.rate_rules (priority desc);

-- ---------------------------------------------------------------------------
-- 5. GUEST_MESSAGES - log of lifecycle mail sent to guests, so a confirmation
--    or review nudge is never sent twice and a failure is visible.
-- ---------------------------------------------------------------------------
create table if not exists public.guest_messages (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  hold_id    uuid references public.holds (id) on delete cascade,
  kind       text not null check (kind in ('confirmation', 'review_request')),
  to_email   text not null,
  sent_at    timestamptz,
  error      text
);

create unique index if not exists guest_messages_once_idx
  on public.guest_messages (hold_id, kind);

-- ---------------------------------------------------------------------------
-- 6. INCIDENTS - damage / extra-cleaning log tied to a stay, so the fees in
--    the house rules can be recorded and chased instead of tracked ad hoc.
-- ---------------------------------------------------------------------------
create table if not exists public.incidents (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  hold_id     uuid not null references public.holds (id) on delete cascade,
  kind        text not null default 'other'
              check (kind in ('damage', 'pet_cleaning', 'missing_item', 'other')),
  description text not null,
  amount      numeric(12, 2),
  status      text not null default 'open'
              check (status in ('open', 'invoiced', 'settled', 'waived'))
);

create index if not exists incidents_hold_idx on public.incidents (hold_id);

-- ---------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
--    Same shape as the existing tables: the public may read only what the
--    public calendar needs, and only the signed-in owner may write.
-- ---------------------------------------------------------------------------
alter table public.holds          enable row level security;
alter table public.settings       enable row level security;
alter table public.rate_rules     enable row level security;
alter table public.guest_messages enable row level security;
alter table public.incidents      enable row level security;

-- Confirmed holds are public: the availability calendar has to show them as
-- taken. Tentative holds stay private - an enquiry in progress is not a
-- booking, and publishing it would lose walk-up bookings that never confirm.
drop policy if exists "anyone can read confirmed holds" on public.holds;
create policy "anyone can read confirmed holds"
  on public.holds for select to anon using (status = 'confirmed');

drop policy if exists "owner can read all holds" on public.holds;
create policy "owner can read all holds"
  on public.holds for select to authenticated using (true);

drop policy if exists "owner can write holds" on public.holds;
create policy "owner can write holds"
  on public.holds for all to authenticated using (true) with check (true);

-- Everything else is owner-only, in both directions. Settings carries the
-- gate code, so it must never be readable by anon.
drop policy if exists "owner only settings" on public.settings;
create policy "owner only settings"
  on public.settings for all to authenticated using (true) with check (true);

drop policy if exists "owner only rate rules" on public.rate_rules;
create policy "owner only rate rules"
  on public.rate_rules for all to authenticated using (true) with check (true);

drop policy if exists "owner only guest messages" on public.guest_messages;
create policy "owner only guest messages"
  on public.guest_messages for all to authenticated using (true) with check (true);

drop policy if exists "owner only incidents" on public.incidents;
create policy "owner only incidents"
  on public.incidents for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 8. The new-enquiry notification needs the owner's address, but it runs for
--    an anonymous visitor submitting the public form - and settings carries
--    the gate code, so the table itself must stay owner-only. This function
--    hands back that one column and nothing else.
-- ---------------------------------------------------------------------------
create or replace function public.owner_notify_email()
returns text
language sql
security definer
set search_path = public
stable
as $$ select notify_email from public.settings where id = 1 $$;

revoke all on function public.owner_notify_email() from public;
grant execute on function public.owner_notify_email() to anon, authenticated;

-- Same problem for recording that the notification went out: anon may insert
-- an enquiry but not update one. This stamps that single column and nothing
-- else, and only ever forward, so it cannot be used to rewrite an enquiry.
create or replace function public.mark_inquiry_notified(inquiry_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.inquiries
     set notified_at = now()
   where id = inquiry_id
     and notified_at is null
$$;

revoke all on function public.mark_inquiry_notified(uuid) from public;
grant execute on function public.mark_inquiry_notified(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 9. A starting rate card, so the dashboard has something to work with.
--    Both numbers are zero on purpose - set the real ones in Owner -> Settings.
-- ---------------------------------------------------------------------------
insert into public.rate_rules (label, weekday_rate, weekend_rate, priority)
select 'Base rate', 0, 0, 0
where not exists (select 1 from public.rate_rules);
