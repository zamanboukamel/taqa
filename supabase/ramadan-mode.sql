-- ============================================================
-- Taqa — Ramadan Mode migration
-- Run this in the Supabase SQL Editor AFTER schema.sql.
-- Safe to run more than once (idempotent: IF NOT EXISTS / drop-before-create).
-- ============================================================

-- ------------------------------------------------------------
-- NEW COLUMNS
-- ------------------------------------------------------------

-- Academy-level Ramadan defaults + the city used to look up prayer times.
alter table academies
  add column if not exists ramadan_mode       boolean not null default false,
  add column if not exists city                text    not null default 'Doha',
  add column if not exists country             text    not null default 'Qatar',
  -- The first day of the academy's Ramadan window. Null => "start from today",
  -- which makes the feature testable any time of year.
  add column if not exists ramadan_start_date  date;

-- Player-level overrides.
alter table players
  -- Null => inherit the academy default. True/false => explicit per-player choice.
  add column if not exists ramadan_mode   boolean,
  -- Some athletes don't fast (medical exemption, age, choice). Defaults to true
  -- because most will, but it is always the athlete's/family's choice to change.
  add column if not exists is_fasting     boolean not null default true,
  -- The athlete's representative training time during Ramadan ("HH:MM", 24h).
  -- Drives the before-iftar / after-iftar / after-suhoor logic.
  add column if not exists training_time  text;

-- ------------------------------------------------------------
-- DATE-AWARE PRAYER TIMES
-- One row per (academy, calendar date). suhoor_time = dawn/Fajr cutoff,
-- iftar_time = sunset/Maghrib. Filled from the Aladhan API or edited by hand.
-- ------------------------------------------------------------
create table if not exists ramadan_days (
  id           uuid primary key default gen_random_uuid(),
  academy_id   uuid not null references academies (id) on delete cascade,
  day_date     date not null,
  suhoor_time  text not null,                       -- "HH:MM"
  iftar_time   text not null,                       -- "HH:MM"
  source       text not null default 'api',         -- 'api' | 'manual'
  updated_at   timestamptz not null default now(),
  unique (academy_id, day_date)
);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY — mirror the existing academy-owner rule.
-- ------------------------------------------------------------
alter table ramadan_days enable row level security;

drop policy if exists "directors_manage_own_ramadan_days" on ramadan_days;
create policy "directors_manage_own_ramadan_days"
  on ramadan_days
  for all
  to authenticated
  using (
    exists (
      select 1 from academies a
      where a.id = ramadan_days.academy_id
        and a.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from academies a
      where a.id = ramadan_days.academy_id
        and a.owner_id = auth.uid()
    )
  );

-- Done. You should see "Success. No rows returned".
