-- 0005_meal_logs.sql — Meal logging table, needed by the agent's log_meal
-- tool (src/lib/ai/tools.ts) since no such table existed yet.
-- Author: Monesh Abinav <monesh.abinav@vigilnz.com>
-- Date: 2026-09-20

create table if not exists meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  calories int not null check (calories >= 0),
  protein_g int not null check (protein_g >= 0),
  carbs_g int not null check (carbs_g >= 0),
  fats_g int not null check (fats_g >= 0),
  logged_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table meal_logs enable row level security;

create policy "meal_logs_owner" on meal_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Same "Automatically expose new tables" caveat as 0002_grants.sql.
grant select, insert, update, delete on meal_logs to authenticated;
grant all on meal_logs to service_role;
