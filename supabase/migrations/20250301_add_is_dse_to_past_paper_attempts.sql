-- Add is_dse column for paper type (DSE past paper vs Other/mock)
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Required for "Other/mock" past paper entries to sync correctly

ALTER TABLE public.past_paper_attempts
ADD COLUMN IF NOT EXISTS is_dse boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.past_paper_attempts.is_dse IS 'true = DSE past paper (grade from cutoff data), false = Other/mock (manual grade)';
