create table study_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  subject_id text not null,
  weekly_target integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, subject_id)
);

alter table study_goals enable row level security;

create policy "Users can view their own study goals"
  on study_goals for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own study goals"
  on study_goals for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own study goals"
  on study_goals for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own study goals"
  on study_goals for delete
  using ( auth.uid() = user_id );

-- Setup trigger for updated_at
create trigger handle_updated_at before update on study_goals
  for each row execute procedure moddatetime (updated_at);
