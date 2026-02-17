import type { PlannerSessionTemplate, Subject } from "./types";

export const STORAGE_KEYS = {
  subjects: "dse-planner-subjects",
  plannerCells: "dse-planner-cells",
  pastPapers: "dse-past-papers",
} as const;

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: "chi", name: "Chinese", shortCode: "CHI", baseColor: "#ef4444" },
  { id: "eng", name: "English", shortCode: "ENG", baseColor: "#3b82f6" },
  { id: "math", name: "Mathematics", shortCode: "MATH", baseColor: "#10b981" },
  { id: "phy", name: "Physics", shortCode: "PHY", baseColor: "#8b5cf6" },
  { id: "chem", name: "Chemistry", shortCode: "CHEM", baseColor: "#14b8a6" },
  { id: "m2", name: "M2", shortCode: "M2", baseColor: "#6366f1" },
];

export const PLANNER_SESSIONS: PlannerSessionTemplate[] = [
  { id: "s1", label: "Session 1", timeRange: "08:30-13:00" },
  { id: "s2a", label: "Session 2A", timeRange: "14:00-16:00" },
  { id: "s2b", label: "Session 2B", timeRange: "16:30-19:00" },
  { id: "s3", label: "Session 3", timeRange: "20:00-23:00" },
];
