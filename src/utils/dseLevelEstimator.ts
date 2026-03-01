import type {
  CutoffData,
  CutoffDataByYear,
  CutoffRow,
  DseLevel,
} from "../types";
import { isCutoffDataByYear } from "../types";

const LEVEL_ORDER: DseLevel[] = ["5**", "5*", "5", "4", "3", "2", "1"];

const LEVEL_COLUMNS = ["5**", "5*", "5", "4", "3", "2"] as const;

const GENERIC_CUTOFFS: CutoffRow[] = [
  { level: "5**", minimumPercentage: 90 },
  { level: "5*", minimumPercentage: 80 },
  { level: "5", minimumPercentage: 70 },
  { level: "4", minimumPercentage: 60 },
  { level: "3", minimumPercentage: 50 },
  { level: "2", minimumPercentage: 40 },
  { level: "1", minimumPercentage: 30 },
];

/** Maps HKDSE section number to subject short code */
const SECTION_TO_CODE: Record<number, string> = {
  1: "CHI",
  2: "ENG",
  3: "MATH",
  4: "CHEM",
  5: "BIO",
};

function normalizeRows(rows: CutoffRow[]): CutoffRow[] {
  return [...rows].sort(
    (a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level)
  );
}

/**
 * Extracts percentage from a cell like "470 (71%)", "—", or "N/A".
 * Returns null for missing/unavailable data.
 */
function parsePercentageCell(cell: string): number | null {
  const trimmed = cell.trim().toUpperCase();
  if (!trimmed || trimmed === "—" || trimmed === "-" || trimmed === "N/A") return null;
  const match = cell.trim().match(/\((\d+)%\)/);
  return match ? Number(match[1]) : null;
}

/** Maps elective subject heading to short code. Longer phrases first. */
const ELECTIVE_HEADING_TO_CODE: [string, string][] = [
  ["CHINESE HISTORY", "CHIST"],
  ["CHINESE LITERATURE", "CHILIT"],
  ["PHYSICS", "PHY"],
  ["ECONOMICS", "ECON"],
  ["BAFS", "BAFS"],
  ["HISTORY", "HIST"],
  ["GEOGRAPHY", "GEOG"],
  ["ICT", "ICT"],
  ["M1", "M1"],
  ["M2", "M2"],
];

function getElectiveCode(headingText: string): string | null {
  const beforeChinese = headingText.split(/[\u4e00-\u9fff]/)[0]?.trim() ?? "";
  const normalized = beforeChinese.replace(/\s*\([^)]*\)\s*$/, "").trim().toUpperCase();
  for (const [key, code] of ELECTIVE_HEADING_TO_CODE) {
    if (normalized === key || normalized.startsWith(key + " ")) return code;
  }
  return null;
}

/**
 * Parses HKDSE year-based cutoff tables.
 * Format: ## N. Subject Name | table with 年份 | 滿分 | 5** | 5* | 5 | 4 | 3 | 2
 */
