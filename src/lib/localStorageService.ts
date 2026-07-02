import type { PastPaperAttempt, PlannerCell, StudyGoal, Subject } from "../types";

const KEYS = {
  subjects: "guest_subjects",
  plannerCells: "guest_planner_cells",
  pastPapers: "guest_past_papers",
  studyGoals: "guest_study_goals",
  guestMode: "guest_mode",
} as const;

const isClient = typeof window !== "undefined";

function getJSON<T>(key: string, fallback: T): T {
  if (!isClient) return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setJSON(key: string, value: unknown): void {
  if (!isClient) return;
  localStorage.setItem(key, JSON.stringify(value));
}

const getArray = <T>(key: string): T[] => getJSON<T[]>(key, []);

export function getGuestSubjects(): Subject[] {
  return getArray<Subject>(KEYS.subjects);
}
export function setGuestSubjects(subjects: Subject[]): void {
  setJSON(KEYS.subjects, subjects);
}

export function getGuestPlannerCells(): PlannerCell[] {
  return getArray<PlannerCell>(KEYS.plannerCells);
}
export function setGuestPlannerCells(cells: PlannerCell[]): void {
  setJSON(KEYS.plannerCells, cells);
}

export function getGuestPastPapers(): PastPaperAttempt[] {
  return getArray<PastPaperAttempt>(KEYS.pastPapers);
}
export function setGuestPastPapers(attempts: PastPaperAttempt[]): void {
  setJSON(KEYS.pastPapers, attempts);
}

export function getGuestStudyGoals(): StudyGoal[] {
  return getArray<StudyGoal>(KEYS.studyGoals);
}
export function setGuestStudyGoals(goals: StudyGoal[]): void {
  setJSON(KEYS.studyGoals, goals);
}

export function setGuestMode(enabled: boolean): void {
  if (!isClient) return;
  localStorage.setItem(KEYS.guestMode, enabled ? "true" : "false");
}

export function isGuestMode(): boolean {
  if (!isClient) return false;
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
  if (!isClient) return;
  for (const key of Object.values(KEYS)) {
    localStorage.removeItem(key);
  }
}