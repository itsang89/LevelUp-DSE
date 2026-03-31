import { beforeEach, describe, expect, it } from "vitest";
import type { PastPaperAttempt, PlannerCell, Subject } from "../types";
import type { StudyGoal } from "./api/goalsApi";
import {
  clearAllGuestData,
  getGuestPastPapers,
  getGuestPlannerCells,
  getGuestStudyGoals,
  getGuestSubjects,
  hasGuestData,
  isGuestMode,
  setGuestMode,
  setGuestPastPapers,
  setGuestPlannerCells,
  setGuestStudyGoals,
  setGuestSubjects,
} from "./localStorageService";

const SUBJECTS: Subject[] = [
  { id: "math", name: "Mathematics", shortCode: "MATH", baseColor: "#3b82f6", paperLabels: ["Paper 1"] },
];
const CELLS: PlannerCell[] = [
  {
    date: "2026-04-01",
    sessionId: "morning",
    task: { id: "task-1", subjectId: "math", title: "Revise algebra", isDone: false },
  },
];
const ATTEMPTS: PastPaperAttempt[] = [
  {
    id: "attempt-1",
    subjectId: "math",
    examYear: 2025,
    paperLabel: "Paper 1",
    date: "2026-03-30",
    score: 70,
    total: 100,
    percentage: 70,
    estimatedLevel: "4",
  },
];
const GOALS: StudyGoal[] = [{ id: "goal-1", subjectId: "math", weeklyTarget: 4 }];

describe("localStorageService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores and reads guest mode flag", () => {
    expect(isGuestMode()).toBe(false);
    setGuestMode(true);
    expect(isGuestMode()).toBe(true);
    setGuestMode(false);
    expect(isGuestMode()).toBe(false);
  });

  it("stores and reads all guest datasets", () => {
    setGuestSubjects(SUBJECTS);
    setGuestPlannerCells(CELLS);
    setGuestPastPapers(ATTEMPTS);
    setGuestStudyGoals(GOALS);

    expect(getGuestSubjects()).toEqual(SUBJECTS);
    expect(getGuestPlannerCells()).toEqual(CELLS);
    expect(getGuestPastPapers()).toEqual(ATTEMPTS);
    expect(getGuestStudyGoals()).toEqual(GOALS);
  });

  it("returns default empty arrays for missing or invalid data", () => {
    expect(getGuestSubjects()).toEqual([]);
    localStorage.setItem("guest_subjects", "not-json");
    expect(getGuestSubjects()).toEqual([]);
  });

  it("detects if guest has any stored data", () => {
    expect(hasGuestData()).toBe(false);
    setGuestSubjects(SUBJECTS);
    expect(hasGuestData()).toBe(true);
  });

  it("clears all guest data and mode", () => {
    setGuestMode(true);
    setGuestSubjects(SUBJECTS);
    setGuestPlannerCells(CELLS);
    setGuestPastPapers(ATTEMPTS);
    setGuestStudyGoals(GOALS);

    clearAllGuestData();

    expect(isGuestMode()).toBe(false);
    expect(getGuestSubjects()).toEqual([]);
    expect(getGuestPlannerCells()).toEqual([]);
    expect(getGuestPastPapers()).toEqual([]);
    expect(getGuestStudyGoals()).toEqual([]);
    expect(hasGuestData()).toBe(false);
  });
});