export function parseHkdseCutoffMarkdown(markdown: string): CutoffDataByYear {
  const data: CutoffDataByYear = {};
  let currentCode: string | null = null;

  for (const line of markdown.split("\n")) {
    const headingMatch = line.match(/^##\s+(\d+)\.\s+.+/);
    if (headingMatch) {
      const sectionNum = Number(headingMatch[1]);
      currentCode = SECTION_TO_CODE[sectionNum] ?? null;
      if (currentCode && !data[currentCode]) {
        data[currentCode] = {};
      }
      continue;
    }

    if (!currentCode) continue;

    const tableRowMatch = line.match(/^\|\s*(\d{4})\s*\|/);
    if (!tableRowMatch) continue;

    const parts = line.split("|").map((p) => p.trim());
    if (parts.length < 3) continue;

    const year = Number(parts[1]);
    if (!Number.isFinite(year) || year < 2012 || year > 2030) continue;

    const rows: CutoffRow[] = [];
    for (let i = 0; i < LEVEL_COLUMNS.length; i++) {
      const cell = parts[i + 3] ?? "";
      const pct = parsePercentageCell(cell);
      if (pct !== null) {
        rows.push({ level: LEVEL_COLUMNS[i], minimumPercentage: pct });
      }
    }

    if (rows.length > 0) {
      data[currentCode][year] = normalizeRows(rows);
    }
  }

  return data;
}

/**
 * Parses HKDSE elective cutoff tables.
 * Format: ### Subject Name | table with Year | Max | 5** | 5* | 5 | 4 | 3 | 2
 */
export function parseHkdseElectiveCutoffMarkdown(markdown: string): CutoffDataByYear {
  const data: CutoffDataByYear = {};
  let currentCode: string | null = null;

  for (const line of markdown.split("\n")) {
    const headingMatch = line.match(/^###\s+(.+)$/);
    if (headingMatch) {
      currentCode = getElectiveCode(headingMatch[1]);
      if (currentCode && !data[currentCode]) {
        data[currentCode] = {};
      }
      continue;
    }

    if (!currentCode) continue;

    const tableRowMatch = line.match(/^\|\s*(\d{4})\s*\|/);
    if (!tableRowMatch) continue;

    const parts = line.split("|").map((p) => p.trim());
    if (parts.length < 3) continue;

    const year = Number(parts[1]);
    if (!Number.isFinite(year) || year < 2012 || year > 2030) continue;

    const rows: CutoffRow[] = [];
    for (let i = 0; i < LEVEL_COLUMNS.length; i++) {
      const cell = parts[i + 3] ?? "";
      const pct = parsePercentageCell(cell);
      if (pct !== null) {
        rows.push({ level: LEVEL_COLUMNS[i], minimumPercentage: pct });
      }
    }

    if (rows.length > 0) {
      data[currentCode][year] = normalizeRows(rows);
    }
  }

  return data;
}

/**
 * Parses legacy markdown tables under `## Subject (CODE)` headings.
 * Converts to year-based format using a synthetic "0" year for backward compatibility.
 */
export function parseCutoffMarkdown(markdown: string): CutoffDataByYear {
  const legacy: Record<string, CutoffRow[]> = {};
  let currentCode: string | null = null;

  for (const line of markdown.split("\n")) {
    const headingMatch = line.match(/^##\s+.+\(([^)]+)\)\s*$/);
    if (headingMatch) {
      currentCode = headingMatch[1].trim().toUpperCase();
      if (!legacy[currentCode]) {
        legacy[currentCode] = [];
      }
      continue;
    }

    if (!currentCode) continue;

    const rowMatch = line.match(
      /^\|\s*(5\*\*|5\*|5|4|3|2|1)\s*\|\s*([0-9]+(?:\.[0-9]+)?)\s*\|/
    );
    if (rowMatch) {
      const level = rowMatch[1] as DseLevel;
      const minimumPercentage = Number(rowMatch[2]);
      legacy[currentCode].push({ level, minimumPercentage });
    }
  }

  const byYear: CutoffDataByYear = {};
  for (const [code, rows] of Object.entries(legacy)) {
    if (rows.length > 0) {
      byYear[code] = { 0: normalizeRows(rows) };
    }
  }
  return byYear;
}

function mergeCutoffData(base: CutoffDataByYear, extra: CutoffDataByYear): CutoffDataByYear {
  const merged = { ...base };
  for (const [code, byYear] of Object.entries(extra)) {
    if (!merged[code]) merged[code] = {};
    for (const [yearStr, rows] of Object.entries(byYear)) {
      const year = Number(yearStr);
      if (Number.isFinite(year)) {
        merged[code][year] = rows;
      }
    }
  }
  return merged;
}

export async function loadCutoffData(): Promise<{
  cutoffData: CutoffData;
  usingGenericFallback: boolean;
}> {
  try {
    const [mainRes, electiveRes] = await Promise.all([
      fetch("/dse-cutoffs.md"),
      fetch("/dse-cutoffs-electives.md"),
    ]);

    if (!mainRes.ok) {
      throw new Error(`Failed to load cutoff file. Status ${mainRes.status}`);
    }

    const markdown = await mainRes.text();
    let cutoffData: CutoffDataByYear;

    if (/^# HKDSE 歷年 Cut-Off|^##\s+1\.\s+中國語文/.test(markdown)) {
      cutoffData = parseHkdseCutoffMarkdown(markdown);
    } else {
      cutoffData = parseCutoffMarkdown(markdown);
    }

    if (electiveRes.ok) {
      const electiveMarkdown = await electiveRes.text();
      if (/HKDSE Historical Cut-Off|### Physics/.test(electiveMarkdown)) {
        const electiveData = parseHkdseElectiveCutoffMarkdown(electiveMarkdown);
        cutoffData = mergeCutoffData(cutoffData, electiveData);
      }
    }

    if (Object.keys(cutoffData).length === 0) {
      throw new Error("Cutoff markdown was parsed but no subject cutoffs were found.");
    }

    return { cutoffData, usingGenericFallback: false };
  } catch (error) {
    console.warn(
      "Could not load subject-specific DSE cutoff data. Falling back to generic cutoffs.",
      error
    );
    return { cutoffData: {} as CutoffDataByYear, usingGenericFallback: true };
  }
}

/**
 * Returns true if cutoff data has subject-specific data for the given year.
 * For year-based data: requires the exact year to exist (no nearest-year fallback).
 */
export function hasSubjectCutoffData(
  cutoffData: CutoffData,
  subjectKey: string,
  examYear?: number
): boolean {
  if (Object.keys(cutoffData).length === 0) return false;
  const normalizedKey = subjectKey.trim().toUpperCase();
  if (isCutoffDataByYear(cutoffData)) {
    const bySubject = cutoffData[normalizedKey];
    if (!bySubject) return false;
    const yearToUse = examYear ?? new Date().getFullYear();
    return bySubject[yearToUse] != null;
  }
  return normalizedKey in cutoffData;
}

function getCutoffRowsForYear(
  subjectKey: string,
  examYear: number,
  cutoffData: CutoffDataByYear
): CutoffRow[] | null {
  const normalizedKey = subjectKey.trim().toUpperCase();
  const bySubject = cutoffData[normalizedKey];
  if (!bySubject) return null;

  if (bySubject[examYear]) return bySubject[examYear];

  const years = Object.keys(bySubject)
    .map(Number)
    .filter((y) => Number.isFinite(y))
    .sort((a, b) => b - a);
  if (years.length === 0) return null;

  const nearest = years.reduce((prev, curr) =>
    Math.abs(curr - examYear) < Math.abs(prev - examYear) ? curr : prev
  );
  return bySubject[nearest];
}

function getCutoffRowsLegacy(
  subjectKey: string,
  cutoffData: Record<string, CutoffRow[]>
): CutoffRow[] {
  const normalizedKey = subjectKey.trim().toUpperCase();
  return cutoffData[normalizedKey] ?? GENERIC_CUTOFFS;
}

/**
 * Estimates DSE level based on percentage, subject, and exam year.
 * Uses year-specific cutoffs from HKDSE historical data when available.
 * Falls back to nearest year, then generic cutoffs.
 */
export function estimateDseLevel(
  subjectKey: string,
  percentage: number,
  cutoffData: CutoffData,
  examYear?: number
): string {
  if (isCutoffDataByYear(cutoffData)) {
    const yearToUse = examYear ?? new Date().getFullYear();
    const cutoffs = getCutoffRowsForYear(subjectKey, yearToUse, cutoffData);
    if (cutoffs) {
      for (const row of cutoffs) {
        if (percentage >= row.minimumPercentage) {
          return row.level;
        }
      }
      return "U";
    }
  } else {
    const cutoffs = getCutoffRowsLegacy(
      subjectKey,
      cutoffData as Record<string, CutoffRow[]>
    );
    for (const row of cutoffs) {
      if (percentage >= row.minimumPercentage) {
        return row.level;
      }
    }
    return "U";
  }

  const cutoffs = GENERIC_CUTOFFS;
  for (const row of cutoffs) {
    if (percentage >= row.minimumPercentage) {
      return row.level;
    }
  }
  return "U";
}

export function getGenericCutoffs(): CutoffRow[] {
  return GENERIC_CUTOFFS;
}
