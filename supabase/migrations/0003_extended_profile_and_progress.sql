-- 0003_extended_profile_and_progress.sql — Expands profiles with the
-- attributes needed for real personalization (body stats, activity,
-- equipment, diet/allergies, cuisine, computed targets) and adds
-- progress-tracking tables: body_metrics (weight over time), progress_photos,
-- and workout_logs (adherence + strength progression).
-- Author: Monesh Abinav <monesh.abinav@vigilnz.com>
-- Date: 2026-09-20

alter table profiles
  add column if not exists age int check (age between 13 and 100),
  add column if not exists sex text check (sex in ('male', 'female', 'other')),
  add column if not exists height_cm numeric check (height_cm between 100 and 250),
  add column if not exists weight_kg numeric check (weight_kg between 30 and 300),
  add column if not exists goal text check (goal in ('lose_fat', 'build_muscle', 'recomp', 'maintain', 'general_fitness')),
  add column if not exists activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  add column if not exists equipment text[] not null default '{}',
  add column if not exists dietary_preferences text[] not null default '{}',
  add column if not exists allergies text[] not null default '{}',
  add column if not exists cuisine_preference text,
  add column if not exists calorie_target int check (calorie_target between 800 and 6000),
  add column if not exists protein_target_g int check (protein_target_g between 20 and 400);

create table if not exists body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  weight_kg numeric not null check (weight_kg between 30 and 300),
  note text,
  recorded_at date not null default current_date
);

create table if not exists progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  image_url text not null,
  note text,
  recorded_at date not null default current_date
);

create table if not exists workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid references generated_plans (id) on delete set null,
  exercise_name text not null,
  sets jsonb not null default '[]'::jsonb,
  performed_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

alter table body_metrics enable row level security;
alter table progress_photos enable row level security;
alter table workout_logs enable row level security;

create policy "body_metrics_owner" on body_metrics for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "progress_photos_owner" on progress_photos for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "workout_logs_owner" on workout_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Same "Automatically expose new tables" caveat as 0002_grants.sql.
grant select, insert, update, delete
  on body_metrics, progress_photos, workout_logs
  to authenticated;
grant all on body_metrics, progress_photos, workout_logs to service_role;

-- Storage bucket for progress photos, private by default; access is scoped
-- to the uploader's own folder (storage path prefixed with their user id).
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

create policy "progress_photos_storage_owner_select"
  on storage.objects for select
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "progress_photos_storage_owner_insert"
  on storage.objects for insert
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "progress_photos_storage_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
