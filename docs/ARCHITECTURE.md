# Architecture Overview

## High-Level Flow

1. `src/main.tsx` mounts the app with `BrowserRouter`.
2. `src/App.tsx` initializes:
   - cutoff data (`loadCutoffData`)
   - Supabase auth session
   - subject bootstrap (`listSubjects`, optional `seedDefaultSubjects`)
3. Routes are protected by session presence.
4. Shared shell is rendered via `src/components/Layout.tsx`.
5. Feature pages manage local UI state and persist through API modules.

## Routing Model

Defined in `src/App.tsx`:

- `/login`: Public login/sign-up page
- `/planner`: Protected weekly planner page
- `/past-papers`: Protected history + performance page
- `/subjects`: Protected subject management page
- `/`: Redirects to planner when signed in, otherwise login
- `*`: Same redirect behavior as `/`

## State Ownership

### App-level (`src/App.tsx`)

- `session`: Active Supabase session
- `subjects`: Current user subject list
- `cutoffData`: Parsed cutoff table map
- `usingGenericFallback`: Cutoff parser fallback indicator
- `authLoading`, `subjectsLoading`, `appError`: Global loading/error states

These are passed into pages as props to avoid duplicated fetches.

### Page-level

- `PlannerPage`: Week timeline window, planner cells, editor modal state
- `PastPapersPage`: Attempts list, filters/sort, edit/create modal state
- `SubjectsPage`: Add/edit drafts, modal visibility, per-action error state
- `LoginPage`: Auth form mode and async status

## Data Access Layer

`src/lib/api/` contains all DB interaction:

- `subjectsApi.ts`: list/seed/create/update/delete subjects
- `plannerApi.ts`: list/upsert/delete planner cells
- `pastPapersApi.ts`: list/create/update/delete attempts

Key properties:

- UI-facing types remain camelCase (`Subject`, `PastPaperAttempt`, `PlannerTask`)
- DB rows are mapped from snake_case inside API modules
- APIs throw Supabase errors; pages own user-facing error rendering

## Auth and Client Lifecycle

`src/lib/supabase.ts`:

- Validates `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Exposes `isSupabaseConfigured` for guard screens
- Lazily creates a singleton Supabase client with session persistence enabled

## Planner Design Notes

`PlannerPage` keeps a moving week window centered around current week and allows extending in either direction up to `LOAD_LIMIT` weeks each way.

- Week blocks are tracked in `weekRefs` for scroll targeting
- `IntersectionObserver` updates current week label in sticky controls
- Planner data is keyed by `date + sessionId` and cached as `Map` for quick lookup

## DSE Estimation Pipeline

1. App loads markdown from `/dse-cutoffs.md`
2. `parseCutoffMarkdown` builds `CutoffData` by subject short code
3. `estimateDseLevel(subjectKey, percentage, cutoffData)` returns best matching level
4. If subject data is unavailable, generic cutoffs are used

## Design Tokens

`src/index.css` defines Tailwind theme variables for colors, radii, shadows, and fonts.

- Layout and components reference semantic tokens (`bg-background`, `text-primary`, etc.)
- This keeps styling consistent while allowing central token updates
