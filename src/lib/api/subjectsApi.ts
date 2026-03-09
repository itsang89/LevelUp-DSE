import type { Subject } from "../../types";
import { getSupabaseClient } from "../supabase";

interface SubjectRow {
  id: string;
  user_id: string;
  name: string;
  short_code: string;
  base_color: string;
  paper_labels: string[];
}

function toSubject(row: SubjectRow): Subject {
  return {
    id: row.id,
    name: row.name,
    shortCode: row.short_code,
    baseColor: row.base_color,
    paperLabels: row.paper_labels || [],
  };
}

export async function listSubjects(userId: string): Promise<Subject[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("subjects")
    .select("id,user_id,name,short_code,base_color,paper_labels")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as SubjectRow[]).map(toSubject);
}

export async function seedDefaultSubjects(userId: string, subjects: Subject[]): Promise<void> {
  const supabase = getSupabaseClient();
  const rows = subjects.map((subject) => ({
    id: subject.id,
    user_id: userId,
    name: subject.name,
    short_code: subject.shortCode,
    base_color: subject.baseColor,
    paper_labels: subject.paperLabels || [],
  }));

  const { error } = await supabase
    .from("subjects")
    .upsert(rows, { onConflict: "user_id,id", ignoreDuplicates: true });

  if (error) {
    throw error;
  }
}

export async function createSubject(userId: string, subject: Subject): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("subjects").insert({
    id: subject.id,
    user_id: userId,
    name: subject.name,
    short_code: subject.shortCode,
    base_color: subject.baseColor,
    paper_labels: subject.paperLabels || [],
  });

  if (error) {
    throw error;
  }
}

export async function updateSubject(userId: string, subjectId: string, subject: Subject): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("subjects")
    .update({
      name: subject.name,
      short_code: subject.shortCode,
      base_color: subject.baseColor,
      paper_labels: subject.paperLabels || [],
    })
    .eq("user_id", userId)
    .eq("id", subjectId);

  if (error) {
    throw error;
  }
}

export interface SubjectDeletionImpact {
  plannerCellsCount: number;
  pastPaperAttemptsCount: number;
  studyGoalsCount: number;
}

/** Returns counts of dependent records that would be removed when deleting a subject. */
export async function getSubjectDeletionImpact(
  userId: string,
  subjectId: string
): Promise<SubjectDeletionImpact> {
  const supabase = getSupabaseClient();

  const [plannerResult, pastPapersResult] = await Promise.all([
    supabase
      .from("planner_cells")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("subject_id", subjectId),
    supabase
      .from("past_paper_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("subject_id", subjectId),
  ]);

  let studyGoalsCount = 0;
  const studyGoalsResult = await supabase
    .from("study_goals")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("subject_id", subjectId);
  if (!studyGoalsResult.error) {
    studyGoalsCount = studyGoalsResult.count ?? 0;
  }

  return {
    plannerCellsCount: plannerResult.count ?? 0,
    pastPaperAttemptsCount: pastPapersResult.count ?? 0,
    studyGoalsCount,
  };
}

/** Deletes a subject and all dependent planner cells, past paper attempts, and study goals. */
export async function deleteSubjectWithCascade(userId: string, subjectId: string): Promise<void> {
  const supabase = getSupabaseClient();

  await supabase
    .from("planner_cells")
    .delete()
    .eq("user_id", userId)
    .eq("subject_id", subjectId);

  await supabase
    .from("past_paper_attempts")
    .delete()
    .eq("user_id", userId)
    .eq("subject_id", subjectId);

  const goalsResult = await supabase
    .from("study_goals")
    .delete()
    .eq("user_id", userId)
    .eq("subject_id", subjectId);
  if (goalsResult.error) {
    // study_goals table may not exist in all deployments
  }

  const { error } = await supabase
    .from("subjects")
    .delete()
    .eq("user_id", userId)
    .eq("id", subjectId);

  if (error) {
    throw error;
  }
}

export async function deleteSubject(userId: string, subjectId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("subjects").delete().eq("user_id", userId).eq("id", subjectId);

  if (error) {
    throw error;
  }
}
