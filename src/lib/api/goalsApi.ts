import type { StudyGoal } from "../../types";
import { getSupabaseClient } from "../supabase";

export async function listStudyGoals(userId: string): Promise<StudyGoal[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("study_goals")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to list study goals: ${error.message}`);
  }

  return ((data ?? []) as Array<{ id: string; subject_id: string; weekly_target: number }>).map((row) => ({
    id: row.id,
    subjectId: row.subject_id,
    weeklyTarget: row.weekly_target,
  }));
}

export async function upsertStudyGoal(
  userId: string,
  subjectId: string,
  weeklyTarget: number
): Promise<StudyGoal> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("study_goals")
    .upsert(
      {
        user_id: userId,
        subject_id: subjectId,
        weekly_target: weeklyTarget,
      },
      { onConflict: "user_id,subject_id" }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert study goal: ${error.message}`);
  }

  if (!data) {
    throw new Error("Failed to upsert study goal: no data returned");
  }

  const row = data as { id: string; subject_id: string; weekly_target: number };
  return { id: row.id, subjectId: row.subject_id, weeklyTarget: row.weekly_target };
}