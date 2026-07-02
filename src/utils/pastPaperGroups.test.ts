import { describe, expect, it } from "vitest";
import type { CutoffData, PastPaperAttempt, Subject } from "../types";
import {
  buildPastPaperGroupModel,
  buildSortedPastPaperGroups,
  getMissingRequiredPaperLabels,
  groupPastPaperAttempts,
  normalizedPaperWeights,
  pastPaperGroupKey,
} from "./pastPaperGroups";

const cutoffData: CutoffData = {
  CHI: {
    2024: [
      { level: "5**", minimumPercentage: 90 },
      { level: "5*", minimumPercentage: 80 },
      { level: "5", minimumPercentage: 70 },
      { level: "4", minimumPercentage: 60 },
      { level: "3", minimumPercentage: 50 },
      { level: "2", minimumPercentage: 40 },
    ],
  },
};

const chiSubject: Subject = {
  id: "chi",
  name: "Chinese Language",
  shortCode: "CHI",
  baseColor: "#fff",
  paperLabels: ["Paper 1 (Reading)", "Paper 2 (Writing)"],
  paperWeights: { "Paper 1 (Reading)": 0.4706, "Paper 2 (Writing)": 0.5294 },
};

const mathSubject: Subject = {
  id: "math",
  name: "Mathematics",
  shortCode: "MATH",
  baseColor: "#0f0",
  paperLabels: ["Paper 1", "Paper 2"],
  paperWeights: { "Paper 1": 0.65, "Paper 2": 0.35 },
};

const unknownSubject: Subject = {
  id: "frn",
  name: "French",
  shortCode: "FRN",
  baseColor: "#00f",
  paperLabels: ["Paper 1"],
};

function attempt(overrides: Partial<PastPaperAttempt>): PastPaperAttempt {
  return {
    id: overrides.id ?? "a",
    subjectId: "chi",
    examYear: 2024,
    paperLabel: "Paper 1 (Reading)",
    date: "2026-04-01",
    score: 70,
    total: 100,
    percentage: 70,
    estimatedLevel: "4",
    isDse: true,
    ...overrides,
  };
}

describe("pastPaperGroupKey", () => {
  it("keeps DSE and mock of same subject+year in separate groups", () => {
    const dse = attempt({ id: "a1", isDse: true });
    const mock = attempt({ id: "a2", isDse: false });
    expect(pastPaperGroupKey(dse)).not.toBe(pastPaperGroupKey(mock));
  });

  it("treats undefined isDse as DSE", () => {
    const explicit = attempt({ id: "a1", isDse: true });
    const implicit = attempt({ id: "a2", isDse: undefined });
    expect(pastPaperGroupKey(implicit)).toBe(pastPaperGroupKey(explicit));
  });

  it("groups same subject+year+dse regardless of paper label", () => {
    const a = attempt({ id: "a1", paperLabel: "Paper 1 (Reading)" });
    const b = attempt({ id: "a2", paperLabel: "Paper 2 (Writing)" });
    expect(pastPaperGroupKey(a)).toBe(pastPaperGroupKey(b));
  });
});

describe("normalizedPaperWeights", () => {
  it("returns empty when no labels", () => {
    expect(normalizedPaperWeights([], undefined)).toEqual({});
  });

  it("splits equally when no weights provided", () => {
    const out = normalizedPaperWeights(["Paper 1", "Paper 2"], undefined);
    expect(out["Paper 1"]).toBeCloseTo(0.5);
    expect(out["Paper 2"]).toBeCloseTo(0.5);
  });

  it("renormalizes so weights sum to 1", () => {
    const out = normalizedPaperWeights(
      ["Paper 1", "Paper 2"],
      { "Paper 1": 0.65, "Paper 2": 0.35 },
    );
    const sum = Object.values(out).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1);
    expect(out["Paper 1"]).toBeCloseTo(0.65);
  });

  it("treats missing or zero weight as 1", () => {
    const out = normalizedPaperWeights(
      ["Paper 1", "Paper 2"],
      { "Paper 1": 0 },
    );
    expect(out["Paper 1"]).toBeCloseTo(0.5);
    expect(out["Paper 2"]).toBeCloseTo(0.5);
  });
});

