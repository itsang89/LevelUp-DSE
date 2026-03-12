-- Create study_goals table
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

create table if not exists public.study_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id text not null,
  weekly_target integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, subject_id)
);

-- Enable RLS
alter table public.study_goals enable row level security;

-- Policies
create policy study_goals_select_own
  on public.study_goals for select
  using (auth.uid() = user_id);

create policy study_goals_insert_own
  on public.study_goals for insert
  with check (auth.uid() = user_id);

create policy study_goals_update_own
  on public.study_goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy study_goals_delete_own
  on public.study_goals for delete
  using (auth.uid() = user_id);

-- Index for performance
create index if not exists study_goals_user_id_idx on public.study_goals (user_id);
