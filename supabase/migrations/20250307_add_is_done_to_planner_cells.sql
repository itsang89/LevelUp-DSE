-- Add is_done column for marking planner sessions as completed
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Required for "Mark as done" and weekly study rate analytics

ALTER TABLE public.planner_cells
ADD COLUMN IF NOT EXISTS is_done boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.planner_cells.is_done IS 'true = session completed by student, false = planned but not yet done';
