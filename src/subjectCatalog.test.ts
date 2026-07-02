import { describe, expect, it } from "vitest";
import { DEFAULT_SUBJECTS, PRESET_SUBJECTS, buildDefaultSubjects, buildPresetSubjects } from "./subjectCatalog";

describe("buildPresetSubjects", () => {
  it("merges subject_weighting.json and subjectExtras.json without duplicates", () => {
    const presets = buildPresetSubjects();
    const codes = presets.map((p) => p.shortCode.trim().toUpperCase());
    expect(new Set(codes).size).toBe(codes.length);
    // THS comes from extras only
    expect(codes).toContain("THS");
    // ENG comes from weighting
    expect(codes).toContain("ENG");
  });

  it("includes a non-empty paperLabels array for every preset", () => {
    const presets = buildPresetSubjects();
    for (const preset of presets) {
      expect(preset.paperLabels.length, `${preset.shortCode} missing papers`).toBeGreaterThan(0);
    }
  });
});

describe("buildDefaultSubjects", () => {
  it("returns exactly the four default subjects in canonical order", () => {
    const defaults = buildDefaultSubjects();
    expect(defaults.map((s) => s.shortCode)).toEqual(["CHI", "ENG", "MATH", "C&SD"]);
    expect(defaults.map((s) => s.id)).toEqual(["chi", "eng", "math", "csd"]);
  });

  it("uses SUBJECT_BASE_COLORS for default codes when present", () => {
    const defaults = buildDefaultSubjects();
    const chi = defaults.find((s) => s.shortCode === "CHI");
    expect(chi?.baseColor).toBe("#ef4444");
  });
});

describe("module-level exports", () => {
  it("PRESET_SUBJECTS is the same array as buildPresetSubjects() returns", () => {
    expect(PRESET_SUBJECTS.length).toBe(buildPresetSubjects().length);
  });

  it("DEFAULT_SUBJECTS is the same array as buildDefaultSubjects() returns", () => {
    expect(DEFAULT_SUBJECTS.map((s) => s.id)).toEqual(buildDefaultSubjects().map((s) => s.id));
  });
});