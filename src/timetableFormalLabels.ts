import type { TimetableEntry } from "./types";

/**
 * Maps HKEAA-style `paper` strings (per `subjectCode`) to formal labels from `subject_weighting.json`.
 * Used to enrich `TimetableEntry.paperFormalLabel` without duplicating long names in every row.
 */
const SUBJECT_PAPER_TO_FORMAL: Record<string, Record<string, string>> = {
  CHI: {
    "Paper 1": "Paper 1 (Reading)",
    "Paper 2": "Paper 2 (Writing)",
  },
  ENG: {
    "Paper 1": "Paper 1 (Reading)",
    "Paper 2": "Paper 2 (Writing)",
    "Paper 3": "Paper 3 (Listening & Integrated Skills)",
    "Paper 4": "Paper 4 (Speaking)",
  },
  MATH: { "Paper 1": "Paper 1", "Paper 2": "Paper 2" },
  "C&SD": { "Paper 1": "Paper 1" },
  ERS: { "Paper 1": "Paper 1", "Paper 2": "Paper 2" },
  CHEM: { "Paper 1": "Paper 1", "Paper 2": "Paper 2" },
  DAT: { "Paper 1": "Paper 1", "Paper 2": "Paper 2" },
  "ENG-LIT": { "Paper 1": "Paper 1", "Paper 2": "Paper 2" },
  HMSC: { "Paper 1": "Paper 1", "Paper 2": "Paper 2" },
  BIO: { "Paper 1": "Paper 1", "Paper 2": "Paper 2" },
  "CHI-LIT": {
    "Paper 1": "Paper 1 (卷一)",
    "Paper 2": "Paper 2 (卷二)",
  },
  TL: { "Paper 1": "Paper 1", "Paper 2": "Paper 2" },
  PHY: { "Paper 1": "Paper 1", "Paper 2": "Paper 2" },
  GEOG: { "Paper 1": "Paper 1", "Paper 2": "Paper 2" },
  ICT: { "Paper 1": "Paper 1", "Paper 2": "Paper 2" },
  HIST: { "Paper 1": "Paper 1", "Paper 2": "Paper 2" },
  BAFS: { "Paper 1": "Paper 1", "Paper 2": "Paper 2" },
  PE: {
    "Paper 1": "Paper 1 (Written)",
    "Paper 2": "Paper 2 (Physical Performance)",
  },
  "CHI-HIST": {
    "Paper 1": "Paper 1 (卷一)",
    "Paper 2": "Paper 2 (卷二)",
  },
  M1: { "Module 1": "Paper" },
  M2: { "Module 2": "Paper" },
  THS: { "Paper 1": "Paper 1", "Paper 2": "Paper 2" },
  ECON: { "Paper 1": "Paper 1", "Paper 2": "Paper 2" },
  MUSIC: {
    "Paper 1A": "Paper 1 (Listening)",
    "Paper 1B": "Paper 1 (Listening)",
    "Paper 2": "Paper 2 (Performing)",
    "Paper 3": "Paper 3 (Creating)",
    "Paper 4": "Paper 4 (Elective)",
  },
  VA: {
    "Paper 1 & 2": "Paper 1 (Art Criticism & Art History)",
  },
};

export function attachFormalPaperLabels(entries: TimetableEntry[]): TimetableEntry[] {
  return entries.map((e) => {
    if (e.paperFormalLabel) return e;
    const map = SUBJECT_PAPER_TO_FORMAL[e.subjectCode];
    const formal = map?.[e.paper];
    return formal ? { ...e, paperFormalLabel: formal } : e;
  });
}

/** One line for UI: schedule label + formal weighting name when they differ. */
export function formatTimetablePaperLine(entry: TimetableEntry): string {
  if (entry.paperFormalLabel && entry.paperFormalLabel.trim() !== entry.paper.trim()) {
    return `${entry.paper} · ${entry.paperFormalLabel}`;
  }
  return entry.paper;
}
