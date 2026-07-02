import { describe, expect, it } from "vitest";
import type { CutoffData } from "../types";
import {
  estimateDseLevel,
  getMarksToNextLevel,
  hasSubjectCutoffData,
  parseCutoffMarkdown,
  parseHkdseCutoffMarkdown,
  parseHkdseElectiveCutoffMarkdown,
  resolveCutoffSubjectKey,
  resolveCutoffYear,
} from "./dseLevelEstimator";

const cutoffData: CutoffData = {
  CHI: {
    2024: [
      { level: "5**", minimumPercentage: 88 },
      { level: "5*", minimumPercentage: 80 },
      { level: "5", minimumPercentage: 70 },
      { level: "4", minimumPercentage: 60 },
      { level: "3", minimumPercentage: 50 },
      { level: "2", minimumPercentage: 40 },
    ],
    2022: [
      { level: "5**", minimumPercentage: 90 },
      { level: "5*", minimumPercentage: 82 },
      { level: "5", minimumPercentage: 72 },
      { level: "4", minimumPercentage: 62 },
      { level: "3", minimumPercentage: 52 },
      { level: "2", minimumPercentage: 42 },
    ],
  },
  "CHI-HIST": {
    2024: [
      { level: "5**", minimumPercentage: 85 },
      { level: "5*", minimumPercentage: 77 },
      { level: "5", minimumPercentage: 67 },
      { level: "4", minimumPercentage: 57 },
      { level: "3", minimumPercentage: 47 },
      { level: "2", minimumPercentage: 37 },
    ],
  },
};

describe("resolveCutoffSubjectKey", () => {
  it("maps legacy keys to canonical keys", () => {
    expect(resolveCutoffSubjectKey("chist")).toBe("CHI-HIST");
    expect(resolveCutoffSubjectKey("CHILIT")).toBe("CHI-LIT");
    expect(resolveCutoffSubjectKey("MATH")).toBe("MATH");
  });
});

describe("hasSubjectCutoffData", () => {
  it("returns true for exact and nearest-year matches; false for unknown subjects", () => {
    expect(hasSubjectCutoffData(cutoffData, "CHI", 2024)).toBe(true);  // exact year
    expect(hasSubjectCutoffData(cutoffData, "CHI", 2023)).toBe(true);  // nearest-year fallback (2024)
    expect(hasSubjectCutoffData(cutoffData, "UNKNOWN", 2024)).toBe(false);
  });
});

describe("resolveCutoffYear", () => {
  it("returns exact match when the year exists", () => {
    expect(resolveCutoffYear("CHI", 2024, cutoffData)).toEqual({ year: 2024, isExact: true });
  });

  it("returns nearest year when exact year is missing", () => {
    expect(resolveCutoffYear("CHI", 2023, cutoffData)).toEqual({ year: 2024, isExact: false });
  });

  it("returns null for unknown subjects", () => {
    expect(resolveCutoffYear("UNKNOWN", 2024, cutoffData)).toBeNull();
  });
});

describe("estimateDseLevel", () => {
  it("uses exact year cutoffs when present", () => {
    expect(estimateDseLevel("CHI", 80, cutoffData, 2024)).toBe("5*");
    expect(estimateDseLevel("CHI", 39.9, cutoffData, 2024)).toBe("U");
  });

  it("falls back to nearest available year for a known subject", () => {
    expect(estimateDseLevel("CHI", 62, cutoffData, 2023)).toBe("4");
  });

  it("returns null for unknown subjects with no cutoff data", () => {
    expect(estimateDseLevel("UNKNOWN", 75, cutoffData, 2024)).toBeNull();
    expect(estimateDseLevel("UNKNOWN", 29, cutoffData, 2024)).toBeNull();
  });
});

describe("getMarksToNextLevel", () => {
  it("returns the gap to the next level", () => {
    const gap = getMarksToNextLevel("CHI", 64, cutoffData, 2024, 100);
    expect(gap).toEqual({
      nextLevel: "5",
      percentageGap: 6,
      marksGap: 6,
    });
  });

  it("returns null at top level or without cutoffs", () => {
    expect(getMarksToNextLevel("CHI", 90, cutoffData, 2024, 100)).toBeNull();
    expect(getMarksToNextLevel("UNKNOWN", 60, cutoffData, 2024, 100)).toBeNull();
  });
});

