import type { PlannerSessionTemplate, Subject } from "./types";

export const MS_PER_DAY = 86_400_000;
export const MS_PER_WEEK = MS_PER_DAY * 7;

export const DEFAULT_SUBJECT_COLOR = "#3b82f6";
export const FALLBACK_SUBJECT_COLOR = "#666666";

export const MIN_CUTOFF_YEAR = 2012;
export const MAX_CUTOFF_YEAR = 2035;

export const MIN_PASSWORD_LENGTH = 6;
export const MAX_SHORT_CODE_LENGTH = 5;

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: "chi", name: "Chinese", shortCode: "CHI", baseColor: "#ef4444", paperLabels: ["Paper 1", "Paper 2"] },
  { id: "eng", name: "English", shortCode: "ENG", baseColor: "#3b82f6", paperLabels: ["Paper 1", "Paper 2", "Paper 3", "Paper 4"] },
  { id: "math", name: "Mathematics", shortCode: "MATH", baseColor: "#10b981", paperLabels: ["Paper 1", "Paper 2"] },
  { id: "csd", name: "Citizenship and Social Development", shortCode: "C&SD", baseColor: "#f59e0b", paperLabels: ["Paper 1"] },
];

export const PRESET_SUBJECTS: Omit<Subject, "id">[] = [
  { name: "Chinese Language", shortCode: "CHI", baseColor: "#ef4444", paperLabels: ["Paper 1", "Paper 2"] },
  { name: "English Language", shortCode: "ENG", baseColor: "#3b82f6", paperLabels: ["Paper 1", "Paper 2", "Paper 3"] },
  { name: "Mathematics (Compulsory Part)", shortCode: "MATH", baseColor: "#10b981", paperLabels: ["Paper 1", "Paper 2"] },
  { name: "Citizenship and Social Development", shortCode: "C&SD", baseColor: "#f59e0b", paperLabels: ["Paper 1"] },
  { name: "Biology", shortCode: "BIO", baseColor: "#10b981", paperLabels: ["Paper 1", "Paper 2"] },
  { name: "Chemistry", shortCode: "CHEM", baseColor: "#0ea5e9", paperLabels: ["Paper 1", "Paper 2"] },
  { name: "Physics", shortCode: "PHY", baseColor: "#6366f1", paperLabels: ["Paper 1", "Paper 2"] },
  { name: "Economics", shortCode: "ECON", baseColor: "#f59e0b", paperLabels: ["Paper 1", "Paper 2"] },
  { name: "History", shortCode: "HIST", baseColor: "#8b5cf6", paperLabels: ["Paper 1", "Paper 2"] },
  { name: "Chinese History", shortCode: "CHIST", baseColor: "#ef4444", paperLabels: ["Paper 1", "Paper 2"] },
  { name: "Geography", shortCode: "GEOG", baseColor: "#10b981", paperLabels: ["Paper 1", "Paper 2"] },
  { name: "BAFS", shortCode: "BAFS", baseColor: "#3b82f6", paperLabels: ["Paper 1", "Paper 2"] },
  { name: "ICT", shortCode: "ICT", baseColor: "#64748b", paperLabels: ["Paper 1", "Paper 2"] },
  { name: "M1 (Calculus & Statistics)", shortCode: "M1", baseColor: "#14b8a6", paperLabels: ["Paper 1"] },
  { name: "M2 (Algebra & Calculus)", shortCode: "M2", baseColor: "#14b8a6", paperLabels: ["Paper 1"] },
  { name: "Visual Arts", shortCode: "VA", baseColor: "#ec4899", paperLabels: ["Paper 1", "Paper 2"] },
  { name: "Ethics and Religious Studies", shortCode: "ERS", baseColor: "#8b5cf6", paperLabels: ["Paper 1", "Paper 2"] },
  { name: "Design and Applied Technology", shortCode: "DAT", baseColor: "#64748b", paperLabels: ["Paper 1", "Paper 2"] },
  { name: "Literature in English", shortCode: "LIT ENG", baseColor: "#3b82f6", paperLabels: ["Paper 1", "Paper 2"] },
  { name: "Health Management and Social Care", shortCode: "HMSC", baseColor: "#f59e0b", paperLabels: ["Paper 1", "Paper 2"] },
  { name: "Chinese Literature", shortCode: "CHILIT", baseColor: "#ef4444", paperLabels: ["Paper 1", "Paper 2"] },
  { name: "Technology and Living", shortCode: "TL", baseColor: "#ec4899", paperLabels: ["Paper 1", "Paper 2"] },
  { name: "Tourism and Hospitality Studies", shortCode: "THS", baseColor: "#f59e0b", paperLabels: ["Paper 1", "Paper 2"] },
  { name: "Music", shortCode: "MUSIC", baseColor: "#8b5cf6", paperLabels: ["Paper 1", "Paper 2"] },
  { name: "Physical Education", shortCode: "PE", baseColor: "#10b981", paperLabels: ["Paper 1", "Paper 2"] },
];

/** Single exam entry in the DSE timetable. */
export interface TimetableEntry {
  date: string;
  subjectCode: string;
  paper: string;
  time: string;
}

