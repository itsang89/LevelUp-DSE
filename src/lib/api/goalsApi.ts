import { getSupabaseClient } from "../supabase";

export interface StudyGoal {
  id: string;
  subjectId: string;
  weeklyTarget: number;
}

interface StudyGoalRow {
  id: string;
  subject_id: string;
  weekly_target: number;
}

export async function listStudyGoals(userId: string): Promise<StudyGoal[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("study_goals")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to list study goals: ${error.message}`);
  }

  return (data as StudyGoalRow[] || []).map((row) => ({
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

  return {
    id: (data as StudyGoalRow).id,
    subjectId: (data as StudyGoalRow).subject_id,
    weeklyTarget: (data as StudyGoalRow).weekly_target,
  };
}
