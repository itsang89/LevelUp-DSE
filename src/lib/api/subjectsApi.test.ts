import { beforeEach, describe, expect, it, vi } from "vitest";

interface DeleteCall {
  table: string;
  filters: Array<{ column: string; value: unknown }>;
}

function makeChain(terminal: { data?: unknown; error?: unknown; count?: number | null } = {}) {
  const filters: Array<{ column: string; value: unknown }> = [];
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.upsert = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.eq = vi.fn((column: string, value: unknown) => {
    filters.push({ column, value });
    return chain;
  });
  chain.then = (onFulfilled: (value: { data: unknown; error: unknown; count?: number | null }) => unknown) =>
    Promise.resolve(terminal).then(onFulfilled);
  (chain as Record<string, unknown>).__filters = filters;
  return chain;
}

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock("../supabase", () => ({
  getSupabaseClient: () => ({ from: fromMock }),
  isSupabaseConfigured: true,
}));

import { deleteSubjectWithCascade } from "./subjectsApi";

beforeEach(() => {
  fromMock.mockReset();
  fromMock.mockImplementation(() => makeChain());
});

describe("deleteSubjectWithCascade", () => {
  it("deletes planner_cells, past_paper_attempts, study_goals, then subjects in that order", async () => {
    const calls: string[] = [];
    fromMock.mockImplementation((table: string) => {
      calls.push(table);
      return makeChain();
    });

    await deleteSubjectWithCascade("user-1", "math");

    expect(calls).toEqual([
      "planner_cells",
      "past_paper_attempts",
      "study_goals",
      "subjects",
    ]);
  });

  it("scopes every delete with user_id and the right subject filter column", async () => {
    const filterLog: DeleteCall[] = [];
    fromMock.mockImplementation((table: string) => {
      const chain = makeChain();
      const originalEq = chain.eq as ReturnType<typeof vi.fn>;
      chain.eq = vi.fn((column: string, value: unknown) => {
        const last = filterLog.at(-1);
        if (last && last.table === table) {
          last.filters.push({ column, value });
        } else {
          filterLog.push({ table, filters: [{ column, value }] });
        }
        return originalEq(column, value);
      });
      return chain;
    });

    await deleteSubjectWithCascade("user-42", "chi");

    // Every dependent table filters by subject_id; the subjects row itself filters by id (PK).
    const expectedSubjectCol: Record<string, string> = {
      planner_cells: "subject_id",
      past_paper_attempts: "subject_id",
      study_goals: "subject_id",
      subjects: "id",
    };
    for (const call of filterLog) {
      const cols = call.filters.map((f) => f.column);
      expect(cols, `table ${call.table} missing user_id`).toContain("user_id");
      expect(cols, `table ${call.table} missing subject column`).toContain(expectedSubjectCol[call.table]);
      expect(call.filters.find((f) => f.column === "user_id")?.value).toBe("user-42");
      const subjCol = expectedSubjectCol[call.table];
      expect(call.filters.find((f) => f.column === subjCol)?.value).toBe("chi");
    }
  });

  it("continues to delete from subjects even when study_goals table errors", async () => {
    const calls: string[] = [];
    fromMock.mockImplementation((table: string) => {
      calls.push(table);
      if (table === "study_goals") {
        return makeChain({ error: { message: "relation does not exist" } });
      }
      return makeChain({ error: null });
    });

    await expect(deleteSubjectWithCascade("u", "s")).resolves.toBeUndefined();
    expect(calls).toEqual([
      "planner_cells",
      "past_paper_attempts",
      "study_goals",
      "subjects",
    ]);
  });

  it("throws when the final subjects delete fails", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "subjects") {
        return makeChain({ error: { message: "row not found or RLS denied" } });
      }
      return makeChain({ error: null });
    });

    await expect(deleteSubjectWithCascade("u", "s")).rejects.toBeDefined();
  });
});