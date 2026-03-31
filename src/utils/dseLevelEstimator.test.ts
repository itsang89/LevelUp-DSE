import { describe, expect, it } from "vitest";
import type { CutoffData } from "../types";
import {
  estimateDseLevel,
  getMarksToNextLevel,
  hasSubjectCutoffData,
  resolveCutoffSubjectKey,
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
  it("returns true only for exact subject+year matches", () => {
    expect(hasSubjectCutoffData(cutoffData, "CHI", 2024)).toBe(true);
    expect(hasSubjectCutoffData(cutoffData, "CHI", 2023)).toBe(false);
    expect(hasSubjectCutoffData(cutoffData, "UNKNOWN", 2024)).toBe(false);
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

  it("falls back to generic cutoffs for unknown subjects", () => {
    expect(estimateDseLevel("UNKNOWN", 75, cutoffData, 2024)).toBe("5");
    expect(estimateDseLevel("UNKNOWN", 29, cutoffData, 2024)).toBe("U");
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
