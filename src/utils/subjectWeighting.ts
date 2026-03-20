import subjectWeightingData from "../../subject_weighting.json";

export type SubjectWeightingPaper = { label: string; weight: number };

export type SubjectWeightingConfig = {
  subjectCode: string;
  subjectName?: string;
  papers: SubjectWeightingPaper[];
};

const raw = subjectWeightingData as Array<{
  subjectCode: string;
  subjectName?: string;
  papers?: SubjectWeightingPaper[];
  note?: string;
}>;

/** Map canonical JSON subjectCode -> config with papers (only entries that have papers). */
const byCode = new Map<string, SubjectWeightingConfig>();

for (const row of raw) {
  if (!row.papers?.length) continue;
  const key = row.subjectCode.trim().toUpperCase();
  byCode.set(key, {
    subjectCode: row.subjectCode,
    subjectName: row.subjectName,
    papers: row.papers.map((p) => ({
      label: p.label,
      weight: typeof p.weight === "number" ? p.weight : Number(p.weight),
    })),
  });
}

/**
 * App `Subject.shortCode` / legacy codes → `subject_weighting.json` `subjectCode` (uppercase).
 */
const SHORT_CODE_ALIASES: Record<string, string> = {
  CHIST: "CHI-HIST",
  "CHI HIST": "CHI-HIST",
  CHILIT: "CHI-LIT",
  "CHI LIT": "CHI-LIT",
  "LIT ENG": "ENG-LIT",
  "LIT ENGLISH": "ENG-LIT",
  "C&SD": "C&SD",
  CSD: "C&SD",
};

export function resolveWeightingSubjectCode(shortCode: string): string {
  const t = shortCode.trim().toUpperCase();
  return SHORT_CODE_ALIASES[t] ?? t;
}

export function getSubjectWeightingFromJson(shortCode: string): SubjectWeightingConfig | null {
  const key = resolveWeightingSubjectCode(shortCode);
  return byCode.get(key) ?? null;
}

/**
 * Normalise for slot matching: "Paper 1 (Reading)" → "p1", "Paper 2A" → "p2a".
 */
export function paperSlotKey(label: string): string {
  const t = label.trim().toLowerCase();
  const m = t.match(/^paper\s+(\d+)([a-z]?)/);
  if (m) return `p${m[1]}${m[2] ?? ""}`;
  if (t === "paper") return "paper";
  return t;
}

function formalSlotKey(formalLabel: string): string {
  const f = formalLabel.trim().toLowerCase();
  if (f === "paper") return "paper-module";
  return paperSlotKey(formalLabel);
}

function attemptSlotKey(attemptLabel: string): string {
  const t = attemptLabel.trim().toLowerCase();
  if (t === "paper" || /^module\s*[12]$/.test(t) || t === "m1" || t === "m2") {
    return "paper-module";
  }
  return paperSlotKey(attemptLabel);
}

/**
 * Whether an attempt's paper label should count toward a formal JSON paper row.
 * Handles long official names vs short logs (e.g. "Paper 1" ↔ "Paper 1 (Reading)").
 * M1/M2: formal "Paper" matches "Paper 1", "Module 1", "M1", etc.
 */
export function attemptMatchesFormalPaper(
  attemptLabel: string,
  formalLabel: string,
  allFormalLabels: string[],
): boolean {
  const formals = allFormalLabels.map((l) => l.trim());
  const formal = formalLabel.trim();
  const formalLower = formal.toLowerCase();

  if (formals.length === 1 && formalLower === "paper") {
    const a = attemptLabel.trim().toLowerCase();
    return (
      a === "paper" ||
      a === "paper 1" ||
      /^module\s*[12]$/.test(a) ||
      a === "m1" ||
      a === "m2"
    );
  }

  return attemptSlotKey(attemptLabel) === formalSlotKey(formalLabel);
}