/** Versioned map: exam year -> timetable entries. Add new years without code changes. */
export const DSE_TIMETABLES: Record<number, TimetableEntry[]> = {
  2026: [
    { date: '2026-04-08', subjectCode: 'VA', paper: 'Paper 1 & 2', time: '8:30–12:30' },
    { date: '2026-04-09', subjectCode: 'CHI', paper: 'Paper 1', time: '8:30–10:00' },
    { date: '2026-04-09', subjectCode: 'CHI', paper: 'Paper 2', time: '10:45–13:00' },
    { date: '2026-04-10', subjectCode: 'ENG', paper: 'Paper 1', time: '8:30–10:00' },
    { date: '2026-04-10', subjectCode: 'ENG', paper: 'Paper 2', time: '11:00–13:00' },
    { date: '2026-04-11', subjectCode: 'ENG', paper: 'Paper 3', time: '9:15–12:10' },
    { date: '2026-04-13', subjectCode: 'MATH', paper: 'Paper 1', time: '8:30–10:45' },
    { date: '2026-04-13', subjectCode: 'MATH', paper: 'Paper 2', time: '11:30–12:45' },
    { date: '2026-04-14', subjectCode: 'C&SD', paper: 'Paper 1', time: '8:30–10:30' },
    { date: '2026-04-15', subjectCode: 'ERS', paper: 'Paper 1', time: '8:30–10:15' },
    { date: '2026-04-15', subjectCode: 'ERS', paper: 'Paper 2', time: '11:00–12:45' },
    { date: '2026-04-16', subjectCode: 'CHEM', paper: 'Paper 1', time: '8:30–11:00' },
    { date: '2026-04-16', subjectCode: 'CHEM', paper: 'Paper 2', time: '11:45–12:45' },
    { date: '2026-04-17', subjectCode: 'DAT', paper: 'Paper 1', time: '8:30–10:30' },
    { date: '2026-04-17', subjectCode: 'DAT', paper: 'Paper 2', time: '11:15–13:15' },
    { date: '2026-04-17', subjectCode: 'LIT ENG', paper: 'Paper 1', time: '8:30–11:30' },
    { date: '2026-04-17', subjectCode: 'LIT ENG', paper: 'Paper 2', time: '13:30–15:30' },
    { date: '2026-04-18', subjectCode: 'HMSC', paper: 'Paper 1', time: '8:30–10:30' },
    { date: '2026-04-18', subjectCode: 'HMSC', paper: 'Paper 2', time: '11:15–13:00' },
    { date: '2026-04-20', subjectCode: 'BIO', paper: 'Paper 1', time: '8:30–11:00' },
    { date: '2026-04-20', subjectCode: 'BIO', paper: 'Paper 2', time: '11:45–12:45' },
    { date: '2026-04-21', subjectCode: 'CHILIT', paper: 'Paper 1', time: '8:30–10:30' },
    { date: '2026-04-21', subjectCode: 'CHILIT', paper: 'Paper 2', time: '11:15–13:15' },
    { date: '2026-04-21', subjectCode: 'TL', paper: 'Paper 1', time: '8:30–10:00' },
    { date: '2026-04-21', subjectCode: 'TL', paper: 'Paper 2', time: '10:45–12:45' },
    { date: '2026-04-22', subjectCode: 'PHY', paper: 'Paper 1', time: '8:30–11:00' },
    { date: '2026-04-22', subjectCode: 'PHY', paper: 'Paper 2', time: '11:45–12:45' },
    { date: '2026-04-23', subjectCode: 'GEOG', paper: 'Paper 1', time: '8:30–11:15' },
    { date: '2026-04-23', subjectCode: 'GEOG', paper: 'Paper 2', time: '12:00–13:15' },
    { date: '2026-04-24', subjectCode: 'ICT', paper: 'Paper 1', time: '8:30–10:30' },
    { date: '2026-04-24', subjectCode: 'ICT', paper: 'Paper 2', time: '11:15–12:45' },
    { date: '2026-04-25', subjectCode: 'HIST', paper: 'Paper 1', time: '8:30–10:30' },
    { date: '2026-04-25', subjectCode: 'HIST', paper: 'Paper 2', time: '11:15–12:45' },
    { date: '2026-04-27', subjectCode: 'BAFS', paper: 'Paper 1', time: '8:30–9:30' },
    { date: '2026-04-27', subjectCode: 'BAFS', paper: 'Paper 2', time: '10:15–12:45' },
    { date: '2026-04-28', subjectCode: 'PE', paper: 'Paper 1', time: '8:30–10:30' },
    { date: '2026-04-28', subjectCode: 'PE', paper: 'Paper 2', time: '11:15–12:45' },
    { date: '2026-04-29', subjectCode: 'CHIST', paper: 'Paper 1', time: '8:30–10:45' },
    { date: '2026-04-29', subjectCode: 'CHIST', paper: 'Paper 2', time: '11:30–12:50' },
    { date: '2026-04-30', subjectCode: 'M1', paper: 'Module 1', time: '8:30–11:00' },
    { date: '2026-04-30', subjectCode: 'M2', paper: 'Module 2', time: '8:30–11:00' },
    { date: '2026-05-02', subjectCode: 'THS', paper: 'Paper 1', time: '8:30–10:00' },
    { date: '2026-05-02', subjectCode: 'THS', paper: 'Paper 2', time: '10:45–12:30' },
    { date: '2026-05-04', subjectCode: 'ECON', paper: 'Paper 1', time: '8:30–9:30' },
    { date: '2026-05-04', subjectCode: 'ECON', paper: 'Paper 2', time: '10:15–12:45' },
    { date: '2026-05-05', subjectCode: 'MUSIC', paper: 'Paper 1A', time: '8:30–10:00' },
    { date: '2026-05-05', subjectCode: 'MUSIC', paper: 'Paper 1B', time: '10:45–12:15' },
  ],
};

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
