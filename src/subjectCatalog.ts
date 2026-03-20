/**
 * Single source for subject list + paper labels: built from `subject_weighting.json`
 * plus `src/data/subjectExtras.json` for subjects not in weighting (e.g. THS).
 */
import type { Subject } from "./types";
import subjectWeightingJson from "../subject_weighting.json";
import subjectExtrasJson from "./data/subjectExtras.json";

type WeightingRow = {
  subjectCode: string;
  subjectName?: string;
  papers?: { label: string; weight: number }[];
  note?: string;
};

type ExtraSubject = {
  subjectCode: string;
  subjectName: string;
  paperLabels: string[];
  baseColor: string;
};

const FALLBACK_COLOR = "#64748b";

/** Accent colors keyed by official `subjectCode` (covers weighting + extras). */
export const SUBJECT_BASE_COLORS: Record<string, string> = {
  CHI: "#ef4444",
  ENG: "#3b82f6",
  MATH: "#10b981",
  M1: "#14b8a6",
  M2: "#14b8a6",
  "C&SD": "#f59e0b",
  BIO: "#10b981",
  CHEM: "#0ea5e9",
  PHY: "#6366f1",
  ECON: "#f59e0b",
  GEOG: "#10b981",
  HIST: "#8b5cf6",
  "CHI-HIST": "#ef4444",
  "CHI-LIT": "#ef4444",
  BAFS: "#3b82f6",
  ICT: "#64748b",
  DAT: "#64748b",
  TL: "#ec4899",
  HMSC: "#f59e0b",
  VA: "#ec4899",
  MUSIC: "#8b5cf6",
  PE: "#10b981",
  "ENG-LIT": "#3b82f6",
  ERS: "#8b5cf6",
  THS: "#f59e0b",
};

const rawWeighting = subjectWeightingJson as WeightingRow[];
const extras = subjectExtrasJson as ExtraSubject[];

function normalizeCode(code: string): string {
  return code.trim();
}

function paperLabelsFromWeightingRow(row: WeightingRow): string[] {
  if (row.papers?.length) {
    return row.papers.map((p) => p.label);
  }
  // e.g. C&SD — no weighted papers in JSON; keep a single UI slot for logging
  return ["Paper 1"];
}

function weightingToPreset(row: WeightingRow): Omit<Subject, "id"> {
  const code = normalizeCode(row.subjectCode);
  const name = row.subjectName?.trim() || code;
  return {
    name,
    shortCode: row.subjectCode.trim(),
    baseColor: SUBJECT_BASE_COLORS[code] ?? FALLBACK_COLOR,
    paperLabels: paperLabelsFromWeightingRow(row),
  };
}

function extraToPreset(row: ExtraSubject): Omit<Subject, "id"> {
  const code = normalizeCode(row.subjectCode);
  return {
    name: row.subjectName,
    shortCode: row.subjectCode.trim(),
    baseColor: row.baseColor || SUBJECT_BASE_COLORS[code] || FALLBACK_COLOR,
    paperLabels: [...row.paperLabels],
  };
}

/** All presets: JSON weighting order, then extras not already present. */
export function buildPresetSubjects(): Omit<Subject, "id">[] {
  const fromWeighting = rawWeighting.map(weightingToPreset);
  const codes = new Set(fromWeighting.map((p) => normalizeCode(p.shortCode)));
  const fromExtras = extras
    .filter((e) => !codes.has(normalizeCode(e.subjectCode)))
    .map(extraToPreset);
  return [...fromWeighting, ...fromExtras];
}

const DEFAULT_ORDER = ["CHI", "ENG", "MATH", "C&SD"] as const;

const DEFAULT_IDS: Record<string, string> = {
  CHI: "chi",
  ENG: "eng",
  MATH: "math",
  "C&SD": "csd",
};

/** First-time seed subjects (stable `id`s for storage). */
export function buildDefaultSubjects(): Subject[] {
  const presets = buildPresetSubjects();
  const byCode = new Map(presets.map((p) => [normalizeCode(p.shortCode), p]));

  return DEFAULT_ORDER.map((code) => {
    const p = byCode.get(code);
    if (!p) {
      throw new Error(`subjectCatalog: missing default subject code "${code}" in weighting/extras`);
    }
    const id = DEFAULT_IDS[code] ?? code.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return { id, ...p };
  });
}

export const PRESET_SUBJECTS: Omit<Subject, "id">[] = buildPresetSubjects();
export const DEFAULT_SUBJECTS: Subject[] = buildDefaultSubjects();
