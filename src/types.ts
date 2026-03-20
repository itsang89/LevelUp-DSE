export type SubjectId = string;

export interface Subject {
  id: SubjectId;
  name: string;
  shortCode: string;
  baseColor: string;
  paperLabels?: string[];
  /** Optional paper label -> weight (e.g. 0.5). If omitted, equal split across `paperLabels`. */
  paperWeights?: Record<string, number>;
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

/** One row in the built-in DSE exam timetable. */
export interface TimetableEntry {
  date: string;
  subjectCode: string;
  /** HKEAA / schedule display (may differ from formal weighted paper name). */
  paper: string;
  time: string;
  /** When set, matches `subject_weighting.json` paper label for weighting / past papers. */
  paperFormalLabel?: string;
}
