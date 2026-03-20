import type { PlannerSessionTemplate, Subject, TimetableEntry } from "./types";
import { attachFormalPaperLabels, formatTimetablePaperLine } from "./timetableFormalLabels";
import { DEFAULT_SUBJECTS as BUILT_DEFAULT_SUBJECTS, PRESET_SUBJECTS as BUILT_PRESET_SUBJECTS } from "./subjectCatalog";

export type { TimetableEntry };

export const MS_PER_DAY = 86_400_000;
export const MS_PER_WEEK = MS_PER_DAY * 7;

export const DEFAULT_SUBJECT_COLOR = "#3b82f6";
export const FALLBACK_SUBJECT_COLOR = "#666666";

export const MIN_CUTOFF_YEAR = 2012;
export const MAX_CUTOFF_YEAR = 2035;

export const MIN_PASSWORD_LENGTH = 6;
/** Allow hyphenated codes aligned with subject_weighting.json (e.g. CHI-HIST). */
export const MAX_SHORT_CODE_LENGTH = 12;

/** Derived from `subject_weighting.json` + `src/data/subjectExtras.json`. */
export const DEFAULT_SUBJECTS: Subject[] = BUILT_DEFAULT_SUBJECTS;

/** Preset picker list — same source as defaults + extras (e.g. THS). */
export const PRESET_SUBJECTS: Omit<Subject, "id">[] = BUILT_PRESET_SUBJECTS;

export { formatTimetablePaperLine };

