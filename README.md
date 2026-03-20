# LevelUp DSE Planner

A study planning web app for HKDSE (Hong Kong Diploma of Secondary Education) candidates.

## Purpose

LevelUp DSE Planner helps students prepare for the HKDSE exams by:

- **Planning study sessions** — Weekly planner with session-level tasks, rest slots, and subject assignments so you can structure revision across the exam period
- **Tracking past paper attempts** — Log scores, estimate DSE levels from year-specific cutoffs, and see progress over time
- **Understanding performance** — Analytics with score trends, grade distribution, and marks-to-next-level insights to target weak areas
- **Managing subjects** — Configure subjects with short codes (e.g. MATH, ENG, CHEM) so grade prediction and exam countdowns work correctly

The app uses official DSE cutoff data to estimate levels from raw scores and supports per-subject exam timetables so you can focus on your next paper.

## Tech Stack

- React 19 + TypeScript
- Vite 7
- React Router 7
- Tailwind CSS 4
- Supabase (Auth + Postgres + RLS)

## Features

- Email/password authentication via Supabase (including password reset flow)
- Weekly planner with session-level tasks and rest slots
- Past paper attempt tracking with estimated DSE levels and sort toggle (newest/oldest first)
- Subject management (name, short code, color, paper labels)
- Subject-specific cutoff parsing from markdown with generic fallback
- Analytics page: score trends, grade distribution, marks-to-next-level insights
- Paper completion matrix: year × paper grid showing completed/missing papers per subject
- Per-subject exam countdown and timetable
- Date-range filtering for past papers (All, Last 30 days, Last 3 months, custom range)
- CSV / JSON export (PastPapersPage and PlannerPage; respects current filters)
- Dark mode (toggle in sidebar, persisted in localStorage)

## Project Structure

- `src/App.tsx`: App bootstrap, auth/session handling, route guards, initial data loading
- `src/pages/PlannerPage.tsx`: Weekly planner timeline and task editor modal
- `src/pages/PastPapersPage.tsx`: Past paper CRUD, filter/sort, modal form, paper matrix
- `src/pages/AnalyticsPage.tsx`: Score trends, grade distribution, summary stats
- `src/pages/ExamTimetablePage.tsx`: Per-subject exam timetable and countdown
- `src/pages/SubjectsPage.tsx`: Subject CRUD and preset color/paper-label management
- `src/pages/LoginPage.tsx`: Sign in/sign up flow
- `src/pages/ResetPasswordPage.tsx`: Password reset via email link
- `src/components/`: Layout, PlannerGrid, PaperMatrix, ExportDropdown, DateFilterDropdown, SortDropdown, UI primitives
- `src/lib/api/`: Supabase data-access layer (`subjectsApi`, `plannerApi`, `pastPapersApi`, `goalsApi`)
- `src/lib/supabase.ts`: Singleton Supabase client and environment checks
- `src/utils/`: Date helpers, subject styles, DSE level estimation + markdown parser, export utilities
- `supabase/schema.sql`: Database tables, indexes, constraints, and RLS policies
- `public/dse-cutoffs.md`, `public/dse-cutoffs-electives.md`: In-app cutoff source files loaded at runtime

## Environment Setup

Create `.env` in `dse-planner/`:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

If these variables are missing, the app shows a setup-required screen and blocks auth/data requests.

## Install and Run

```bash
npm install
npm run dev
```

Useful scripts:

- `npm run dev`: Start dev server
- `npm run build`: Type-check and create production build
- `npm run preview`: Preview production build locally
- `npm run lint`: Run ESLint

## Supabase Setup

1. Create a Supabase project.
2. In SQL editor, run `supabase/schema.sql`.
3. Enable Email auth provider.
4. Copy project URL and anon key into `.env`.

## DSE Cutoff Data

Runtime cutoff data is loaded from `public/dse-cutoffs.md` (core subjects) and `public/dse-cutoffs-electives.md` (electives).

- Parsed by `parseHkdseCutoffMarkdown` and `parseHkdseElectiveCutoffMarkdown` in `src/utils/dseLevelEstimator.ts`
- Uses year-specific cutoffs: past paper exam year is matched to that year’s cutoffs
- **Core subjects:** Chinese (CHI), English (ENG), Mathematics (MATH), Chemistry (CHEM), Biology (BIO)
- **Electives:** Physics (PHY), Economics (ECON), BAFS, Chinese History (CHI-HIST), History (HIST), Chinese Literature (CHI-LIT), Geography (GEOG), ICT, M1, M2, Literature in English (ENG-LIT)
- Add subjects in Settings with these short codes for grade prediction to work
- If parsing fails or file is unavailable, estimation falls back to generic cutoffs

## Additional Documentation

- `docs/ARCHITECTURE.md`: Component and state-flow overview
- `docs/API.md`: Frontend data-access API contract
- `docs/DATABASE.md`: Schema and RLS policy reference
- `docs/DEVELOPMENT.md`: Onboarding, workflows, and troubleshooting