describe("buildPastPaperGroupModel", () => {
  it("isComplete only when every required paper has a best attempt", () => {
    const onlyOne = [attempt({ id: "a1" })];
    const incomplete = buildPastPaperGroupModel(onlyOne, { chi: chiSubject }, cutoffData);
    expect(incomplete.isComplete).toBe(false);
    expect(incomplete.weightedPercentage).toBeNull();
    expect(incomplete.overallLevel).not.toBeNull(); // still estimates from partial

    const both = [
      attempt({
        id: "a1",
        paperLabel: "Paper 1 (Reading)",
        percentage: 70,
        score: 70,
      }),
      attempt({
        id: "a2",
        paperLabel: "Paper 2 (Writing)",
        percentage: 80,
        score: 80,
      }),
    ];
    const complete = buildPastPaperGroupModel(both, { chi: chiSubject }, cutoffData);
    expect(complete.isComplete).toBe(true);
    // weighted = 0.4706 * 70 + 0.5294 * 80 ≈ 75.29 → falls into "5" band
    expect(complete.weightedPercentage!).toBeCloseTo(75.294, 2);
    expect(complete.overallLevel).toBe("5");
    expect(complete.overallScoreSum).toBe(150);
    expect(complete.overallTotalSum).toBe(200);
  });

  it("uses formal JSON paper labels for best-attempt matching", () => {
    // MATH JSON config has "Paper 1" / "Paper 2" — same as the attempt labels
    const both = [
      attempt({ id: "a1", subjectId: "math", paperLabel: "Paper 1", percentage: 60 }),
      attempt({ id: "a2", subjectId: "math", paperLabel: "Paper 2", percentage: 70 }),
    ];
    const model = buildPastPaperGroupModel(both, { math: mathSubject }, cutoffData);
    expect(model.isComplete).toBe(true);
    expect(model.weightedPercentage!).toBeCloseTo(0.65 * 60 + 0.35 * 70, 2);
  });

  it("renormalizes partial weights when only one required paper present", () => {
    const onlyOne = [
      attempt({ id: "a1", paperLabel: "Paper 1 (Reading)", percentage: 80 }),
    ];
    const model = buildPastPaperGroupModel(onlyOne, { chi: chiSubject }, cutoffData);
    expect(model.isComplete).toBe(false);
    expect(model.levelBasisPercentage).toBeCloseTo(80);
    expect(model.overallLevel).toBe("5*"); // 80 ≥ 80
  });

  it("falls back to best-attempt % when no required papers present", () => {
    const stray = [
      attempt({ id: "a1", paperLabel: "Paper 99 (Random)", percentage: 65 }),
    ];
    const model = buildPastPaperGroupModel(stray, { chi: chiSubject }, cutoffData);
    expect(model.isComplete).toBe(false);
    expect(model.levelBasisPercentage).toBeCloseTo(65);
    expect(model.overallLevel).toBe("4"); // 65 ≥ 60
  });

  it("falls back to manual estimatedLevel when no cutoff data exists", () => {
    const a = [attempt({ id: "a1", subjectId: "frn", estimatedLevel: "5*" })];
    const model = buildPastPaperGroupModel(a, { frn: unknownSubject }, {});
    expect(model.overallLevel).toBe("5*");
  });

  it("marks levelIsExact false when nearest-year fallback is used", () => {
    const both = [
      attempt({
        id: "a1",
        paperLabel: "Paper 1 (Reading)",
        percentage: 70,
        examYear: 2023,
      }),
      attempt({
        id: "a2",
        paperLabel: "Paper 2 (Writing)",
        percentage: 70,
        examYear: 2023,
      }),
    ];
    const model = buildPastPaperGroupModel(both, { chi: chiSubject }, cutoffData);
    expect(model.levelIsExact).toBe(false);
    expect(model.levelResolvedYear).toBe(2024);
  });

  it("uses manual estimatedLevel for mock attempts when no cutoff data is matched", () => {
    const mock = attempt({
      id: "a1",
      isDse: false,
      estimatedLevel: "5*",
      paperLabel: "Paper 1 (Reading)",
    });
    const model = buildPastPaperGroupModel([mock], { chi: chiSubject }, {});
    expect(model.isComplete).toBe(false);
    expect(model.overallLevel).toBe("5*");
  });
});

