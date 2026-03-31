import type { PastPaperAttempt, PlannerCell, Subject } from "../types";
import type { StudyGoal } from "./api/goalsApi";

const KEYS = {
  subjects: "guest_subjects",
  plannerCells: "guest_planner_cells",
  pastPapers: "guest_past_papers",
  studyGoals: "guest_study_goals",
  guestMode: "guest_mode",
} as const;

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeArray<T>(key: string, value: T[]): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getGuestSubjects(): Subject[] {
  return safeParseArray<Subject>(localStorage.getItem(KEYS.subjects));
}

export function setGuestSubjects(subjects: Subject[]): void {
  writeArray(KEYS.subjects, subjects);
}

export function getGuestPlannerCells(): PlannerCell[] {
  return safeParseArray<PlannerCell>(localStorage.getItem(KEYS.plannerCells));
}

export function setGuestPlannerCells(cells: PlannerCell[]): void {
  writeArray(KEYS.plannerCells, cells);
}

export function getGuestPastPapers(): PastPaperAttempt[] {
  return safeParseArray<PastPaperAttempt>(localStorage.getItem(KEYS.pastPapers));
}

export function setGuestPastPapers(attempts: PastPaperAttempt[]): void {
  writeArray(KEYS.pastPapers, attempts);
}

export function getGuestStudyGoals(): StudyGoal[] {
  return safeParseArray<StudyGoal>(localStorage.getItem(KEYS.studyGoals));
}

export function setGuestStudyGoals(goals: StudyGoal[]): void {
  writeArray(KEYS.studyGoals, goals);
}

export function setGuestMode(enabled: boolean): void {
  localStorage.setItem(KEYS.guestMode, enabled ? "true" : "false");
}

export function isGuestMode(): boolean {
  return localStorage.getItem(KEYS.guestMode) === "true";
}

export function hasGuestData(): boolean {
  return (
    getGuestSubjects().length > 0 ||
    getGuestPlannerCells().length > 0 ||
    getGuestPastPapers().length > 0 ||
    getGuestStudyGoals().length > 0
  );
}

export function clearAllGuestData(): void {
  localStorage.removeItem(KEYS.subjects);
  localStorage.removeItem(KEYS.plannerCells);
  localStorage.removeItem(KEYS.pastPapers);
  localStorage.removeItem(KEYS.studyGoals);
  localStorage.removeItem(KEYS.guestMode);
}
