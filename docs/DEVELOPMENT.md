# Development Guide

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase project (URL + anon key)

## First-Time Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env`:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

3. Initialize database by running `supabase/schema.sql` in Supabase SQL editor.

4. Start app:

```bash
npm run dev
```

## Build and Quality

- `npm run lint`: ESLint checks
- `npm run build`: Type-check + production build
- `npm run preview`: Run built app locally

## Common Workflows

### Add a New Subject Field

1. Update `src/types.ts` `Subject` type.
2. Update DB schema (`supabase/schema.sql`) and migrate in Supabase.
3. Update mapping in `src/lib/api/subjectsApi.ts`.
4. Update form/UI in `src/pages/SubjectsPage.tsx`.

### Add a New Planner Session Slot

1. Add item to `PLANNER_SESSIONS` in `src/constants.ts`.
2. Verify `PlannerGrid` rendering and modal editor behavior in `src/pages/PlannerPage.tsx`.

### Modify DSE Level Mapping

1. Update `public/dse-cutoffs.md` with subject table rows, or
2. Adjust generic fallback in `src/utils/dseLevelEstimator.ts`.

## Troubleshooting

### "Supabase setup required" screen

Cause: missing env values.

Fix: check `.env` values and restart dev server.

### Authentication works but data fails

Cause: schema or RLS policies not applied.

Fix: re-run `supabase/schema.sql` and confirm policies exist for all three tables.

### Cutoff warning appears in Past Papers page

Cause: markdown fetch/parse failure.

Fix: verify `public/dse-cutoffs.md` exists and headings follow `## Subject Name (CODE)`.
