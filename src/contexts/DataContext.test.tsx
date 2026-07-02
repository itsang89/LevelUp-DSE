import { act, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlannerCell, StudyGoal } from "../types";

// ---- Mocks (hoisted) ----

const { fromMock, authMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  authMock: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
}));

function makeChain(terminal: { data?: unknown; error?: unknown; count?: number | null } = {}) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => Promise.resolve(terminal));
  chain.update = vi.fn(() => Promise.resolve(terminal));
  chain.upsert = vi.fn(() => Promise.resolve(terminal));
  chain.delete = vi.fn(() => Promise.resolve(terminal));
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.then = (onFulfilled: (v: unknown) => unknown) =>
    Promise.resolve(terminal).then(onFulfilled);
  return chain;
}

beforeEach(() => {
  fromMock.mockReset();
  fromMock.mockImplementation(() => makeChain({ data: [], error: null }));
  authMock.getSession.mockReset();
  authMock.onAuthStateChange.mockReset();
  authMock.getSession.mockResolvedValue({ data: { session: null }, error: null });
  authMock.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
});

vi.mock("../lib/supabase", () => ({
  getSupabaseClient: () => ({ from: fromMock, auth: authMock }),
  isSupabaseConfigured: true,
}));

const seedDefaultSubjectsMock = vi.fn();
const upsertPlannerCellMock = vi.fn();
const createPastPaperAttemptMock = vi.fn();
const updatePastPaperAttemptMock = vi.fn();
const upsertStudyGoalMock = vi.fn();
const listSubjectsMock = vi.fn();
const listPlannerCellsMock = vi.fn();

vi.mock("../lib/api/subjectsApi", () => ({
  listSubjects: (...args: unknown[]) => listSubjectsMock(...args),
  seedDefaultSubjects: (...args: unknown[]) => seedDefaultSubjectsMock(...args),
}));

vi.mock("../lib/api/plannerApi", () => ({
  listPlannerCells: (...args: unknown[]) => listPlannerCellsMock(...args),
  upsertPlannerCell: (...args: unknown[]) => upsertPlannerCellMock(...args),
}));

vi.mock("../lib/api/pastPapersApi", () => ({
  createPastPaperAttempt: (...args: unknown[]) => createPastPaperAttemptMock(...args),
  updatePastPaperAttempt: (...args: unknown[]) => updatePastPaperAttemptMock(...args),
}));

vi.mock("../lib/api/goalsApi", () => ({
  upsertStudyGoal: (...args: unknown[]) => upsertStudyGoalMock(...args),
}));

beforeEach(() => {
  seedDefaultSubjectsMock.mockReset();
  upsertPlannerCellMock.mockReset();
  createPastPaperAttemptMock.mockReset();
  updatePastPaperAttemptMock.mockReset();
  upsertStudyGoalMock.mockReset();
  listSubjectsMock.mockReset();
  listPlannerCellsMock.mockReset();

  listSubjectsMock.mockResolvedValue([]);
  listPlannerCellsMock.mockResolvedValue([]);
  upsertPlannerCellMock.mockResolvedValue(undefined);
  createPastPaperAttemptMock.mockResolvedValue(undefined);
  updatePastPaperAttemptMock.mockResolvedValue(undefined);
  upsertStudyGoalMock.mockResolvedValue(undefined);
  seedDefaultSubjectsMock.mockResolvedValue(undefined);
});

// fetch stub: cutoff files don't exist in tests; should fall through to generic fallback
beforeEach(() => {
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve("") }),
  ) as unknown as typeof fetch;
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

import { DataProvider, useData } from "./DataContext";
import {
  clearAllGuestData,
  setGuestPastPapers,
  setGuestPlannerCells,
  setGuestStudyGoals,
  setGuestSubjects,
} from "../lib/localStorageService";
import type { PastPaperAttempt, Subject } from "../types";

afterEach(() => {
  localStorage.clear();
});

function CaptureContext({ onReady }: { onReady: (api: ReturnType<typeof useData>) => void }) {
  const api = useData();
  // fire once the auth loading settles
  if (!api.authLoading) {
    onReady(api);
  }
  return null;
}

function renderProvider(onReady: (api: ReturnType<typeof useData>) => void) {
  return render(
    <DataProvider>
      <CaptureContext onReady={onReady} />
    </DataProvider>,
  );
}

