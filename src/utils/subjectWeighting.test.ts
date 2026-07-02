import { describe, expect, it } from "vitest";
import {
  attemptMatchesFormalPaper,
  getSubjectWeightingFromJson,
  paperSlotKey,
  resolveWeightingSubjectCode,
} from "./subjectWeighting";

describe("resolveWeightingSubjectCode", () => {
  it("maps legacy / spaced codes to canonical hyphenated form", () => {
    expect(resolveWeightingSubjectCode("chist")).toBe("CHI-HIST");
    expect(resolveWeightingSubjectCode("CHI HIST")).toBe("CHI-HIST");
    expect(resolveWeightingSubjectCode("chilit")).toBe("CHI-LIT");
    expect(resolveWeightingSubjectCode("CHI LIT")).toBe("CHI-LIT");
    expect(resolveWeightingSubjectCode("LIT ENG")).toBe("ENG-LIT");
    expect(resolveWeightingSubjectCode("C&SD")).toBe("C&SD");
    expect(resolveWeightingSubjectCode("csd")).toBe("C&SD");
  });

  it("passes through unknown codes unchanged (uppercased)", () => {
    expect(resolveWeightingSubjectCode("math")).toBe("MATH");
    expect(resolveWeightingSubjectCode("  chem  ")).toBe("CHEM");
  });
});

describe("getSubjectWeightingFromJson", () => {
  it("returns the config for a known code", () => {
    const cfg = getSubjectWeightingFromJson("MATH");
    expect(cfg?.subjectCode).toBe("MATH");
    expect(cfg?.papers).toEqual([
      { label: "Paper 1", weight: 0.65 },
      { label: "Paper 2", weight: 0.35 },
    ]);
  });

  it("resolves legacy alias before lookup", () => {
    const cfg = getSubjectWeightingFromJson("CHIST");
    expect(cfg?.subjectCode).toBe("CHI-HIST");
    expect(cfg?.papers?.[0].label).toBe("Paper 1 (卷一)");
  });

  it("returns null for an unknown code", () => {
    expect(getSubjectWeightingFromJson("ZZZ")).toBeNull();
  });
});

describe("paperSlotKey", () => {
  it("collapses paper labels to a normalised key", () => {
    expect(paperSlotKey("Paper 1")).toBe("p1");
    expect(paperSlotKey("Paper 1 (Reading)")).toBe("p1");
    expect(paperSlotKey("Paper 2A")).toBe("p2a");
    expect(paperSlotKey("Paper 99 (Random)")).toBe("p99");
  });

  it("returns the bare word for non-paper labels", () => {
    expect(paperSlotKey("SBA")).toBe("sba");
  });
});

describe("attemptMatchesFormalPaper", () => {
  it("matches a formal label against an attempt's paper slot", () => {
    const formals = ["Paper 1 (Reading)", "Paper 2 (Writing)"];
    expect(
      attemptMatchesFormalPaper("Paper 1", "Paper 1 (Reading)", formals),
    ).toBe(true);
    expect(
      attemptMatchesFormalPaper("Paper 1 (Reading)", "Paper 1 (Reading)", formals),
    ).toBe(true);
    expect(
      attemptMatchesFormalPaper("Paper 2", "Paper 1 (Reading)", formals),
    ).toBe(false);
  });

  it("matches M1/M2-style attempts to a single 'Paper' formal when it's the only formal", () => {
    expect(attemptMatchesFormalPaper("Paper", "Paper", ["Paper"])).toBe(true);
    expect(attemptMatchesFormalPaper("Paper 1", "Paper", ["Paper"])).toBe(true);
    expect(attemptMatchesFormalPaper("Module 1", "Paper", ["Paper"])).toBe(true);
    expect(attemptMatchesFormalPaper("M1", "Paper", ["Paper"])).toBe(true);
    expect(attemptMatchesFormalPaper("M2", "Paper", ["Paper"])).toBe(true);
  });
});