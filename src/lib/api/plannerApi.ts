import type { PlannerCell, PlannerTask } from "../../types";
import { getSupabaseClient } from "../supabase";

interface PlannerCellRow {
  date: string;
  session_id: string;
  task_id: string;
  subject_id: string | null;
  title: string;
  notes: string | null;
  is_rest: boolean;
}

function toPlannerCell(row: PlannerCellRow): PlannerCell {
  const task: PlannerTask = {
    id: row.task_id,
    subjectId: row.subject_id,
    title: row.title,
    notes: row.notes ?? undefined,
    isRest: row.is_rest,
  };

  return {
    date: row.date,
    sessionId: row.session_id,
    task,
  };
}

export async function listPlannerCells(userId: string): Promise<PlannerCell[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("planner_cells")
    .select("date,session_id,task_id,subject_id,title,notes,is_rest")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return (data as PlannerCellRow[]).map(toPlannerCell);
}

export async function upsertPlannerCell(
  userId: string,
  date: string,
  sessionId: string,
  task: PlannerTask
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("planner_cells").upsert(
    {
      user_id: userId,
      date,
      session_id: sessionId,
      task_id: task.id,
      subject_id: task.subjectId,
      title: task.title,
      notes: task.notes ?? null,
      is_rest: task.isRest ?? false,
    },
    { onConflict: "user_id,date,session_id" }
  );

  if (error) {
    throw error;
  }
}

export async function deletePlannerCell(userId: string, date: string, sessionId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("planner_cells")
    .delete()
    .eq("user_id", userId)
    .eq("date", date)
    .eq("session_id", sessionId);

  if (error) {
    throw error;
  }
}
