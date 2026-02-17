import { useMemo, useState } from "react";
import { PLANNER_SESSIONS, STORAGE_KEYS } from "../constants";
import { usePersistentState } from "../hooks/usePersistentState";
import type { PlannerCell as PlannerCellType, PlannerTask, Subject } from "../types";
import { addWeeks, formatWeekLabel, getWeekDays, startOfWeekSunday } from "../utils/dateHelpers";
import { PlannerGrid } from "../components/PlannerGrid";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";

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
    <section className="space-y-12">
      <div className="flex flex-col sm:flex-row justify-between items-end gap-6">
        <div>
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-60">Weekly Focus</h3>
          <p className="text-3xl font-light text-foreground tracking-tight">Daily Mastery Tracker</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white/50 backdrop-blur-sm border border-border-hairline rounded-full p-1 shadow-sm">
            <button 
              onClick={() => setWeekStart((prev) => addWeeks(prev, -1))}
              className="p-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <button 
              onClick={() => setWeekStart(startOfWeekSunday(new Date()))}
              className="px-4 text-[10px] font-black uppercase tracking-widest text-primary"
            >
              {weekLabel}
            </button>
            <button 
              onClick={() => setWeekStart((prev) => addWeeks(prev, 1))}
              className="p-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
          <Button variant="outline" size="sm" className="rounded-full px-6 text-[10px] font-black uppercase tracking-widest">
            Export PDF
          </Button>
        </div>
      </div>

      <PlannerGrid
        weekDays={weekDays}
        sessions={PLANNER_SESSIONS}
        getTask={getTask}
        subjectsById={subjectsById}
        onEditCell={openEditor}
      />

      <Modal
        isOpen={!!activeCell}
        onClose={closeEditor}
        title="Session Details"
        description={activeCell ? `${activeCell.date} — ${PLANNER_SESSIONS.find((s) => s.id === activeCell.sessionId)?.label}` : ""}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 ml-1">
              Subject
            </label>
            <Select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">No subject / Other</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.shortCode})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 ml-1">
              Focus Goal <span className="text-dot-red">*</span>
            </label>
            <Input
              placeholder="What are you mastering today?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 ml-1">
              Notes & Reminders
            </label>
            <textarea
              className="flex min-h-[120px] w-full rounded-2xl border border-border-hairline bg-background/50 px-4 py-3 text-sm transition-all placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-50 hairline-border"
              placeholder="Specific topics, page numbers, or areas of focus..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-dot-red/10 border border-dot-red/20 text-[10px] font-black uppercase tracking-widest text-dot-red text-center">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 rounded-full text-[10px] font-black uppercase tracking-widest"
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button
              className="flex-[2] rounded-full text-[10px] font-black uppercase tracking-widest"
              onClick={handleSave}
            >
              Confirm Focus
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
