import type { Subject } from "../../types";
import { getSupabaseClient } from "../supabase";

interface SubjectRow {
  id: string;
  user_id: string;
  name: string;
  short_code: string;
  base_color: string;
}

function toSubject(row: SubjectRow): Subject {
  return {
    id: row.id,
    name: row.name,
    shortCode: row.short_code,
    baseColor: row.base_color,
  };
}

export async function listSubjects(userId: string): Promise<Subject[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("subjects")
    .select("id,user_id,name,short_code,base_color")
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
    })
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
