import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PastPaperAttempt, PlannerCell, Subject } from "../types";
import {
  exportPastPapersCsv,
  exportPastPapersJson,
  exportPlannerCsv,
  exportPlannerJson,
  getExportFilename,
} from "./exportUtils";

const subjectsById: Record<string, Subject> = {
  eng: {
    id: "eng",
    name: "English Language",
    shortCode: "ENG",
    baseColor: "#ffffff",
  },
};

describe("exportUtils", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("exports past papers CSV with escaped values and derived fields", () => {
    const attempts: PastPaperAttempt[] = [
      {
        id: "a1",
        subjectId: "eng",
        examYear: 2025,
        paperLabel: 'Paper "1", Reading',
        date: "2026-03-21",
        score: 76,
        total: 100,
        percentage: 76,
        estimatedLevel: "5",
        isDse: false,
        notes: "Line 1\nLine 2",
      },
    ];

    const csv = exportPastPapersCsv(attempts, subjectsById);
    expect(csv).toContain("Date,Subject,Exam Year,Paper,Score,Total,Percentage,Estimated Level,Type,Notes");
    expect(csv).toContain('"Paper ""1"", Reading"');
    expect(csv).toContain('"Line 1\nLine 2"');
    expect(csv).toContain("Mock");
    expect(csv).toContain("76.0%");
  });

  it("exports planner CSV only for cells with tasks", () => {
    const cells: PlannerCell[] = [
      {
        date: "2026-04-01",
        sessionId: "s1",
        task: { id: "t1", subjectId: "eng", title: "Paper 2 practice", notes: "Focus intro" },
      },
      {
        date: "2026-04-01",
        sessionId: "s2a",
        task: null,
      },
    ];

    const csv = exportPlannerCsv(cells, subjectsById);
    expect(csv.split("\n")).toHaveLength(2);
    expect(csv).toContain("Session 1");
    expect(csv).toContain("English Language");
    expect(csv).toContain("Paper 2 practice");
  });

  it("exports JSON payloads without transforming records", () => {
    const attempts: PastPaperAttempt[] = [
      {
        id: "a2",
        subjectId: "eng",
        examYear: 2024,
        paperLabel: "Paper 1",
        date: "2026-03-21",
        score: 65,
        total: 100,
        percentage: 65,
        estimatedLevel: "4",
      },
    ];
    const cells: PlannerCell[] = [{ date: "2026-04-01", sessionId: "s1", task: null }];

    expect(JSON.parse(exportPastPapersJson(attempts))).toEqual(attempts);
    expect(JSON.parse(exportPlannerJson(cells))).toEqual(cells);
  });

  it("builds deterministic export filenames from current date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T08:00:00.000Z"));

    expect(getExportFilename("past-papers", "csv")).toBe("dse-past-papers-2026-04-01.csv");
  });
});
