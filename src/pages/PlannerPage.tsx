import { useMemo, useState } from "react";
import { PLANNER_SESSIONS, STORAGE_KEYS } from "../constants";
import { usePersistentState } from "../hooks/usePersistentState";
import type { PlannerCell as PlannerCellType, PlannerTask, Subject } from "../types";
import { addWeeks, formatWeekLabel, getWeekDays, startOfWeekSunday } from "../utils/dateHelpers";
import { PlannerGrid } from "../components/PlannerGrid";

interface PlannerPageProps {
  subjects: Subject[];
}

interface CellEditorState {
  date: string;
  sessionId: string;
}

function createTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function PlannerPage({ subjects }: PlannerPageProps) {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeekSunday(new Date()));
  const [cells, setCells] = usePersistentState<PlannerCellType[]>(STORAGE_KEYS.plannerCells, []);
  const [activeCell, setActiveCell] = useState<CellEditorState | null>(null);
  const [subjectId, setSubjectId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const weekLabel = useMemo(() => formatWeekLabel(weekStart), [weekStart]);

  const cellMap = useMemo(() => {
    const map = new Map<string, PlannerTask | null>();
    for (const cell of cells) {
      map.set(`${cell.date}__${cell.sessionId}`, cell.task);
    }
    return map;
  }, [cells]);

  const subjectsById = useMemo(
    () => Object.fromEntries(subjects.map((subject) => [subject.id, subject])),
    [subjects]
  );

  function getTask(dateIso: string, sessionId: string): PlannerTask | null {
    return cellMap.get(`${dateIso}__${sessionId}`) ?? null;
  }

  function openEditor(dateIso: string, sessionId: string): void {
    const existingTask = getTask(dateIso, sessionId);
    setActiveCell({ date: dateIso, sessionId });
    setSubjectId(existingTask?.subjectId ?? "");
    setTitle(existingTask?.title ?? "");
    setNotes(existingTask?.notes ?? "");
    setError(null);
  }

  function closeEditor(): void {
    setActiveCell(null);
    setError(null);
  }

  function upsertCell(date: string, sessionId: string, task: PlannerTask | null): void {
    setCells((prev) => {
      const nextWithoutCell = prev.filter(
        (cell) => !(cell.date === date && cell.sessionId === sessionId)
      );
      if (!task) {
        return nextWithoutCell;
      }
      return [...nextWithoutCell, { date, sessionId, task }];
    });
  }

  function handleSave(): void {
    if (!activeCell) {
      return;
    }

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    const existingTask = getTask(activeCell.date, activeCell.sessionId);
    const task: PlannerTask = {
      id: existingTask?.id ?? createTaskId(),
      subjectId: subjectId || null,
      title: title.trim(),
      notes: notes.trim() || undefined,
    };

    upsertCell(activeCell.date, activeCell.sessionId, task);
    closeEditor();
  }

  function handleClear(): void {
    if (!activeCell) {
      return;
    }
    upsertCell(activeCell.date, activeCell.sessionId, null);
    closeEditor();
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Weekly Study Planner</h2>
        <p className="mt-1 text-sm text-slate-600">
          Assign one task per session block and keep the week focused.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium"
            onClick={() => setWeekStart((prev) => addWeeks(prev, -1))}
          >
            Previous Week
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium"
            onClick={() => setWeekStart(startOfWeekSunday(new Date()))}
          >
            Today
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium"
            onClick={() => setWeekStart((prev) => addWeeks(prev, 1))}
          >
            Next Week
          </button>
          <span className="ml-auto rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
            {weekLabel}
          </span>
        </div>
      </div>

      <PlannerGrid
        weekDays={weekDays}
        sessions={PLANNER_SESSIONS}
        getTask={getTask}
        subjectsById={subjectsById}
        onEditCell={openEditor}
      />

      {activeCell ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold">Edit Planner Cell</h3>
            <p className="mt-1 text-xs text-slate-500">
              {activeCell.date} - {PLANNER_SESSIONS.find((session) => session.id === activeCell.sessionId)?.label}
            </p>

            <div className="mt-4 space-y-3">
              <label className="block text-sm text-slate-700">
                Subject
                <select
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  value={subjectId}
                  onChange={(event) => setSubjectId(event.target.value)}
                >
                  <option value="">No subject / Other</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.shortCode})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-slate-700">
                Task title *
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>

              <label className="block text-sm text-slate-700">
                Notes
                <textarea
                  className="mt-1 h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </label>
            </div>

            {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                onClick={closeEditor}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700"
                onClick={handleClear}
              >
                Clear
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