describe("getMissingRequiredPaperLabels", () => {
  it("lists required paper labels with no best attempt", () => {
    const onlyOne = [attempt({ id: "a1", paperLabel: "Paper 1 (Reading)" })];
    const model = buildPastPaperGroupModel(onlyOne, { chi: chiSubject }, cutoffData);
    expect(getMissingRequiredPaperLabels(model)).toEqual(["Paper 2 (Writing)"]);
  });
});

describe("groupPastPaperAttempts", () => {
  it("groups attempts by subject+year+dse and preserves insertion order within a group", () => {
    const a = attempt({ id: "a1", paperLabel: "Paper 1 (Reading)" });
    const b = attempt({ id: "a2", paperLabel: "Paper 2 (Writing)" });
    const groups = groupPastPaperAttempts([a, b]);
    expect(groups.size).toBe(1);
    expect(groups.get(pastPaperGroupKey(a))).toEqual([a, b]);
  });

  it("splits when isDse differs even with same subject+year", () => {
    const dse = attempt({ id: "a1", isDse: true });
    const mock = attempt({ id: "a2", isDse: false });
    const groups = groupPastPaperAttempts([dse, mock]);
    expect(groups.size).toBe(2);
  });
});

describe("buildSortedPastPaperGroups", () => {
  it("sorts by examYear asc; ties break on subjectId", () => {
    const a2023 = [
      attempt({
        id: "a1",
        subjectId: "chi",
        examYear: 2023,
        paperLabel: "Paper 1 (Reading)",
        percentage: 70,
      }),
    ];
    const a2024 = [
      attempt({
        id: "a2",
        subjectId: "chi",
        examYear: 2024,
        paperLabel: "Paper 1 (Reading)",
        percentage: 70,
      }),
      attempt({
        id: "a3",
        subjectId: "chi",
        examYear: 2024,
        paperLabel: "Paper 2 (Writing)",
        percentage: 70,
      }),
    ];
    const sorted = buildSortedPastPaperGroups(
      [...a2024, ...a2023],
      { chi: chiSubject },
      cutoffData,
      "examYear",
      "asc",
    );
    expect(sorted.map((g) => g.examYear)).toEqual([2023, 2024]);
  });

  it("reverses order when sortDirection is desc", () => {
    const a2023 = [attempt({ id: "a1", examYear: 2023, paperLabel: "Paper 1 (Reading)" })];
    const a2024 = [attempt({ id: "a2", examYear: 2024, paperLabel: "Paper 1 (Reading)" })];
    const sorted = buildSortedPastPaperGroups(
      [...a2023, ...a2024],
      { chi: chiSubject },
      cutoffData,
      "examYear",
      "desc",
    );
    expect(sorted[0].examYear).toBe(2024);
    expect(sorted[1].examYear).toBe(2023);
  });

  it("sorts by percentage when key=percentage, desc puts higher first", () => {
    const low = [attempt({ id: "low", examYear: 2024, percentage: 40, paperLabel: "Paper 1 (Reading)" })];
    const high = [attempt({ id: "high", examYear: 2025, percentage: 90, paperLabel: "Paper 1 (Reading)" })];
    const sorted = buildSortedPastPaperGroups(
      [...low, ...high],
      { chi: chiSubject },
      cutoffData,
      "percentage",
      "desc",
    );
    expect(sorted[0].examYear).toBe(2025);
  });
});