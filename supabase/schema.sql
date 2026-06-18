-- ============================================================
-- Taqa — database schema + Row Level Security (RLS)
-- Paste this whole file into the Supabase SQL Editor and click "Run".
-- It is safe to run more than once (drops policies before recreating them).
-- ============================================================

-- gen_random_uuid() is used for primary keys + player access tokens.
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- TABLES
-- ------------------------------------------------------------

create table if not exists academies (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  sport_type  text not null,
  created_at  timestamptz not null default now()
);

create table if not exists training_schedules (
  id            uuid primary key default gen_random_uuid(),
  academy_id    uuid not null references academies (id) on delete cascade,
  day_of_week   text not null,
  session_time  text not null
);

create table if not exists players (
  id                   uuid primary key default gen_random_uuid(),
  academy_id           uuid not null references academies (id) on delete cascade,
  name                 text not null,
  age                  int,
  weight_kg            numeric,
  position             text,
  dietary_restrictions text,
  access_token         uuid not null unique default gen_random_uuid(),
  created_at           timestamptz not null default now()
);

create table if not exists meal_plans (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references players (id) on delete cascade,
  plan_json     jsonb not null,
  generated_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
--
-- RLS = a Postgres feature where each table row is invisible unless a
-- "policy" explicitly grants the current user access to it. With RLS on
-- and no matching policy, a query returns NOTHING (instead of everything).
--
-- Our rule: a logged-in director can only touch rows that belong to an
-- academy they own (academies.owner_id = their auth user id).
-- The public player page does NOT use these policies at all — it goes
-- through a server route using the SERVICE ROLE key, which bypasses RLS,
-- and looks players up strictly by their secret access_token.
-- ------------------------------------------------------------

alter table academies          enable row level security;
alter table training_schedules enable row level security;
alter table players            enable row level security;
alter table meal_plans         enable row level security;

-- academies: a director fully manages academies where they are the owner.
drop policy if exists "directors_manage_own_academies" on academies;
create policy "directors_manage_own_academies"
  on academies
  for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- training_schedules: allowed only if the parent academy is owned by the director.
drop policy if exists "directors_manage_own_schedules" on training_schedules;
create policy "directors_manage_own_schedules"
  on training_schedules
  for all
  to authenticated
  using (
    exists (
      select 1 from academies a
      where a.id = training_schedules.academy_id
        and a.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from academies a
      where a.id = training_schedules.academy_id
        and a.owner_id = auth.uid()
    )
  );

-- players: allowed only if the parent academy is owned by the director.
drop policy if exists "directors_manage_own_players" on players;
create policy "directors_manage_own_players"
  on players
  for all
  to authenticated
  using (
    exists (
      select 1 from academies a
      where a.id = players.academy_id
        and a.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from academies a
      where a.id = players.academy_id
        and a.owner_id = auth.uid()
    )
  );

-- meal_plans: allowed only if the plan's player belongs to an academy the director owns.
drop policy if exists "directors_manage_own_meal_plans" on meal_plans;
create policy "directors_manage_own_meal_plans"
  on meal_plans
  for all
  to authenticated
  using (
    exists (
      select 1 from players p
      join academies a on a.id = p.academy_id
      where p.id = meal_plans.player_id
        and a.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from players p
      join academies a on a.id = p.academy_id
      where p.id = meal_plans.player_id
        and a.owner_id = auth.uid()
    )
  );

-- Done. You should see "Success. No rows returned".
