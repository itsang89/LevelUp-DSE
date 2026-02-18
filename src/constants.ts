import type { PlannerSessionTemplate, Subject } from "./types";

export const STORAGE_KEYS = {
  subjects: "dse-planner-subjects",
  plannerCells: "dse-planner-cells",
  pastPapers: "dse-past-papers",
} as const;

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: "chi", name: "Chinese", shortCode: "CHI", baseColor: "#ef4444", paperLabels: ["Paper 1", "Paper 2"] },
  { id: "eng", name: "English", shortCode: "ENG", baseColor: "#3b82f6", paperLabels: ["Paper 1", "Paper 2", "Paper 3", "Paper 4"] },
  { id: "math", name: "Mathematics", shortCode: "MATH", baseColor: "#10b981", paperLabels: ["Paper 1", "Paper 2"] },
  { id: "csd", name: "Citizenship and Social Development", shortCode: "C&SD", baseColor: "#f59e0b", paperLabels: ["Paper 1"] },
];

export const PLANNER_SESSIONS: PlannerSessionTemplate[] = [
  { id: "s1", label: "Session 1", timeRange: "08:30-13:00" },
  { id: "s2a", label: "Session 2", timeRange: "14:00-16:00" },
  { id: "s2b", label: "Session 3", timeRange: "16:30-19:00" },
  { id: "s3", label: "Session 4", timeRange: "20:00-23:00" },
];
