# LevelUp DSE Planner

Study-planning web app for Hong Kong DSE candidates: weekly planner, past-paper
tracker with year-specific level estimation, analytics, exam timetable.

## Stack

Next.js 16 (App Router) · React 19 · TS strict · Tailwind 4 · Supabase (Auth + Postgres + RLS via `@supabase/ssr`) · Vitest · Recharts · @dnd-kit. Path alias `@/*` → repo root.

## Commands

`npm run dev|build|start|lint|test|test:watch|test:coverage`

## Env

`.env` needs `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Without them the app shows a setup-required screen.

## Supabase

Run `supabase/schema.sql` then any pending migrations in `supabase/migrations/` (newest first). RLS gates all tables by `auth.uid() = user_id`.

## Layout

- `src/app/` — routes. `(protected)/` is the auth-guarded group; pages are server components that mount views.
- `src/views/` — page-level client components.
- `src/components/` — `Layout`, `PlannerGrid`, `PaperMatrix`, `*Dropdown`, `PastPaperForm`, `PastPaperTable`, `OnboardingStreamModal`, `SkeletonLoader`, plus `ui/` primitives.
- `src/contexts/` — `DataContext` (session, subjects, cells, cutoff data, guest mode, warnings), `ToastContext`, `ConfirmContext`.
- `src/lib/api/*Api.ts` — all DB I/O. Snake_case↔camelCase mappers (`toSubject` etc.) live next to their `*Row` types. APIs throw; pages render errors.
- `src/lib/supabase.ts` — env-validated singleton. `src/lib/localStorageService.ts` — guest-mode persistence.
- `src/utils/` — `dseLevelEstimator` (markdown parser + nearest-year lookup + generic fallback), `dateHelpers`, `subjectWeighting`, `pastPaperGroups`, `exportUtils`, `subjectStyles`.
- `src/constants.ts` — `PLANNER_SESSIONS`, `DSE_TIMETABLES`, defaults.
- `src/subjectCatalog.ts` — derived from `subject_weighting.json` + `src/data/subjectExtras.json`.
- `public/dse-cutoffs.md` + `dse-cutoffs-electives.md` — runtime cutoff source.

## Domain

- **Subject** `{id, name, shortCode, baseColor, paperLabels[], paperWeights?}`. `shortCode` = canonical HKDSE code (`CHI`, `ENG`, `MATH`, `CHEM`, `BIO`, `PHY`, `ECON`, `BAFS`, `CHI-HIST`, `CHI-LIT`, `HIST`, `GEOG`, `ICT`, `M1`, `M2`, `ENG-LIT`, …). Stored uppercase, case-insensitive on input. Max 12 chars (allows hyphens).
- **PlannerTask / PlannerCell** — denormalized `(date, sessionId, task)`; `unique(user_id, date, session_id)`. `is_done` for completion tracking.
- **PastPaperAttempt** — score/total/percentage/estimated level per attempt; `is_dse` flag distinguishes official vs mock.
- **StudyGoal** — `(user_id, subject_id) → weeklyTarget` for Plan Beta.
- **DseLevel** = `"5**" | "5*" | "5" | "4" | "3" | "2" | "1"`.
- **CutoffData** — `subjectCode → year → CutoffRow[]`. Year-specific lookup with nearest-year fallback; generic fallback (90/80/70/60/50/40/30) when markdown fails.

## Key architecture

- **No server-side auth guard.** `middleware.ts` only refreshes the session cookie. Guard lives in `app/(protected)/layout.tsx` because guest mode is `localStorage`-only.
- **Guest → account migration** in `DataContext` (`migrateGuestDataToAccount`); `migrationInProgressRef` prevents double-runs when LoginPage also triggers it.
- **Subject deletion is app-cascade.** `subject_id` is `text`, not a FK. `deleteSubjectWithCascade` cleans up planner cells + past papers + study goals. Protected layout listens for `subject-deleted` window events.
- **`study_goals` table is optional** in older deployments; deletion code swallows its errors.
- **Cutoff parser** auto-detects legacy vs year-based markdown, migrates `CHIST`/`CHILIT` → `CHI-HIST`/`CHI-LIT`, and falls back to generic when fetch fails. `usingGenericFallback` flag + `dataWarnings` entry notify the UI.

## Conventions

- snake_case ↔ camelCase only at the API boundary; UI/types stay camelCase.
- Row types (`SubjectRow`, `PlannerCellRow`, `PastPaperAttemptRow`, `StudyGoalRow`) live next to `toX` mappers in each `*Api.ts`.
- Tailwind tokens in `globals.css` (`bg-background`, `text-primary`, `radius-zen`, `zen-shadow`, `glass-card`).
- Dark mode via `class="dark"` on `<html>`, bootstrapped in root layout (no flash).
- `PLANNER_SESSIONS` in `constants.ts`: s1 morning, s2a/s2b afternoon/evening, s3 night.
- Year-specific cutoffs: a paper's `examYear` determines which cutoff table. Don't substitute current year.

## Workflows

- **Add subject field** → `types.ts` → `supabase/schema.sql` + new migration → `*Api.ts` mapper → form/UI.
- **Add planner slot** → append to `PLANNER_SESSIONS` → verify `PlannerGrid` + editor modal.
- **Edit cutoffs** → `public/dse-cutoffs*.md` (preferred), or generic fallback in `dseLevelEstimator.ts`.
- **Add auth-guarded page** → `src/app/(protected)/<name>/page.tsx` (server) mounts `src/views/<Name>Page.tsx` (client) using `useData()`.

## DoD

`npm run lint` clean · `npm run build` passes · `npm test` green · schema change ⇒ migration added + `schema.sql` updated · API change ⇒ `docs/API.md` updated · new field ⇒ `types.ts` + mapper + UI + form.

## Karpathy Behavioral Guidelines

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.