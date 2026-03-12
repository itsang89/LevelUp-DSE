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
  isDone?: boolean;
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

export type CutoffData = CutoffDataByYear;
