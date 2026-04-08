# Architecture Overview

## High-Level Flow

1. `src/app/layout.tsx` is the root Next.js layout — wraps all pages with global providers (`providers.tsx`).
2. `src/app/providers.tsx` is a client component that initialises the Supabase auth session and exposes it via `AuthContext`.
3. `src/app/(protected)/layout.tsx` is a client layout that reads `AuthContext`, redirects unauthenticated users to `/login`, and renders the shared app shell.
4. Feature pages under `(protected)/` manage local UI state and persist through API modules.
5. Public routes (`/login`, `/reset-password`, `/`) are outside the protected group.

## Routing Model

Next.js App Router file-based routing:

- `/`: Landing page (`src/app/page.tsx`)
- `/login`: Sign in/sign up page
- `/reset-password`: Password reset via email link
- `/(protected)/planner`: Weekly planner page
- `/(protected)/plan`: Strategic planning page (Plan Beta)
- `/(protected)/past-papers`: History + performance page
- `/(protected)/analytics`: Analytics and trend insights
- `/(protected)/subjects`: Subject management
- `/(protected)/exam-timetable`: Exam timetable + countdown

## State Ownership

### Auth context (`src/app/providers.tsx`)

- `session`: Active Supabase session
- `authLoading`: Auth initialisation state

### Protected layout (`src/app/(protected)/layout.tsx`)

- `subjects`: Current user subject list
- `cutoffData`: Parsed cutoff table map
- `usingGenericFallback`: Cutoff parser fallback indicator
- `subjectsLoading`, `appError`: Loading/error states

These are passed into page views as props to avoid duplicated fetches.

### Page/view-level (`src/views/`)

- `PlannerPage`: Week timeline window, planner cells, editor modal state
- `PlanPage`: Weekly target tracking, readiness calculations, strategic queue, goals modal
- `PastPapersPage`: Attempts list, filters/sort, edit/create modal state
- `SubjectsPage`: Add/edit drafts, modal visibility, per-action error state
- `LoginPage`: Auth form mode and async status

## Data Access Layer

`src/lib/api/` contains all DB interaction:

- `subjectsApi.ts`: list/seed/create/update/delete subjects
- `plannerApi.ts`: list/upsert/delete planner cells
- `pastPapersApi.ts`: list/create/update/delete attempts
- `goalsApi.ts`: list/upsert weekly study goals used by Plan Beta

Key properties:

- UI-facing types remain camelCase (`Subject`, `PastPaperAttempt`, `PlannerTask`)
- DB rows are mapped from snake_case inside API modules
- APIs throw Supabase errors; pages own user-facing error rendering

## Auth and Client Lifecycle

`src/lib/supabase.ts`:

- Validates `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Exposes `isSupabaseConfigured` for guard screens
- Lazily creates a singleton Supabase client with session persistence enabled

`@supabase/ssr` is used for SSR-compatible cookie-based sessions.

## Planner Design Notes

`PlannerView` keeps a moving week window centered around current week and allows extending in either direction up to `LOAD_LIMIT` weeks each way.

- Week blocks are tracked in `weekRefs` for scroll targeting
- `IntersectionObserver` updates current week label in sticky controls
- Planner data is keyed by `date + sessionId` and cached as `Map` for quick lookup

## DSE Estimation Pipeline

1. App loads markdown from `/dse-cutoffs.md`
2. `parseHkdseCutoffMarkdown` parses year-based tables from HKDSE historical data
3. `estimateDseLevel(subjectKey, percentage, cutoffData, examYear)` uses year-specific cutoffs to predict grade
4. If subject data is unavailable, generic cutoffs are used

## Design Tokens

`src/app/globals.css` defines Tailwind theme variables for colors, radii, shadows, and fonts.

- Layout and components reference semantic tokens (`bg-background`, `text-primary`, etc.)
- This keeps styling consistent while allowing central token updates