/** Raw timetable rows (`paper` = HKEAA-style); enriched at load with `paperFormalLabel` where mapped. */
const RAW_DSE_TIMETABLES: Record<number, TimetableEntry[]> = {
  2026: [
    { date: "2026-04-08", subjectCode: "VA", paper: "Paper 1 & 2", time: "8:30–12:30" },
    { date: "2026-04-09", subjectCode: "CHI", paper: "Paper 1", time: "8:30–10:00" },
    { date: "2026-04-09", subjectCode: "CHI", paper: "Paper 2", time: "10:45–13:00" },
    { date: "2026-04-10", subjectCode: "ENG", paper: "Paper 1", time: "8:30–10:00" },
    { date: "2026-04-10", subjectCode: "ENG", paper: "Paper 2", time: "11:00–13:00" },
    { date: "2026-04-11", subjectCode: "ENG", paper: "Paper 3", time: "9:15–12:10" },
    { date: "2026-04-13", subjectCode: "MATH", paper: "Paper 1", time: "8:30–10:45" },
    { date: "2026-04-13", subjectCode: "MATH", paper: "Paper 2", time: "11:30–12:45" },
    { date: "2026-04-14", subjectCode: "C&SD", paper: "Paper 1", time: "8:30–10:30" },
    { date: "2026-04-15", subjectCode: "ERS", paper: "Paper 1", time: "8:30–10:15" },
    { date: "2026-04-15", subjectCode: "ERS", paper: "Paper 2", time: "11:00–12:45" },
    { date: "2026-04-16", subjectCode: "CHEM", paper: "Paper 1", time: "8:30–11:00" },
    { date: "2026-04-16", subjectCode: "CHEM", paper: "Paper 2", time: "11:45–12:45" },
    { date: "2026-04-17", subjectCode: "DAT", paper: "Paper 1", time: "8:30–10:30" },
    { date: "2026-04-17", subjectCode: "DAT", paper: "Paper 2", time: "11:15–13:15" },
    { date: "2026-04-17", subjectCode: "ENG-LIT", paper: "Paper 1", time: "8:30–11:30" },
    { date: "2026-04-17", subjectCode: "ENG-LIT", paper: "Paper 2", time: "13:30–15:30" },
    { date: "2026-04-18", subjectCode: "HMSC", paper: "Paper 1", time: "8:30–10:30" },
    { date: "2026-04-18", subjectCode: "HMSC", paper: "Paper 2", time: "11:15–13:00" },
    { date: "2026-04-20", subjectCode: "BIO", paper: "Paper 1", time: "8:30–11:00" },
    { date: "2026-04-20", subjectCode: "BIO", paper: "Paper 2", time: "11:45–12:45" },
    { date: "2026-04-21", subjectCode: "CHI-LIT", paper: "Paper 1", time: "8:30–10:30" },
    { date: "2026-04-21", subjectCode: "CHI-LIT", paper: "Paper 2", time: "11:15–13:15" },
    { date: "2026-04-21", subjectCode: "TL", paper: "Paper 1", time: "8:30–10:00" },
    { date: "2026-04-21", subjectCode: "TL", paper: "Paper 2", time: "10:45–12:45" },
    { date: "2026-04-22", subjectCode: "PHY", paper: "Paper 1", time: "8:30–11:00" },
    { date: "2026-04-22", subjectCode: "PHY", paper: "Paper 2", time: "11:45–12:45" },
    { date: "2026-04-23", subjectCode: "GEOG", paper: "Paper 1", time: "8:30–11:15" },
    { date: "2026-04-23", subjectCode: "GEOG", paper: "Paper 2", time: "12:00–13:15" },
    { date: "2026-04-24", subjectCode: "ICT", paper: "Paper 1", time: "8:30–10:30" },
    { date: "2026-04-24", subjectCode: "ICT", paper: "Paper 2", time: "11:15–12:45" },
    { date: "2026-04-25", subjectCode: "HIST", paper: "Paper 1", time: "8:30–10:30" },
    { date: "2026-04-25", subjectCode: "HIST", paper: "Paper 2", time: "11:15–12:45" },
    { date: "2026-04-27", subjectCode: "BAFS", paper: "Paper 1", time: "8:30–9:30" },
    { date: "2026-04-27", subjectCode: "BAFS", paper: "Paper 2", time: "10:15–12:45" },
    { date: "2026-04-28", subjectCode: "PE", paper: "Paper 1", time: "8:30–10:30" },
    { date: "2026-04-28", subjectCode: "PE", paper: "Paper 2", time: "11:15–12:45" },
    { date: "2026-04-29", subjectCode: "CHI-HIST", paper: "Paper 1", time: "8:30–10:45" },
    { date: "2026-04-29", subjectCode: "CHI-HIST", paper: "Paper 2", time: "11:30–12:50" },
    { date: "2026-04-30", subjectCode: "M1", paper: "Module 1", time: "8:30–11:00" },
    { date: "2026-04-30", subjectCode: "M2", paper: "Module 2", time: "8:30–11:00" },
    { date: "2026-05-02", subjectCode: "THS", paper: "Paper 1", time: "8:30–10:00" },
    { date: "2026-05-02", subjectCode: "THS", paper: "Paper 2", time: "10:45–12:30" },
    { date: "2026-05-04", subjectCode: "ECON", paper: "Paper 1", time: "8:30–9:30" },
    { date: "2026-05-04", subjectCode: "ECON", paper: "Paper 2", time: "10:15–12:45" },
    { date: "2026-05-05", subjectCode: "MUSIC", paper: "Paper 1A", time: "8:30–10:00" },
    { date: "2026-05-05", subjectCode: "MUSIC", paper: "Paper 1B", time: "10:45–12:15" },
  ],
};

function enrichAllTimetables(raw: Record<number, TimetableEntry[]>): Record<number, TimetableEntry[]> {
  const out: Record<number, TimetableEntry[]> = {};
  for (const [year, entries] of Object.entries(raw)) {
    out[Number(year)] = attachFormalPaperLabels(entries);
  }
  return out;
}

export const DSE_TIMETABLES: Record<number, TimetableEntry[]> = enrichAllTimetables(RAW_DSE_TIMETABLES);

/** HKEAA official timetable page — use when current year timetable not yet available. */
export const HKEAA_TIMETABLE_URL = "https://www.hkeaa.edu.hk/en/hkdse/admin/exam_timetable/";

/** Current exam year based on today's date (DSE exams run April–May). */
export function getCurrentExamYear(): number {
  return new Date().getFullYear();
}

/** Returns timetable for the given year, or null if not available. */
export function getTimetableForYear(year: number): TimetableEntry[] | null {
  return DSE_TIMETABLES[year] ?? null;
}

export const PLANNER_SESSIONS: PlannerSessionTemplate[] = [
  { id: "s1", label: "Session 1", timeRange: "08:30-13:00" },
  { id: "s2a", label: "Session 2", timeRange: "14:00-16:00" },
  { id: "s2b", label: "Session 3", timeRange: "16:30-19:00" },
  { id: "s3", label: "Session 4", timeRange: "20:00-23:00" },
];
