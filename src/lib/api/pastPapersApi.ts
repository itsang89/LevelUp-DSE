import type { PastPaperAttempt } from "../../types";
import { getSupabaseClient } from "../supabase";

interface PastPaperAttemptRow {
  id: string;
  subject_id: string;
  exam_year: number;
  paper_label: string;
  date: string;
  score: number;
  total: number;
  percentage: number;
  estimated_level: string;
  tag: string | null;
  notes: string | null;
}

function toPastPaperAttempt(row: PastPaperAttemptRow): PastPaperAttempt {
  return {
    id: row.id,
    subjectId: row.subject_id,
    examYear: row.exam_year,
    paperLabel: row.paper_label,
    date: row.date,
    score: row.score,
    total: row.total,
    percentage: row.percentage,
    estimatedLevel: row.estimated_level,
    tag: row.tag ?? undefined,
    notes: row.notes ?? undefined,
  };
}

export async function listPastPaperAttempts(userId: string): Promise<PastPaperAttempt[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("past_paper_attempts")
    .select("id,subject_id,exam_year,paper_label,date,score,total,percentage,estimated_level,tag,notes")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as PastPaperAttemptRow[]).map(toPastPaperAttempt);
}

export async function createPastPaperAttempt(userId: string, attempt: PastPaperAttempt): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("past_paper_attempts").insert({
    user_id: userId,
    id: attempt.id,
    subject_id: attempt.subjectId,
    exam_year: attempt.examYear,
    paper_label: attempt.paperLabel,
    date: attempt.date,
    score: attempt.score,
    total: attempt.total,
    percentage: attempt.percentage,
    estimated_level: attempt.estimatedLevel,
    tag: attempt.tag ?? null,
    notes: attempt.notes ?? null,
  });

  if (error) {
    throw error;
  }
}

export async function updatePastPaperAttempt(userId: string, attempt: PastPaperAttempt): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("past_paper_attempts")
    .update({
      subject_id: attempt.subjectId,
      exam_year: attempt.examYear,
      paper_label: attempt.paperLabel,
      date: attempt.date,
      score: attempt.score,
      total: attempt.total,
      percentage: attempt.percentage,
      estimated_level: attempt.estimatedLevel,
      tag: attempt.tag ?? null,
      notes: attempt.notes ?? null,
    })
    .eq("user_id", userId)
    .eq("id", attempt.id);

  if (error) {
    throw error;
  }
}

export async function deletePastPaperAttempt(userId: string, attemptId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("past_paper_attempts")
    .delete()
    .eq("user_id", userId)
    .eq("id", attemptId);

  if (error) {
    throw error;
  }
}