describe("parseHkdseCutoffMarkdown", () => {
  it("parses section-numbered year tables keyed by short code", () => {
    const md = `
## 1. 中國語文 (Chinese Language)
| 年份 | 滿分 | 5** | 5* | 5 | 4 | 3 | 2 |
|------|------|-----|-----|---|---|---|---|
| 2024 | 100  | 88 (88%) | 80 (80%) | 70 (70%) | 60 (60%) | 50 (50%) | 40 (40%) |
`;
    const data = parseHkdseCutoffMarkdown(md);
    expect(data.CHI?.[2024]).toEqual([
      { level: "5**", minimumPercentage: 88 },
      { level: "5*", minimumPercentage: 80 },
      { level: "5", minimumPercentage: 70 },
      { level: "4", minimumPercentage: 60 },
      { level: "3", minimumPercentage: 50 },
      { level: "2", minimumPercentage: 40 },
    ]);
  });

  it("drops rows with em-dash or N/A cells", () => {
    const md = `
## 1. 中國語文
| 年份 | 滿分 | 5** | 5* | 5 | 4 | 3 | 2 |
|------|------|-----|-----|---|---|---|---|
| 2024 | 100  | — | 80 (80%) | — | 60 (60%) | N/A | — |
`;
    const data = parseHkdseCutoffMarkdown(md);
    expect(data.CHI?.[2024]).toEqual([
      { level: "5*", minimumPercentage: 80 },
      { level: "4", minimumPercentage: 60 },
    ]);
  });

  it("drops rows with year outside MIN..MAX bounds", () => {
    const md = `
## 1. 中國語文
| 年份 | 滿分 | 5** | 5* | 5 | 4 | 3 | 2 |
|------|------|-----|-----|---|---|---|---|
| 1999 | 100  | 90 (90%) | 80 (80%) | 70 (70%) | 60 (60%) | 50 (50%) | 40 (40%) |
| 2024 | 100  | 90 (90%) | 80 (80%) | 70 (70%) | 60 (60%) | 50 (50%) | 40 (40%) |
`;
    const data = parseHkdseCutoffMarkdown(md);
    expect(Object.keys(data.CHI ?? {})).toEqual(["2024"]);
  });

  it("ignores unknown section numbers", () => {
    const md = `
## 99. Not A Real Subject
| 年份 | 滿分 | 5** | 5* | 5 | 4 | 3 | 2 |
|------|------|-----|-----|---|---|---|---|
| 2024 | 100  | 90 (90%) | 80 (80%) | 70 (70%) | 60 (60%) | 50 (50%) | 40 (40%) |
`;
    expect(parseHkdseCutoffMarkdown(md)).toEqual({});
  });
});

describe("parseHkdseElectiveCutoffMarkdown", () => {
  it("parses elective headings into canonical short codes", () => {
    const md = `
### Physics (PHY)
| Year | Max | 5** | 5* | 5 | 4 | 3 | 2 |
|------|-----|-----|-----|---|---|---|---|
| 2024 | 100 | 80 (80%) | 70 (70%) | 60 (60%) | 50 (50%) | 40 (40%) | 30 (30%) |

### BAFS
| Year | Max | 5** | 5* | 5 | 4 | 3 | 2 |
|------|-----|-----|-----|---|---|---|---|
| 2024 | 100 | 85 (85%) | 75 (75%) | 65 (65%) | 55 (55%) | 45 (45%) | 35 (35%) |
`;
    const data = parseHkdseElectiveCutoffMarkdown(md);
    expect(data.PHY?.[2024]?.[0]).toEqual({ level: "5**", minimumPercentage: 80 });
    expect(data.BAFS?.[2024]?.[0]).toEqual({ level: "5**", minimumPercentage: 85 });
  });

  it("returns null for an unrecognised elective heading", () => {
    const md = `
### Made Up Subject (XYZ)
| Year | Max | 5** | 5* | 5 | 4 | 3 | 2 |
|------|-----|-----|-----|---|---|---|---|
| 2024 | 100 | 90 (90%) | 80 (80%) | 70 (70%) | 60 (60%) | 50 (50%) | 40 (40%) |
`;
    expect(parseHkdseElectiveCutoffMarkdown(md)).toEqual({});
  });
});

describe("parseCutoffMarkdown (legacy)", () => {
  it("puts legacy tables under a synthetic year 0 key", () => {
    const md = `
## Chinese Language (CHI)
| Level | Minimum % |
|-------|-----------|
| 5**   | 88 |
| 5*    | 80 |
| 5     | 70 |
`;
    const data = parseCutoffMarkdown(md);
    expect(data.CHI?.[0]).toEqual([
      { level: "5**", minimumPercentage: 88 },
      { level: "5*", minimumPercentage: 80 },
      { level: "5", minimumPercentage: 70 },
    ]);
  });

  it("returns empty object when no rows are parsed", () => {
    const md = "## Chinese (CHI)\nNo table here.\n";
    expect(parseCutoffMarkdown(md)).toEqual({});
  });
});

describe("estimateDseLevel edge cases", () => {
  it("returns null when cutoffData is empty (no generic fallback)", () => {
    expect(estimateDseLevel("CHI", 80, {})).toBeNull();
  });

  it("uses current year when examYear is omitted", () => {
    const thisYear = new Date().getFullYear();
    const dataWithThisYear: CutoffData = {
      CHI: {
        [thisYear]: [
          { level: "5**", minimumPercentage: 90 },
          { level: "5*", minimumPercentage: 80 },
          { level: "5", minimumPercentage: 70 },
          { level: "4", minimumPercentage: 60 },
          { level: "3", minimumPercentage: 50 },
          { level: "2", minimumPercentage: 40 },
        ],
      },
    };
    expect(estimateDseLevel("CHI", 85, dataWithThisYear)).toBe("5*");
  });
});

describe("getMarksToNextLevel edge cases", () => {
  it("returns null when percentageGap is not positive", () => {
    // 88 hits 5** band; no positive gap
    expect(getMarksToNextLevel("CHI", 88, cutoffData, 2024, 100)).toBeNull();
  });

  it("scales marksGap by totalMarks", () => {
    const gap = getMarksToNextLevel("CHI", 64, cutoffData, 2024, 200);
    expect(gap?.marksGap).toBeCloseTo(12); // 6% of 200
  });
});
