import type { CutoffData, CutoffRow, DseLevel } from "../types";

const LEVEL_ORDER: DseLevel[] = ["5**", "5*", "5", "4", "3", "2", "1"];

const GENERIC_CUTOFFS: CutoffRow[] = [
  { level: "5**", minimumPercentage: 90 },
  { level: "5*", minimumPercentage: 80 },
  { level: "5", minimumPercentage: 70 },
  { level: "4", minimumPercentage: 60 },
  { level: "3", minimumPercentage: 50 },
  { level: "2", minimumPercentage: 40 },
  { level: "1", minimumPercentage: 30 },
];

function normalizeRows(rows: CutoffRow[]): CutoffRow[] {
  return [...rows].sort(
    (a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level)
  );
}

/**
 * Parses markdown tables under `## Subject (CODE)` headings into cutoff data.
 * The parser is intentionally strict about table row shape so malformed rows are ignored.
 */
export function parseCutoffMarkdown(markdown: string): CutoffData {
  const data: CutoffData = {};
  let currentCode: string | null = null;

  for (const line of markdown.split("\n")) {
    const headingMatch = line.match(/^##\s+.+\(([^)]+)\)\s*$/);
    if (headingMatch) {
      currentCode = headingMatch[1].trim().toUpperCase();
      if (!data[currentCode]) {
        data[currentCode] = [];
      }
      continue;
    }

    if (!currentCode) {
      continue;
    }

    const rowMatch = line.match(
      /^\|\s*(5\*\*|5\*|5|4|3|2|1)\s*\|\s*([0-9]+(?:\.[0-9]+)?)\s*\|/
    );
    if (rowMatch) {
      const level = rowMatch[1] as DseLevel;
      const minimumPercentage = Number(rowMatch[2]);
      data[currentCode].push({ level, minimumPercentage });
    }
  }

  for (const key of Object.keys(data)) {
    if (data[key].length === 0) {
      delete data[key];
    } else {
      data[key] = normalizeRows(data[key]);
    }
  }

  return data;
}

export async function loadCutoffData(): Promise<{
  cutoffData: CutoffData;
  usingGenericFallback: boolean;
}> {
  try {
    const response = await fetch("/dse-cutoffs.md");
    if (!response.ok) {
      throw new Error(`Failed to load cutoff file. Status ${response.status}`);
    }

    const markdown = await response.text();
    const cutoffData = parseCutoffMarkdown(markdown);
    if (Object.keys(cutoffData).length === 0) {
      throw new Error("Cutoff markdown was parsed but no subject cutoffs were found.");
    }

    return { cutoffData, usingGenericFallback: false };
  } catch (error) {
    console.warn(
      "Could not load subject-specific DSE cutoff data. Falling back to generic cutoffs.",
      error
    );
    return { cutoffData: {}, usingGenericFallback: true };
  }
}

function getCutoffRows(subjectKey: string, cutoffData: CutoffData): CutoffRow[] {
  const normalizedKey = subjectKey.trim().toUpperCase();
  return cutoffData[normalizedKey] ?? GENERIC_CUTOFFS;
}

/**
 * Estimates DSE level based on percentage and subject-specific cutoffs.
 * Falls back to generic cutoffs if subject key is not found.
 */
export function estimateDseLevel(
  subjectKey: string,
  percentage: number,
  cutoffData: CutoffData
): string {
  const cutoffs = getCutoffRows(subjectKey, cutoffData);
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
