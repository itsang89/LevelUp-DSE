# Frontend API Reference

This document describes the local frontend data-access API in `src/lib/api`.

## Shared Behavior

- All functions require a valid Supabase client (`getSupabaseClient()`)
- Errors from Supabase are thrown to callers
- Callers (pages) handle retry/UX messaging
- Data is scoped by `user_id` in each query/mutation

## `subjectsApi.ts`

### `listSubjects(userId: string): Promise<Subject[]>`

Returns all subjects for the user, ordered by name.

### `seedDefaultSubjects(userId: string, subjects: Subject[]): Promise<void>`

Upserts default subjects for first-time users.

- Conflict target: `user_id,id`
- Uses `ignoreDuplicates: true`

### `createSubject(userId: string, subject: Subject): Promise<void>`

Inserts a new subject row.

### `updateSubject(userId: string, subjectId: string, subject: Subject): Promise<void>`

Updates editable fields for a subject identified by `user_id + id`.

### `deleteSubject(userId: string, subjectId: string): Promise<void>`

Deletes a subject identified by `user_id + id`.

## `plannerApi.ts`

### `listPlannerCells(userId: string): Promise<PlannerCell[]>`

Returns planner entries for a user.

### `upsertPlannerCell(userId: string, date: string, sessionId: string, task: PlannerTask): Promise<void>`

Creates or updates a planner cell.

- Conflict target: `user_id,date,session_id`
- Stores denormalized task fields (`title`, `notes`, `is_rest`) with subject link

### `deletePlannerCell(userId: string, date: string, sessionId: string): Promise<void>`

Deletes one planner cell by composite key.

## `pastPapersApi.ts`

### `listPastPaperAttempts(userId: string): Promise<PastPaperAttempt[]>`

Returns attempts ordered by `date desc`.

### `createPastPaperAttempt(userId: string, attempt: PastPaperAttempt): Promise<void>`

Inserts a past-paper attempt.

### `updatePastPaperAttempt(userId: string, attempt: PastPaperAttempt): Promise<void>`

Updates attempt fields by `user_id + id`.

### `deletePastPaperAttempt(userId: string, attemptId: string): Promise<void>`

Deletes a single attempt by `user_id + id`.

## Naming and Mapping

API modules map between:

- DB rows: snake_case (`short_code`, `paper_label`, `estimated_level`)
- App types: camelCase (`shortCode`, `paperLabel`, `estimatedLevel`)

Mapping functions:

- `toSubject`
- `toPlannerCell`
- `toPastPaperAttempt`

## Related Types

Primary domain types are defined in `src/types.ts`:

- `Subject`
- `PlannerTask`
- `PlannerCell`
- `PastPaperAttempt`
- `CutoffData` / `CutoffRow` / `DseLevel`