describe("DataProvider.migrateGuestDataToAccount", () => {
  it("is a no-op when there is no guest data", async () => {
    let api!: ReturnType<typeof useData>;
    renderProvider((a) => {
      api = a;
    });

    await waitFor(() => expect(api).toBeDefined());
    await act(async () => {
      await api.migrateGuestDataToAccount("user-1");
    });

    expect(seedDefaultSubjectsMock).not.toHaveBeenCalled();
    expect(upsertPlannerCellMock).not.toHaveBeenCalled();
    expect(createPastPaperAttemptMock).not.toHaveBeenCalled();
    expect(upsertStudyGoalMock).not.toHaveBeenCalled();
  });

  it("calls subject, cell, attempt, goal seed APIs in that order", async () => {
    const subjects: Subject[] = [
      { id: "math", name: "Math", shortCode: "MATH", baseColor: "#000", paperLabels: [] },
    ];
    const cells: PlannerCell[] = [
      {
        date: "2026-04-01",
        sessionId: "s1",
        task: { id: "t1", subjectId: "math", title: "Algebra", isDone: false },
      },
    ];
    const attempts: PastPaperAttempt[] = [
      {
        id: "a1",
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
    const goals: StudyGoal[] = [{ id: "g1", subjectId: "math", weeklyTarget: 3 }];
    setGuestSubjects(subjects);
    setGuestPlannerCells(cells);
    setGuestPastPapers(attempts);
    setGuestStudyGoals(goals);

    const order: string[] = [];
    seedDefaultSubjectsMock.mockImplementation(() => {
      order.push("subjects");
      return Promise.resolve();
    });
    upsertPlannerCellMock.mockImplementation(() => {
      order.push("cells");
      return Promise.resolve();
    });
    createPastPaperAttemptMock.mockImplementation(() => {
      order.push("attempts");
      return Promise.resolve();
    });
    upsertStudyGoalMock.mockImplementation(() => {
      order.push("goals");
      return Promise.resolve();
    });

    let api!: ReturnType<typeof useData>;
    renderProvider((a) => {
      api = a;
    });
    await waitFor(() => expect(api).toBeDefined());

    await act(async () => {
      await api.migrateGuestDataToAccount("user-1");
    });

    expect(order).toEqual(["subjects", "cells", "attempts", "goals"]);
    expect(seedDefaultSubjectsMock).toHaveBeenCalledWith("user-1", subjects);
    expect(upsertPlannerCellMock).toHaveBeenCalledWith("user-1", "2026-04-01", "s1", cells[0].task);
    expect(createPastPaperAttemptMock).toHaveBeenCalledWith("user-1", attempts[0]);
    expect(upsertStudyGoalMock).toHaveBeenCalledWith("user-1", "math", 3);
  });

  it("falls back from create to update on past-paper attempts when insert fails", async () => {
    const attempts: PastPaperAttempt[] = [
      {
        id: "a1",
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
    setGuestPastPapers(attempts);
    createPastPaperAttemptMock.mockRejectedValueOnce(new Error("duplicate key"));

    let api!: ReturnType<typeof useData>;
    renderProvider((a) => {
      api = a;
    });
    await waitFor(() => expect(api).toBeDefined());

    await act(async () => {
      await api.migrateGuestDataToAccount("user-1");
    });

    expect(createPastPaperAttemptMock).toHaveBeenCalledTimes(1);
    expect(updatePastPaperAttemptMock).toHaveBeenCalledWith("user-1", attempts[0]);
  });

  it("clears guest data after successful migration", async () => {
    setGuestSubjects([
      { id: "math", name: "Math", shortCode: "MATH", baseColor: "#000", paperLabels: [] },
    ]);

    let api!: ReturnType<typeof useData>;
    renderProvider((a) => {
      api = a;
    });
    await waitFor(() => expect(api).toBeDefined());

    await act(async () => {
      await api.migrateGuestDataToAccount("user-1");
    });

    // hasGuestData should now be false
    expect(api.hasGuestStoredData()).toBe(false);
  });

  it("is a no-op on the second concurrent call (migrationInProgressRef guard)", async () => {
    setGuestSubjects([
      { id: "math", name: "Math", shortCode: "MATH", baseColor: "#000", paperLabels: [] },
    ]);
    // Make seed slow so first call is still in-flight when second arrives
    let resolveSeed!: () => void;
    seedDefaultSubjectsMock.mockImplementation(
      () => new Promise<void>((res) => {
        resolveSeed = () => res();
      }),
    );

    let api!: ReturnType<typeof useData>;
    renderProvider((a) => {
      api = a;
    });
    await waitFor(() => expect(api).toBeDefined());

    const first = api.migrateGuestDataToAccount("user-1");
    const second = api.migrateGuestDataToAccount("user-1");
    resolveSeed();
    await act(async () => {
      await Promise.all([first, second]);
    });

    expect(seedDefaultSubjectsMock).toHaveBeenCalledTimes(1);
  });
});