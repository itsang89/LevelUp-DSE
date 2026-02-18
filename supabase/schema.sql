create extension if not exists pgcrypto;

create table if not exists public.subjects (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  short_code text not null,
  base_color text not null,
  paper_labels text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, id)
);

create index if not exists subjects_user_id_idx on public.subjects (user_id);

create table if not exists public.planner_cells (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  session_id text not null,
  task_id text not null,
  subject_id text null,
  title text not null,
  notes text null,
  is_rest boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, date, session_id)
);

create index if not exists planner_cells_user_date_idx
  on public.planner_cells (user_id, date);

create table if not exists public.past_paper_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  subject_id text not null,
  exam_year int not null,
  paper_label text not null,
  date date not null,
  score numeric not null,
  total numeric not null,
  percentage numeric not null,
  estimated_level text not null,
  tag text null,
  notes text null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, id),
  check (total > 0),
  check (score >= 0),
  check (score <= total)
);

create index if not exists past_paper_attempts_user_date_idx
  on public.past_paper_attempts (user_id, date desc);

alter table public.subjects enable row level security;
alter table public.planner_cells enable row level security;
alter table public.past_paper_attempts enable row level security;

drop policy if exists subjects_select_own on public.subjects;
create policy subjects_select_own
  on public.subjects for select
  using (auth.uid() = user_id);

drop policy if exists subjects_insert_own on public.subjects;
create policy subjects_insert_own
  on public.subjects for insert
  with check (auth.uid() = user_id);

drop policy if exists subjects_update_own on public.subjects;
create policy subjects_update_own
  on public.subjects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists subjects_delete_own on public.subjects;
create policy subjects_delete_own
  on public.subjects for delete
  using (auth.uid() = user_id);

drop policy if exists planner_cells_select_own on public.planner_cells;
create policy planner_cells_select_own
  on public.planner_cells for select
  using (auth.uid() = user_id);

drop policy if exists planner_cells_insert_own on public.planner_cells;
create policy planner_cells_insert_own
  on public.planner_cells for insert
  with check (auth.uid() = user_id);

drop policy if exists planner_cells_update_own on public.planner_cells;
create policy planner_cells_update_own
  on public.planner_cells for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists planner_cells_delete_own on public.planner_cells;
create policy planner_cells_delete_own
  on public.planner_cells for delete
  using (auth.uid() = user_id);

drop policy if exists past_paper_attempts_select_own on public.past_paper_attempts;
create policy past_paper_attempts_select_own
  on public.past_paper_attempts for select
  using (auth.uid() = user_id);

drop policy if exists past_paper_attempts_insert_own on public.past_paper_attempts;
create policy past_paper_attempts_insert_own
  on public.past_paper_attempts for insert
  with check (auth.uid() = user_id);

drop policy if exists past_paper_attempts_update_own on public.past_paper_attempts;
create policy past_paper_attempts_update_own
  on public.past_paper_attempts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists past_paper_attempts_delete_own on public.past_paper_attempts;
create policy past_paper_attempts_delete_own
  on public.past_paper_attempts for delete
  using (auth.uid() = user_id);
