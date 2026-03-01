export type SubjectId = string;

export interface Subject {
  id: SubjectId;
  name: string;
  shortCode: string;
  baseColor: string;
  paperLabels?: string[];
}

export interface PlannerSessionTemplate {
  id: string;
  label: string;
  timeRange: string;
}

export interface PlannerTask {
  id: string;
  subjectId: SubjectId | null;
  title: string;
  notes?: string;
  isRest?: boolean;
}

export interface PlannerCell {
  date: string;
  sessionId: string;
  task: PlannerTask | null;
}

export interface PastPaperAttempt {
  id: string;
  subjectId: SubjectId;
  examYear: number;
  paperLabel: string;
  date: string;
  score: number;
  total: number;
  percentage: number;
  estimatedLevel: string;
  isDse?: boolean;
  tag?: string;
  notes?: string;
}

export type DseLevel = "5**" | "5*" | "5" | "4" | "3" | "2" | "1";

export interface CutoffRow {
  level: DseLevel;
  minimumPercentage: number;
}

/** Subject -> Year -> CutoffRows. Year-specific cutoffs from HKDSE historical data. */
export type CutoffDataByYear = Record<string, Record<number, CutoffRow[]>>;

/** @deprecated Legacy format: subject -> cutoffs (no year). Kept for fallback. */
export type CutoffDataLegacy = Record<string, CutoffRow[]>;

export type CutoffData = CutoffDataByYear | CutoffDataLegacy;

export function isCutoffDataByYear(data: CutoffData): data is CutoffDataByYear {
  if (Object.keys(data).length === 0) return false;
  const firstKey = Object.keys(data)[0];
  const val = (data as Record<string, unknown>)[firstKey];
  return Array.isArray(val) ? false : typeof val === "object" && val !== null;
}
