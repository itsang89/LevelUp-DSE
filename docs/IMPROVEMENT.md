# DSE Planner — Improvement Tracker

Prioritised backlog for **LevelUp DSE Planner** (HKDSE study planning: weekly planner, past papers, level estimation, analytics, exam timetable). Items ranked by **user-facing impact**, then **implementation complexity**, then **regression risk**.

**Last audited:** 2026-04-08 (updated with user-facing feedback review; items 25–31 added from external product critique; items 33–34 added for missing onboarding and data-migration gaps; #8 promoted to Tier 1 as silent bug; #13 and #30 promoted to Tier 2; #27 demoted to Tier 3).

---

## App Snapshot

| Area | Stack / Behaviour |
|------|-------------------|
| **UI** | React 19, TypeScript, Vite 7, React Router 7, Tailwind CSS 4, Recharts, `@dnd-kit` (planner drag-and-drop) |
| **Data** | Supabase (email auth, Postgres, RLS); APIs in `src/lib/api/*`; guest mode via `localStorage` |
| **Domain** | Cutoff markdown in `public/dse-cutoffs*.md`; `subject_weighting.json` + `src/utils/subjectWeighting.ts` for weighted paper logic; `src/subjectCatalog.ts` for defaults/presets |
| **Routes** | `/planner` (Dashboard), `/plan` (Plan Beta — goals + readiness), `/past-papers`, `/analytics`, `/subjects`, `/exam-timetable`, `/login`, `/reset-password`, `/` (landing) |
| **Tests** | Vitest + RTL; 5 test files covering dateHelpers, exportUtils, dseLevelEstimator, localStorageService, PastPaperForm |

**Signals:** No `TODO`/`FIXME` in source; no `console.log` debug leftovers; one intentional `console.warn` in cutoff fallback path. Plan page labelled "Beta". `study_goals` exists only in migration, not `schema.sql`. Documentation drift in ARCHITECTURE.md (still references App.tsx-centric init vs DataContext). Guest mode undocumented in docs/.

---

## Priority Checklist

Ranked: do higher items first. Grouped by tier.

### Tier 1 — High impact, low complexity

- [ ] **1. Align `schema.sql` with `study_goals`** — single source of truth for new Supabase projects
- [x] **2. Modal accessibility: focus trap + ARIA dialog pattern** — blocks keyboard users and screen readers today
- [x] **3. Exam timetable in sidebar navigation** — `/exam-timetable` is only reachable from countdown click areas
- [x] **4. Loading state consistency across pages** — PastPapersPage has no initial skeleton; Analytics and Plan differ
- [x] **5. Dropdown accessibility: `aria-expanded` on filter/sort/export** — all three dropdown components lack it
- [x] **8. Fix `hasSubjectCutoffData` vs `estimateDseLevel` year-matching inconsistency** — ⬆️ promoted from Tier 2; silently hides level badges when estimator could still produce a result; this is a bug, not a feature request
- [x] **33. Guest → auth data migration** — *new*: when a guest signs up, their localStorage planner cells and past paper attempts are lost; this is a silent data-loss event on the highest-friction conversion moment
- [ ] **34. Empty state / first-run onboarding** — *new*: a new user on `/planner` sees an empty grid with no subjects and no call-to-action; no other study app ships without a guided first-run flow

### Tier 2 — High impact, medium complexity

- [ ] **6. Planner → Past Papers deep link** — close the plan-to-log loop from session modal
- [ ] **7. Weekly goal visibility on Dashboard** — surface `study_goals` progress on `/planner`
- [ ] **9. Notes UX: preview and expand** — PlannerCell shows "Notes" label only; PastPaperTable truncates to 1 line
- [ ] **10. Weak topics on past paper attempts** — promote `tag` to multi-value, show pills, chart frequency
- [ ] **13. JUPAS-oriented score calculator** — ⬆️ promoted from Tier 3; university admission is the end-goal students optimise for; existing weighting data makes this largely already computable
- [ ] **25. Landing page: surface already-built features** — dark mode, export, mobile UX, and analytics are built but invisible to new visitors
- [x] **26. Subject catalog expansion** — all subjects already in `subject_weighting.json` + cutoff data; VA/MUSIC/PE/etc. fall back to generic cutoffs as intended
- [ ] **28. Past paper bulk import** — CSV/spreadsheet upload to pre-populate attempt history
- [ ] **30. Level trajectory forecast** — ⬆️ promoted from Tier 3; answers "am I on track for May?" — the most common student anxiety; pure client-side regression over existing attempt data

### Tier 3 — High impact, higher complexity

- [ ] **11. Test coverage for critical business logic** — pastPaperGroups, subjectWeighting, markdown parsers are untested
- [ ] **12. Year-over-year level comparison** — contextualise score across cutoff years
- [ ] **14. Next-paper recommendations** — combine matrix gaps + recency + score heuristics
- [ ] **27. Streak counter and habit tracking** — ⬇️ demoted from Tier 2; engagement mechanic, not core study utility; ship after functional gaps are closed
- [ ] **29. Subject-specific dashboards** — differentiated analytics views for calculation-heavy (Math/M2) vs content-heavy (History/Bio) subjects

### Tier 4 — Medium impact, low-medium complexity (code health)

- [ ] **15. goalsApi error handling consistency** — throws wrapped `Error` vs raw Supabase errors in other APIs
- [ ] **16. AnalyticsPage: remove dead `cutoffData` prop** — accepted in interface but never used
- [x] **17. Documentation sync** — ARCHITECTURE.md, DATABASE.md, DEVELOPMENT.md vs actual DataContext + guest mode + study_goals
- [ ] **18. SkeletonLoader semantic markup** — add `aria-busy` / `role="status"` for screen readers
- [ ] **19. ResetPasswordPage: replace string-match error detection** — `!error.includes("Password")` is brittle

### Tier 5 — Long-horizon features

- [ ] **20. Study timer / minutes logged** — optional `minutes_spent` on planner tasks
- [ ] **21. PWA / offline** — installability + cached shell + offline banner
- [ ] **22. SBA tracker** — deadlines and internal assessment tracking per subject
- [ ] **23. Flashcards / quick review** — tied to subjects and later weak topics
- [ ] **24. Shareable read-only views** — public or signed links for planner/analytics snapshots
- [ ] **31. Push notifications / study reminders** — daily/weekly reminders via PWA or browser notification API (depends on #21)
- [ ] **32. Cutoff data for remaining subjects** — source and add historical cutoff data for VA, ENG-LIT, MUSIC, PE, ERS, DAT, TL, HMSC, THS

---

## Improvement Proposals

### 1. Align `schema.sql` with `study_goals`

**What:** Merge definitions from `supabase/migrations/20260310_create_study_goals.sql` into `supabase/schema.sql` (table, RLS policies, index).

**Why:** README instructs developers to run `schema.sql` only. Plan Beta (`/plan`) and `goalsApi` expect `study_goals`; missing table causes runtime failures for fresh environments. `deleteSubjectWithCascade` also silently fails on missing `study_goals`.

**How:**
1. Copy migration DDL into `schema.sql` after `past_paper_attempts` block
2. Use `CREATE TABLE IF NOT EXISTS` for safe re-runs
3. Update README "Supabase Setup" to either mention migrations or state `schema.sql` is the full schema
4. Add `study_goals` row to `docs/DATABASE.md`

**Logic:** Deployment correctness only; no application logic change.

**UI:** None.

**Placement:** `supabase/schema.sql`, `README.md`, `docs/DATABASE.md`.

**Conflicts:** None if migration already applied (idempotent DDL).

---

### 2. Modal accessibility: focus trap + ARIA dialog pattern

**What:** Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (pointing at the title `<h3>`), and a focus trap to `Modal.tsx`. Ensure focus moves into the modal on open and returns to the trigger on close.

**Why:** The modal is the primary editing surface for planner sessions, past paper entries, subject management, and confirmations. Without a focus trap and ARIA roles, keyboard-only and screen reader users cannot reliably interact with the app's core workflows.

**How:**
1. Add `id` to the title `<h3>` and wire `aria-labelledby` on the dialog container
2. Add `role="dialog"` and `aria-modal="true"` to the content `<div>`
3. Implement focus trap: on open, focus first focusable element; on Tab at last element, loop to first; on Shift+Tab at first, loop to last
4. On close, restore focus to the element that was active before open (`document.activeElement` snapshot)

**Logic:** No data or business logic change.

**UI:** No visual change; keyboard and AT behaviour improves.

**Placement:** `src/components/ui/Modal.tsx`, `src/components/ui/ConfirmDialog.tsx` (inherits).

**Conflicts:** Ensure Escape handler and backdrop click still work alongside focus trap. Test with `PlannerPage` modal (largest form), `PastPapersPage` add/edit modal, `SubjectsPage` delete confirm.

---

### 3. Exam timetable in sidebar navigation

**What:** Add `/exam-timetable` as a `NavLink` in the sidebar navigation (desktop and mobile drawer) alongside Planner, Plan, Past Papers, Analytics, and Subjects.

**Why:** Currently reachable only by clicking the countdown card in sidebar/mobile menu. Users who dismiss or overlook the countdown have no path to the timetable page from the main nav.

**How:**
1. Add a `NavLink` entry in the `navItems` list in `Layout.tsx` — position after Analytics or Subjects
2. Use a calendar/clock icon consistent with existing nav icons
3. Keep the countdown card click behaviour as a secondary shortcut

**Logic:** Routing only; no data change.

**UI:** One new nav item in desktop sidebar and mobile drawer.

**Placement:** `src/components/Layout.tsx`.

**Conflicts:** Mobile drawer height may need scroll if nav items grow; test on small screens.

---

### 4. Loading state consistency across pages

**What:** Add initial loading skeletons to `PastPapersPage` and normalise the loading pattern across all data-fetching pages.

**Why:** `AnalyticsPage` shows a pulse skeleton while loading; `PlanPage` shows a text line; `PastPapersPage` renders an empty table with no loading indicator until data arrives. Inconsistency feels unpolished and can confuse users into thinking they have no data.

**How:**
1. Add a `loading` state to `PastPapersPage` (set `true` before `listPastPaperAttempts`, `false` after)
2. Render `SkeletonLoader` or a page-specific skeleton while loading
3. Standardise: all pages that fetch on mount show a skeleton, then content or empty state
4. Consider extracting a `PageSkeleton` variant from `SkeletonLoader` for per-page shapes

**Logic:** No data logic change.

**UI:** Skeleton pulse during initial load on Past Papers; consistent pattern elsewhere.

**Placement:** `src/pages/PastPapersPage.tsx`; review `src/pages/PlanPage.tsx` loading state.

**Conflicts:** None; additive.

---

### 5. Dropdown accessibility: `aria-expanded` on filter/sort/export

**What:** Add `aria-expanded`, `aria-haspopup="listbox"` (or `"menu"`), and `aria-controls` to all three dropdown trigger buttons: `DateFilterDropdown`, `SortDropdown`, `ExportDropdown`.

**Why:** Screen readers cannot convey the open/closed state of these controls. WCAG 2.1 requires `aria-expanded` on buttons that control expandable regions.

**How:**
1. In each dropdown component, add `aria-expanded={isOpen}` and `aria-haspopup="menu"` to the trigger `<Button>`
2. Add an `id` to the dropdown menu `<div>` and reference it via `aria-controls` on the trigger
3. Optionally add `role="menu"` and `role="menuitem"` to the dropdown list and items

**Logic:** No data logic change.

**UI:** No visual change.

**Placement:** `src/components/DateFilterDropdown.tsx`, `src/components/SortDropdown.tsx`, `src/components/ExportDropdown.tsx`.

**Conflicts:** None.

---

### 6. Planner → Past Papers deep link

**What:** In the planner session modal (`PlannerPage`), when a subject is selected and the session is not rest, add a control that navigates to Past Papers with that subject pre-selected and the add-attempt modal opened.

**Why:** Closes the core loop: plan a paper session → log results without manual navigation and subject re-selection.

**How:**
1. Add a tertiary button/link in the session modal (below Notes, visible when `subjectId` is set and `!isRest`)
2. Use `useNavigate` to `/past-papers?prefill_subject=<id>`
3. In `PastPapersPage`, `useSearchParams` + `useEffect` to read `prefill_subject`, set subject filter, call `openAddModal({ subjectId })`, then strip the param
4. Reuse existing `addFormPrefill` / `PastPaperForm` patterns

**Logic:** Query-string handoff only; no new API.

**UI:** Small text link or icon button in planner modal.

**Placement:** `src/pages/PlannerPage.tsx`, `src/pages/PastPapersPage.tsx`.

**Conflicts:** Guard effect to run once per navigation (presence check + param strip).

---

### 7. Weekly goal visibility on Dashboard

**What:** Show current-week `study_goals` progress on the main planner page, or a prominent summary link to `/plan`.

**Why:** Goals are configured on Plan Beta but invisible from the surface students use daily. Reduces context switching and reinforces weekly targets.

**How:**
1. Fetch `listStudyGoals` in `PlannerPage` (or lift to `DataContext` to avoid duplicate fetches if `PlanPage` is open in same session)
2. Compute completed sessions per subject for current Sun–Sat from `cells` (same week logic as `Layout` weekly progress)
3. Render a compact row above the grid: subject chip + `n/target` + thin progress bar
4. Include "Edit targets on Plan →" link

**Logic:** Progress = count of non-rest cells with matching `subjectId` in current week vs `weeklyTarget`.

**UI:** Compact strip; collapsible or dismissible if no goals set.

**Placement:** `src/pages/PlannerPage.tsx`; optionally `src/contexts/DataContext.tsx` if goals are shared.

**Conflicts:** Extra fetch on planner mount; consider caching alongside subjects.

---

### 8. Fix `hasSubjectCutoffData` vs `estimateDseLevel` year-matching inconsistency

**What:** Align `hasSubjectCutoffData` to use the same nearest-year resolution as `getCutoffRowsForYear`.

**Why:** Three UI sites (`PastPaperForm.tsx:66`, `PastPapersPage.tsx:188`, `pastPaperGroups.ts:176`) call `hasSubjectCutoffData` to gate whether to show a level badge. That function requires an **exact year match** (`bySubject[yearToUse] != null`). But `estimateDseLevel` calls `getCutoffRowsForYear` which falls back to the nearest available year. Result: a paper logged for 2022 with only 2024 cutoff data loaded will never show a level badge, even though `estimateDseLevel` would produce a valid result using 2024 cutoffs.

**Exact change — `src/utils/dseLevelEstimator.ts` lines 308–313:**

```ts
// BEFORE (exact match only):
export function hasSubjectCutoffData(
  cutoffData: CutoffData,
  subjectKey: string,
  examYear?: number
): boolean {
  if (Object.keys(cutoffData).length === 0) return false;
  const normalizedKey = resolveCutoffSubjectKey(subjectKey);
  const bySubject = cutoffData[normalizedKey];
  if (!bySubject) return false;
  const yearToUse = examYear ?? new Date().getFullYear();
  return bySubject[yearToUse] != null;          // ← exact match
}

// AFTER (delegate to getCutoffRowsForYear, which already handles nearest-year):
export function hasSubjectCutoffData(
  cutoffData: CutoffData,
  subjectKey: string,
  examYear?: number
): boolean {
  if (Object.keys(cutoffData).length === 0) return false;
  const yearToUse = examYear ?? new Date().getFullYear();
  return getCutoffRowsForYear(subjectKey, yearToUse, cutoffData) != null;
}
```

**Test update — `src/utils/dseLevelEstimator.test.ts` lines 50–54:**

The test fixture only has CHI data for year 2024. After the fix, `hasSubjectCutoffData(cutoffData, "CHI", 2023)` returns `true` (nearest-year fallback to 2024) instead of `false`. Update the test description and assertion to document the new intended behaviour.

**UI shown:** Papers logged for years where we only have adjacent-year cutoffs now display a level badge and marks-to-next-level. Previously those rows showed no level badge at all.

**Placement:** `src/utils/dseLevelEstimator.ts` (1-line logic change), `src/utils/dseLevelEstimator.test.ts` (1 test assertion update).

**Conflicts:** All three callers are already handling `estimateDseLevel` with nearest-year data — showing a badge was the only missing part. No other code paths are affected.

---

### 9. Notes UX: preview and expand

**What:** Study cells: show note content on hover (desktop) or tap popover (mobile) without opening the editor. Past paper rows: toggle to expand notes beyond `line-clamp-1`.

**Why:** `PlannerCell` only shows a "Notes" text indicator without content; past paper notes are aggressively truncated. Faster scanning reduces clicks.

**How:**
1. **PlannerCell:** Add `title={task.notes}` for native tooltip, or a positioned popover with short delay; ensure drag handle still works
2. **PastPaperTable:** Add local `useState` for expanded note attempt IDs; toggle `line-clamp-1` class on click

**Logic:** Pure presentation; no data change.

**UI:** Tooltip/popover on planner cells; expand/collapse on past paper notes.

**Placement:** `src/components/PlannerCell.tsx`, `src/components/PastPaperTable.tsx`.

**Conflicts:** DnD on PlannerCell: avoid capturing pointer events on tooltip trigger.

---

### 10. Weak topics on past paper attempts

**What:** Allow multiple weak-topic labels per attempt, persist them, display on list cards, and aggregate frequency in Analytics.

**Why:** Single `tag` text field is too limited for targeted revision. Topic frequency analysis drives the app's core study-planning purpose.

**How:**
1. DB migration: `tag text` → `tags text[]` (with `USING ARRAY[tag]` for backfill of existing rows)
2. Update `PastPaperAttempt` type in `src/types.ts`
3. Update `pastPapersApi` mapping (snake_case `tags` → camelCase `tags`)
4. Replace text input with `TagInput` in `PastPaperForm`
5. Show tag pills on `PastPaperTable` cards
6. Add topic frequency chart section on `AnalyticsPage` (simple `reduce` + Recharts bar)
7. Update guest `localStorageService` schema

**Logic:** Free-text tags; optional trim/lowercase normalisation for grouping.

**UI:** Pills on cards; new chart section on Analytics.

**Placement:** `supabase/` migration, `src/types.ts`, `src/lib/api/pastPapersApi.ts`, `src/components/PastPaperForm.tsx`, `src/components/PastPaperTable.tsx`, `src/pages/AnalyticsPage.tsx`.

**Conflicts:** Existing rows need backfill migration. Guest localStorage data shape changes (version or migrate on load).

---

### 11. Test coverage for critical business logic

**What:** Add unit tests for the three highest-risk untested modules: `pastPaperGroups.ts`, `subjectWeighting.ts`, and the markdown parsing functions in `dseLevelEstimator.ts`.

**Why:** These modules contain the app's core domain logic (paper grouping, weighted scoring, cutoff parsing). Any regression here silently corrupts level estimations and analytics. Currently zero test coverage.

**How:**
1. `pastPaperGroups.test.ts`: test `buildSortedPastPaperGroups` with multi-paper subjects, single attempts, missing papers, weighted % computation, sort orders
2. `subjectWeighting.test.ts`: test `getSubjectWeightingFromJson`, `attemptMatchesFormalPaper`, `paperSlotKey` with M1/M2 edge cases, alias resolution
3. `dseLevelEstimator.test.ts` (extend): test `parseHkdseCutoffMarkdown`, `parseHkdseElectiveCutoffMarkdown` with sample markdown fragments, `loadCutoffData` with mocked fetch, `getGenericCutoffs`
4. Optionally add coverage thresholds in `vite.config.ts`

**Logic:** Test-only; no production code change unless bugs are found.

**UI:** None.

**Placement:** `src/utils/pastPaperGroups.test.ts` (new), `src/utils/subjectWeighting.test.ts` (new), `src/utils/dseLevelEstimator.test.ts` (extend).

**Conflicts:** None; additive.

---

### 12. Year-over-year level comparison

**What:** For a given subject and percentage, show how `estimateDseLevel` classifies that score across all years present in `cutoffData`.

**Why:** Cutoffs move with cohort difficulty; students misread a single year's level as a measure of absolute ability. Comparison provides context.

**How:**
1. Iterate years in `cutoffData[subjectKey]`, call existing `estimateDseLevel` for each
2. Present as a small comparison table or Recharts heat strip on `AnalyticsPage`
3. Optionally add tooltip from level badges on Past Papers ("In 2023 this would be Level 4")

**Logic:** Read-only transformation of in-memory cutoff map.

**UI:** New section on Analytics; optional tooltip enhancement on Past Papers.

**Placement:** `src/pages/AnalyticsPage.tsx`, reuse `src/utils/dseLevelEstimator.ts`.

**Conflicts:** Performance: limit to subjects with actual attempts.

---

### 13. JUPAS-oriented score calculator

**What:** UI to combine best subject levels into a weighted total using common university admission heuristics (best-5, best-6).

**Why:** University admission is the long-term outcome students optimise for; complements the in-app level estimation.

**How:**
1. Map DSE levels to JUPAS points (standard scale: U=0, 1=1, ..., 5=5, 5*=6, 5**=7)
2. Allow programme presets or custom weights
3. Reuse `getSubjectWeightingFromJson` / `subject_weighting.json` where it aligns with JUPAS category logic
4. Add UI disclaimer: "unofficial estimate"

**Logic:** Deterministic arithmetic; no server requirement for v1.

**UI:** New section on Analytics or dedicated route `/jupas`.

**Placement:** New `src/utils/jupasCalculator.ts`, page or section component, route in `App.tsx` if standalone.

**Conflicts:** Legal/clarity: label as unofficial estimate, not HKEAA/JUPAS official.

---

### 14. Next-paper recommendations

**What:** A card on Past Papers suggesting papers to attempt next, using matrix gaps, recency, and score heuristics.

**Why:** Turns existing matrix and history into actionable guidance; reduces decision fatigue.

**How:**
1. Pure client-side over `attempts` + subjects' `paperLabels` / weighting config
2. Rank with a simple score: gap bonus (missing required papers from matrix) + weakness bonus (low recent scores) + recency penalty (recently attempted)
3. Reuse `getMissingRequiredPaperLabels` patterns from `pastPaperGroups.ts`
4. CTA pre-fills the add-attempt modal

**Logic:** Heuristic ranking; tunable constants in one file.

**UI:** Card above filters or below matrix toggle on Past Papers.

**Placement:** `src/pages/PastPapersPage.tsx`, new `src/utils/pastPaperRecommendations.ts`.

**Conflicts:** Keep separate from export/filter state; read-only suggestion.

---

### 15. goalsApi error handling consistency

**What:** Align `goalsApi` error throwing pattern with the rest of the API layer (`subjectsApi`, `plannerApi`, `pastPapersApi`).

**Why:** `goalsApi` wraps errors in `new Error("Failed to ...")` while other APIs throw the raw Supabase error object. Callers that branch on error type/shape get inconsistent results. `PlanPage` catches errors but only `console.error`s them — no toast/banner.

**How:**
1. Remove the `new Error(...)` wrapping in `goalsApi`; throw `data.error` directly like other APIs
2. In `PlanPage`, surface goal save failures via `dataError` state or a toast (not just `console.error`)

**Logic:** Error shape alignment.

**UI:** User sees save failure feedback on Plan page.

**Placement:** `src/lib/api/goalsApi.ts`, `src/pages/PlanPage.tsx`.

**Conflicts:** Any code catching `goalsApi` errors by message string needs updating.

---

### 16. AnalyticsPage: remove dead `cutoffData` prop

**What:** Remove `cutoffData: CutoffData` from `AnalyticsPageProps` — it is declared and passed but never used inside the component.

**Why:** Dead code increases maintenance cost and misleads future developers into thinking Analytics uses cutoff data directly.

**How:**
1. Remove `cutoffData` from `AnalyticsPageProps` interface
2. Remove it from the destructured props
3. Remove the prop from the call site in `App.tsx`

**Logic:** No behaviour change.

**UI:** None.

**Placement:** `src/pages/AnalyticsPage.tsx`, `src/App.tsx`.

**Conflicts:** None; purely subtractive.

---

### 17. Documentation sync

**What:** Update `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, and `docs/DEVELOPMENT.md` to reflect the current state of the codebase.

**Why:** Docs describe an older App.tsx-centric init model. `DataContext` now owns session, subjects, cells, cutoffs, and guest mode. `study_goals` and `is_done` on planner cells are undocumented. Guest mode is entirely absent from docs.

**How:**
1. **ARCHITECTURE.md:** Replace App.tsx init description with DataContext bootstrap; document guest mode flow; update route table to include LandingPage and guest paths
2. **DATABASE.md:** Add `study_goals` table; document `planner_cells.is_done`; mention guest localStorage schema
3. **DEVELOPMENT.md:** Add guest mode workflow; mention `study_goals` migration requirement; update troubleshooting for guest data issues

**Logic:** Documentation only.

**UI:** None.

**Placement:** `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/DEVELOPMENT.md`.

**Conflicts:** None.

---

### 18. SkeletonLoader semantic markup

**What:** Add `aria-busy="true"` and `role="status"` to the skeleton container so screen readers announce that content is loading.

**Why:** Currently, screen readers get silence during loading — no indication that content is incoming.

**How:**
1. Add `role="status"` and `aria-busy="true"` to the outermost `<div>` in `SkeletonLoader`
2. Add a visually hidden `<span>` with "Loading..." for AT announcement

**Logic:** No data change.

**UI:** No visual change.

**Placement:** `src/components/SkeletonLoader.tsx`.

**Conflicts:** None.

---

### 19. ResetPasswordPage: replace string-match error detection

**What:** Replace `!error.includes("Password")` with an explicit error code or a structured error type to decide which error view to show.

**Why:** The current approach matches against the error message string. If Supabase changes error wording, or the message is localised, the branching logic breaks silently and shows the wrong recovery UI.

**How:**
1. Catch the Supabase error object and check its `code` or `status` field instead of the message
2. Use a separate `errorType: "session" | "password" | null` state to drive which view renders
3. Fallback to "session" error type for unknown errors (safe default: user can retry the reset link)

**Logic:** Error classification logic change.

**UI:** Same views, more reliable routing between them.

**Placement:** `src/pages/ResetPasswordPage.tsx`.

**Conflicts:** None; self-contained.

---

### 20. Study timer / minutes logged

**What:** Optional `minutes_spent` field on planner tasks; timer widget in session modal.

**Why:** Time tracking turns the planner from a to-do list into a revision log; data feeds analytics for hours-per-subject insights.

**How:** DB migration to add `minutes_spent integer` to `planner_cells`. UI: timer start/stop in planner modal; manual entry fallback. Analytics: aggregate by subject/week.

**Placement:** `supabase/` migration, `src/types.ts`, `src/lib/api/plannerApi.ts`, `src/pages/PlannerPage.tsx`, `src/pages/AnalyticsPage.tsx`.

---

### 21. PWA / offline

**What:** Service worker, web app manifest, cached shell, offline banner.

**Why:** Students study in transit with inconsistent connectivity. Installability increases daily usage.

**How:** Vite PWA plugin (`vite-plugin-pwa`); cache static assets + cutoff files; queue API writes for sync. Offline banner component.

**Placement:** `vite.config.ts`, `public/manifest.json`, new `src/components/OfflineBanner.tsx`.

---

### 22. SBA tracker

**What:** School-Based Assessment deadlines and internal assessment tracking per subject.

**Why:** SBA contributes to the final DSE grade but has separate timelines students often miss.

**How:** New DB table `sba_entries`; CRUD UI on Subjects page or dedicated section; countdown integration with exam timetable.

**Placement:** `supabase/` migration, new `src/lib/api/sbaApi.ts`, `src/pages/SubjectsPage.tsx` or new page.

---

### 23. Flashcards / quick review

**What:** Simple flashcard deck tied to subjects (and later weak topics from proposal #10).

**Why:** Active recall is the most effective revision technique; tying flashcards to past-paper weak spots closes the feedback loop.

**How:** New DB table or localStorage-only for v1. Spaced repetition optional. Subject-coloured cards.

**Placement:** New route `/flashcards`, new page + components.

---

### 24. Shareable read-only views

**What:** Public or signed links for planner/analytics snapshots.

**Why:** Students share progress with tutors/parents; teachers can review without accounts.

**How:** Supabase storage for static exports, or server-rendered snapshot endpoint. Signed URLs with expiry.

**Placement:** New API endpoint or Supabase Edge Function; share button on relevant pages.

---

### 25. Landing page: surface already-built features

**What:** Update the landing page to clearly communicate features that are already shipped but invisible to new visitors: dark mode, CSV export, mobile-optimised layout, and the full analytics suite (trends, distribution, marks-to-next-level).

**Why:** External reviewers flagged dark mode and export as missing gaps — they are both implemented. The landing page shows feature previews but does not call these out, so potential users dismiss the app before discovering them. This is a marketing/discoverability problem, not a feature gap.

**How:**
1. Add a "What's included" feature grid or icon strip on the landing page calling out dark mode, export, mobile support, and analytics
2. Ensure the live demo / preview screenshots reflect the dark mode and export UI
3. Add tooltips or badges (e.g. "Included" / "Free") to reduce perceived uncertainty for new visitors

**Logic:** No application logic change.

**UI:** Landing page copy and feature grid update.

**Placement:** `src/pages/LandingPage.tsx` (or equivalent landing route component).

**Conflicts:** None.

---


### 27. Streak counter and habit tracking

**What:** Track consecutive days with at least one completed planner session and display the current streak on the Dashboard.

**Why:** Streak mechanics are one of the highest-engagement features in study apps (Duolingo, Anki). A visible streak on the daily-use Dashboard creates a low-cost habit loop without requiring new content or AI. Complements the existing weekly goal strip (proposal #7).

**How:**
1. Derive streak client-side from `cells` data already in context: walk backward from today counting days with at least one `is_done` cell
2. Store streak start date or last active date in `localStorage` (guest) or a `user_stats` column (authenticated) to avoid recomputing on every load
3. Render a compact streak indicator (flame icon + count) in the Dashboard header or sidebar
4. Reset streak to 0 if no completed session yesterday; show "streak at risk" warning if none today

**Logic:** Streak = count of consecutive calendar days (ending today) with `is_done` cells. No new API needed for guest mode; single column for auth.

**UI:** Small streak chip on Dashboard; optional "at risk" highlight if today has no completions.

**Placement:** `src/pages/PlannerPage.tsx`, optionally `src/contexts/DataContext.tsx` for shared derivation.

**Conflicts:** Ensure streak calculation uses local timezone (same as existing week logic).

---

### 28. Past paper bulk import

**What:** Allow users to upload a CSV file to pre-populate `past_paper_attempts` without entering each attempt manually.

**Why:** Students switching from spreadsheets or other apps have months of historical data. Manual re-entry is a major adoption barrier. This is the inverse of the existing export feature.

**How:**
1. Define a simple CSV schema matching the export format (subject, year, paper, score, max score, date, notes)
2. Add an "Import CSV" button alongside the existing export controls on Past Papers
3. Parse the CSV client-side (no server round-trip); validate rows and surface errors per row
4. Preview parsed rows before committing; bulk-insert via `pastPapersApi`
5. Reuse the export format so import/export are symmetric

**Logic:** Client-side CSV parse + batch API insert. Map CSV headers to `PastPaperAttempt` fields; reject rows with missing required fields.

**UI:** Import button → file picker → preview table → confirm → toast with insert count.

**Placement:** `src/pages/PastPapersPage.tsx`, reuse `src/utils/exportUtils.ts` schema for symmetry, new `src/utils/importUtils.ts`.

**Conflicts:** Guest mode: import must write to localStorage via `localStorageService`. Cap single import at a reasonable row limit (e.g. 500) to avoid UI freeze.

---

### 29. Subject-specific dashboards

**What:** On the Analytics page, offer a per-subject detail view that adapts its layout based on whether the subject is calculation-heavy (Math, M1, M2, Physics, Chem) or content-heavy (History, Bio, Geography, Economics).

**Why:** Aggregated analytics obscure subject-specific patterns. A Math student needs to see score distribution by paper component and marks-to-next-level trends; a History student benefits more from topic coverage heatmaps and time-per-paper trends. One-size analytics undersell the depth of the existing data.

**How:**
1. Add a `subjectType: "calculation" | "content" | "language"` field to subject catalog entries
2. On Analytics, add a subject selector; render a subject-detail panel below the existing summary
3. Calculation view: paper-by-paper score breakdown, component weighting visualisation, marks-to-next-level per paper
4. Content view: topic/tag frequency (feeds from proposal #10), attempt cadence, average level trend
5. Language view (English, Chinese): paper-component breakdown (reading/writing/listening)

**Logic:** Data derivation from existing `attempts` + `subjectWeighting` config; `subjectType` drives conditional rendering.

**UI:** Subject selector + conditional panel on `AnalyticsPage`; no new routes required for v1.

**Placement:** `src/pages/AnalyticsPage.tsx`, `src/subjectCatalog.ts` (add `subjectType`), `src/utils/subjectWeighting.ts`.

**Conflicts:** Requires proposal #10 (tags) for full content-view usefulness; ship calculation view first as it needs no new data.

---

### 30. Level trajectory forecast

**What:** Project a student's likely DSE level at exam time based on the trend in their recent past paper scores, displayed as a simple forecast line on Analytics.

**Why:** Students want to know if they are on track, not just where they are now. A trajectory line turns historical data into actionable motivation — it answers "if I keep improving at this rate, where will I be in May?" which no current feature addresses.

**How:**
1. For each subject with ≥ 3 attempts, fit a linear regression over `(attemptDate, percentage)` using least squares (simple client-side arithmetic; no library needed)
2. Project the regression line forward to the exam date (from exam timetable data already in app)
3. Map the projected percentage to a DSE level using the nearest available cutoff year
4. Display as a dashed extension of the score trend line on the existing Recharts line chart, with a level badge at the projected endpoint
5. Add a confidence indicator (e.g. "based on N attempts") and a disclaimer for low sample sizes

**Logic:** Linear regression + existing `estimateDseLevel`; entirely client-side. Clamp projected percentage to [0, 100].

**UI:** Dashed forecast segment on existing trend chart; projected level badge; small "forecast" label.

**Placement:** `src/pages/AnalyticsPage.tsx`, new `src/utils/trendForecast.ts`.

**Conflicts:** Only meaningful with ≥ 3 attempts; hide forecast for sparse data. Exam date required — falls back gracefully if timetable data not loaded.

---

### 32. Cutoff data for remaining subjects

**What:** Source and add historical HKDSE cutoff data (2012–2025) for the subjects currently in the catalog without subject-specific cutoffs: Visual Arts (VA), Literature in English (ENG-LIT), Music (MUSIC), Physical Education (PE), Ethics and Religious Studies (ERS), Design and Applied Technology (DAT), Technology and Living (TL), Health Management and Social Care (HMSC), and Tourism and Hospitality Studies (THS).

**Why:** These subjects fall back to generic cutoffs (5**=90%, 5*=80%, etc.) which are inaccurate for most of them. VA and PE in particular have very different real cutoff distributions. Students taking these subjects get misleading level estimates.

**How:**
1. Source cutoff percentages from [dse00.com](https://www.dse00.com) or HKEAA published statistics for each subject
2. Add each subject as a new `### Subject Name` section in `public/dse-cutoffs-electives.md` following the existing table format
3. Add the heading-to-code mapping in `ELECTIVE_HEADING_TO_CODE` in `src/utils/dseLevelEstimator.ts` for each new subject
4. Verify `hasSubjectCutoffData` and `estimateDseLevel` return correct results for a sample percentage

**Logic:** Purely additive data; no code change beyond the heading mappings in `dseLevelEstimator.ts`.

**UI:** Level badges appear on Past Papers and Analytics for these subjects instead of generic estimates.

**Placement:** `public/dse-cutoffs-electives.md`, `src/utils/dseLevelEstimator.ts`.

**Conflicts:** None; additive.

---

### 33. Guest → auth data migration (mostly built — wire the toast)

**What:** `DataContext.tsx:247` already implements `migrateGuestDataToAccount` which migrates subjects, planner cells, past paper attempts, and goals. The remaining gap is user feedback: there is no toast or confirmation when migration completes, and no handling of the case where the user signs into an *existing* account that already has data (silent merge, no prompt).

**Why:** The sign-up moment is the highest-friction conversion point. The silent migration currently works but users don't know it happened — they may distrust the app thinking their data was lost.

**How:**
1. After `migrateGuestDataToAccount` resolves, fire a toast: "Your guest data has been saved to your account" with a count ("3 sessions, 12 past papers migrated")
2. Before migrating, check if the target account already has cells or attempts; if so, show a brief prompt: "You already have data on this account — your guest data will be merged" (one confirm tap; don't block with complex conflict UI for v1)
3. On migration error, catch and show an error toast with a "retry" action rather than silent swallow

**Logic:** `migrateGuestDataToAccount` already does the heavy lifting; this is purely UX wiring around it.

**Placement:** Where `migrateGuestDataToAccount` is called (auth flow in `DataContext.tsx` or the sign-in page), plus a toast utility call.

---

### 34. First-run onboarding: stream preset picker + planner tip

**What:** On first visit, show a one-step modal that lets the user pick a subject stream preset to add all relevant electives in one tap. Add a dismissible tip banner on the planner explaining how the grid works.

**Important context:** `DataContext.tsx:171–197` already auto-seeds CHI, ENG, MATH, C&SD for every new user (guest and auth), so the grid is never truly empty. The gap is that users arrive with 4 core subjects and no guidance to add electives, and the grid UI gives no hint that cells are clickable.

**What to show:**

*Step 1 — Stream preset modal (fires once on first load, flagged by `localStorage` key `onboarding_stream_picked`):*

```
┌─────────────────────────────────────────────┐
│  Welcome to LevelUp DSE Planner             │
│                                             │
│  Pick your subject stream to add your       │
│  electives automatically. You can always    │
│  change subjects later.                     │
│                                             │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐  │
│  │ Science  │ │ Humanities │ │ Business │  │
│  │ Bio/Chem │ │ Hist/Geog  │ │ BAFS/Econ│  │
│  │ Phy/M1   │ │ CHI-HIST   │ │ ICT      │  │
│  └──────────┘ └────────────┘ └──────────┘  │
│                                             │
│  [Skip — I'll add subjects manually]        │
└─────────────────────────────────────────────┘
```

Each card shows the 3–4 subject codes that will be added. Tapping a card calls `addSubject` for each elective (subjects already seeded are skipped by code-match check). Dismiss sets the flag.

*Step 2 — Planner tip banner (shown until dismissed, flagged by `localStorage` key `onboarding_planner_tip`):*

```
┌─────────────────────────────────────────────────┐
│  💡 Tap any cell to plan a study session.       │
│     Drag to reschedule. Mark ✓ when done.  [×]  │
└─────────────────────────────────────────────────┘
```

Renders above the week grid in `PlannerPage`. Single dismiss stores flag, never shown again.

**Stream preset data** (define as a constant, not in `subjectCatalog.ts`):

```ts
const STREAM_PRESETS = {
  Science:     ["PHY", "CHEM", "BIO", "M1"],
  Humanities:  ["HIST", "GEOG", "CHI-HIST", "CHI-LIT"],
  Business:    ["ECON", "BAFS", "ICT"],
} as const;
```

**Logic:** Both flags live in `localStorage` and work identically for guest and auth. No API calls added; `addSubject` already handles the upsert.

**Placement:**
- New `src/components/OnboardingStreamModal.tsx` — stream picker modal
- `src/views/PlannerPage.tsx` — mount modal + render tip banner
- No changes needed to `DataContext`, `subjectCatalog.ts`, or any API

**Conflicts:** Check if `addSubject` deduplicates by code before inserting; if not, add a `subjects.some(s => s.shortCode === code)` guard in the preset handler.

---

### 31. Push notifications / study reminders

**What:** Allow users to opt into daily or weekly browser notifications reminding them to log a study session or complete a planned paper.

**Why:** Habit formation requires external triggers. Students who plan well but forget to open the app derive no benefit from their plans. Reminders close the intention–action gap that planners alone cannot bridge.

**How:**
1. Use the browser Notification API (no server required for v1); request permission on opt-in only
2. Schedule reminders via `setTimeout`/`setInterval` while the app is open, or via a Service Worker background sync (requires proposal #21 PWA)
3. Allow users to configure reminder time and frequency in a settings panel
4. Reminder content: "You have N sessions planned for today" or "You haven't logged any papers this week"
5. For full reliability (app closed), this depends on PWA (#21) with a registered Service Worker

**Logic:** Notification API + Service Worker for background delivery. No server round-trip for v1.

**UI:** Opt-in toggle in settings; notification permission prompt on first enable.

**Placement:** New `src/utils/notifications.ts`; settings UI in `src/pages/SubjectsPage.tsx` or a new `/settings` route.

**Conflicts:** Depends on #21 (PWA) for background delivery when app is closed. Browser support varies; degrade gracefully.

---

## Completed / Recently Addressed

- [x] Error banners for cutoff load failures, planner cell load failures (`App.tsx` + `Layout` + `ErrorBanner`)
- [x] Profile load failure indicator (`Layout.tsx` — `profileWarning`)
- [x] Centralised time/colour/cutoff/password constants (`src/constants.ts`)
- [x] Skeleton loading shell (`SkeletonLoader`, used from `App.tsx`)
- [x] Removed unused `Badge.tsx`; `CutoffData` simplified; `goalsApi` integrated on Plan Beta
- [x] Plan Beta (`/plan`): weekly targets via `study_goals`, donuts, readiness, priority queue
- [x] Subject catalog + `subject_weighting.json` integration for paper weights / formal labels
- [x] Past papers: sort, date filters, export, paper matrix, grouped table, delete with confirm
- [x] Analytics: trends, distribution, marks-to-next-level; dark mode; password reset; exam timetable + countdown
- [x] In-app confirm dialog + toast notifications (`ConfirmContext`, `ToastContext`, `ConfirmDialog`, `ToastStack`)
- [x] Plan Beta visible load errors (`ErrorBanner` + `dataError` state in `PlanPage.tsx`)
- [x] Documentation sync for `/plan`, `study_goals`, `subject_weighting.json`, and exam timetable navigation
- [x] Vitest + RTL baseline (Vitest config, jsdom setup, util tests, `PastPaperForm` flow test)
- [x] Guest mode with localStorage persistence and migration to authenticated account
- [x] Landing page with feature previews and CTAs
- [x] Subject catalog expansion — all DSE electives (PHY, ECON, GEOG, BAFS, ICT, CHI-HIST, HIST, CHI-LIT, VA, MUSIC, PE, ENG-LIT, ERS, DAT, TL, HMSC, THS, M1, M2) present in weighting + catalog; core electives have cutoff data; others fall back to generic cutoffs

---

## Suggested Build Order

1. `study_goals` in `schema.sql` + README note
2. Modal a11y (focus trap + ARIA) + dropdown `aria-expanded`
3. Exam timetable sidebar nav + loading state consistency
4. Landing page feature showcase (#25) — quick win, surfaces existing work
5. Planner → Past Papers deep link
6. Dashboard goal strip + streak counter (#27)
7. `hasSubjectCutoffData` year-matching fix
8. Notes preview / expand
9. Subject catalog expansion (#26) — high adoption impact, mostly data work
10. Weak topics (schema + UI + chart)
11. Test coverage expansion
12. Past paper bulk import (#28)
13. Next-paper recommendations
14. Year-over-year comparison + JUPAS calculator
15. Subject-specific dashboards (#29) + level trajectory forecast (#30)
16. Code health (goalsApi errors, dead prop, doc sync, skeleton a11y, reset page error detection)
17. Longer-horizon: timer, PWA (#21), push notifications (#31, depends on PWA), SBA, flashcards, sharing
18. Remaining subject cutoff data (#32) — data sourcing task, add when data is available
