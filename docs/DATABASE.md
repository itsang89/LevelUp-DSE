# Database and Security

Schema file: `supabase/schema.sql`

## Extensions

- `pgcrypto` (for `gen_random_uuid()`)

## Tables

## `public.subjects`

Purpose: Subject catalog per user.

Columns:

- `user_id uuid` (FK to `auth.users.id`, cascade delete)
- `id text` (subject key, scoped per user)
- `name text`
- `short_code text`
- `base_color text`
- `paper_labels text[]` (default `{}`)
- `created_at timestamptz` (UTC now)

Constraints:

- Primary key: `(user_id, id)`

Indexes:

- `subjects_user_id_idx(user_id)`

## `public.planner_cells`

Purpose: Session-level planner entries for each date.

Columns:

- `id uuid` (PK, auto via `gen_random_uuid()`)
- `user_id uuid` (FK to `auth.users.id`, cascade delete)
- `date date`
- `session_id text`
- `task_id text`
- `subject_id text null`
- `title text`
- `notes text null`
- `is_rest boolean` (default false)
- `created_at timestamptz` (UTC now)

Constraints:

- Unique: `(user_id, date, session_id)`

Indexes:

- `planner_cells_user_date_idx(user_id, date)`

## `public.past_paper_attempts`

Purpose: Historical past-paper results and estimated level snapshots.

Columns:

- `user_id uuid` (FK to `auth.users.id`, cascade delete)
- `id text` (attempt key, scoped per user)
- `subject_id text`
- `exam_year int`
- `paper_label text`
- `date date`
- `score numeric`
- `total numeric`
- `percentage numeric`
- `estimated_level text`
- `tag text null`
- `notes text null`
- `created_at timestamptz` (UTC now)

Constraints:

- Primary key: `(user_id, id)`
- `check (total > 0)`
- `check (score >= 0)`
- `check (score <= total)`

Indexes:

- `past_paper_attempts_user_date_idx(user_id, date desc)`

## Row Level Security

RLS is enabled for all three tables.

Policy model (same pattern across tables):

- `select`: `auth.uid() = user_id`
- `insert`: `with check (auth.uid() = user_id)`
- `update`: `using (auth.uid() = user_id)` and `with check (auth.uid() = user_id)`
- `delete`: `auth.uid() = user_id`

Effect: each user can read and mutate only their own data.

## Operational Notes

- Subject deletion does not cascade from app logic into planner/attempt rows because `subject_id` is text and not a foreign key.
- UI handles orphaned entries by showing unknown subject labels.
- `planner_cells` stores task details denormalized for direct rendering.
