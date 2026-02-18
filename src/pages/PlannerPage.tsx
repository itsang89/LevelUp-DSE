import { useMemo, useState, useEffect, useRef, useLayoutEffect } from "react";
import { PLANNER_SESSIONS } from "../constants";
import type { PlannerCell as PlannerCellType, PlannerTask, Subject } from "../types";
import { addWeeks, formatWeekLabel, getWeekDays, startOfWeekSunday, formatIsoDate } from "../utils/dateHelpers";
import { PlannerGrid } from "../components/PlannerGrid";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { deletePlannerCell, listPlannerCells, upsertPlannerCell } from "../lib/api/plannerApi";

interface PlannerPageProps {
  userId: string;
  subjects: Subject[];
}

interface CellEditorState {
  date: string;
  sessionId: string;
}

function createTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

const LOAD_LIMIT = 12; // Maximum weeks in each direction before "Load More" button

export function PlannerPage({ userId, subjects }: PlannerPageProps) {
  const initialWeek = useMemo(() => startOfWeekSunday(new Date()), []);
  const [weeks, setWeeks] = useState<Date[]>([initialWeek]);
  const [currentWeekLabel, setCurrentWeekLabel] = useState<string>(formatWeekLabel(initialWeek));
  const weekRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const hasScrolledToCurrentWeekRef = useRef(false);
  const scrollAdjustmentRef = useRef<{ oldScrollHeight: number; oldScrollTop: number } | null>(null);

  const [cells, setCells] = useState<PlannerCellType[]>([]);
  const [activeCell, setActiveCell] = useState<CellEditorState | null>(null);
  const [subjectId, setSubjectId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isPersisting, setIsPersisting] = useState(false);

  // Load initial surrounding weeks
  useEffect(() => {
    const initialWeeks = [
      addWeeks(initialWeek, -1),
      initialWeek,
      addWeeks(initialWeek, 1),
      addWeeks(initialWeek, 2),
    ];
    setWeeks(initialWeeks);
  }, [initialWeek]);

  useEffect(() => {
    let isMounted = true;
    listPlannerCells(userId)
      .then((rows) => {
        if (isMounted) {
          setCells(rows);
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setDataError(
            requestError instanceof Error ? requestError.message : "Failed to load planner data."
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Scroll to current week on initial load
  useEffect(() => {
    if (hasScrolledToCurrentWeekRef.current || weeks.length < 4) {
      return;
    }
    const currentWeekKey = formatIsoDate(initialWeek);
    const element = weekRefs.current.get(currentWeekKey);
    if (element) {
      const grid = element.querySelector('.planner-grid-container');
      if (grid) {
        grid.scrollIntoView({ block: "start" });
      } else {
        element.scrollIntoView({ block: "start" });
      }
      hasScrolledToCurrentWeekRef.current = true;
    }
  }, [initialWeek, weeks]);

  // Listen for scroll-to-today events from sidebar
  useEffect(() => {
    const handleScroll = () => {
      scrollToToday();
    };
    window.addEventListener('scroll-to-today', handleScroll);
    return () => window.removeEventListener('scroll-to-today', handleScroll);
  }, [weeks, initialWeek]); // Keep dependencies updated if needed

  // Intersection Observer for updating week label
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleWeeks = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleWeeks[0]) {
          const weekStartStr = visibleWeeks[0].target.getAttribute("data-week-start");
          if (weekStartStr) {
            setCurrentWeekLabel(formatWeekLabel(new Date(weekStartStr)));
          }
        }
      },
      {
        threshold: [0.1, 0.5, 0.9],
        rootMargin: "-20% 0px -20% 0px", // Focus on middle area
      }
    );

    weekRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [weeks]);

  // Handle scroll position after loading previous weeks to prevent jumping
  useLayoutEffect(() => {
    if (scrollAdjustmentRef.current) {
      const container = weekRefs.current.get(formatIsoDate(weeks[1]))?.closest('.overflow-y-auto');
      if (container) {
        const { oldScrollHeight, oldScrollTop } = scrollAdjustmentRef.current;
        const newScrollHeight = container.scrollHeight;
        container.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);
      }
      scrollAdjustmentRef.current = null;
    }
  }, [weeks]);

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

  async function handleSave(): Promise<void> {
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

    try {
      setIsPersisting(true);
      await upsertPlannerCell(userId, activeCell.date, activeCell.sessionId, task);
      upsertCell(activeCell.date, activeCell.sessionId, task);
      closeEditor();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to save planner task.");
    } finally {
      setIsPersisting(false);
    }
  }

  async function handleClear(): Promise<void> {
    if (!activeCell) {
      return;
    }
    try {
      setIsPersisting(true);
      await deletePlannerCell(userId, activeCell.date, activeCell.sessionId);
      upsertCell(activeCell.date, activeCell.sessionId, null);
      closeEditor();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to clear planner task.");
    } finally {
      setIsPersisting(false);
    }
  }

  function loadPreviousWeek(): void {
    const firstWeekKey = formatIsoDate(weeks[0]);
    const container = weekRefs.current.get(firstWeekKey)?.closest('.overflow-y-auto');
    if (container) {
      scrollAdjustmentRef.current = {
        oldScrollHeight: container.scrollHeight,
        oldScrollTop: container.scrollTop
      };
    }

    setWeeks((prev) => {
      const first = prev[0];
      return [addWeeks(first, -1), ...prev];
    });
  }

  function loadNextWeek(): void {
    setWeeks((prev) => {
      const last = prev[prev.length - 1];
      return [...prev, addWeeks(last, 1)];
    });
  }

  const reachedPastLimit = useMemo(() => {
    if (weeks.length === 0) return false;
    const diff = (initialWeek.getTime() - weeks[0].getTime()) / (1000 * 60 * 60 * 24 * 7);
    return diff >= LOAD_LIMIT;
  }, [weeks, initialWeek]);

  const reachedFutureLimit = useMemo(() => {
    if (weeks.length === 0) return false;
    const diff = (weeks[weeks.length - 1].getTime() - initialWeek.getTime()) / (1000 * 60 * 60 * 24 * 7);
    return diff >= LOAD_LIMIT;
  }, [weeks, initialWeek]);

  function scrollToToday(): void {
    const element = weekRefs.current.get(formatIsoDate(initialWeek));
    if (element) {
      const grid = element.querySelector('.planner-grid-container');
      if (grid) {
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  function getActiveWeekIndex(): number {
    return weeks.findIndex(w => formatWeekLabel(w) === currentWeekLabel);
  }

  function scrollToOneWeek(direction: 'up' | 'down'): void {
    const currentIndex = getActiveWeekIndex();
    
    if (direction === 'up') {
      if (currentIndex > 0) {
        const prevWeek = weeks[currentIndex - 1];
        const element = weekRefs.current.get(formatIsoDate(prevWeek));
        if (element) {
          const grid = element.querySelector('.planner-grid-container');
          if (grid) {
            grid.scrollIntoView({ behavior: "smooth", block: "start" });
          } else {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      } else if (!reachedPastLimit) {
        loadPreviousWeek();
      }
    } else {
      if (currentIndex < weeks.length - 1) {
        const nextWeek = weeks[currentIndex + 1];
        const element = weekRefs.current.get(formatIsoDate(nextWeek));
        if (element) {
          const grid = element.querySelector('.planner-grid-container');
          if (grid) {
            grid.scrollIntoView({ behavior: "smooth", block: "start" });
          } else {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      } else if (!reachedFutureLimit) {
        loadNextWeek();
        const nextDate = addWeeks(weeks[weeks.length - 1], 1);
        setTimeout(() => {
          const element = weekRefs.current.get(formatIsoDate(nextDate));
          if (element) {
            const grid = element.querySelector('.planner-grid-container');
            if (grid) {
              grid.scrollIntoView({ behavior: "smooth", block: "start" });
            } else {
              element.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }
        }, 100);
      }
    }
  }

  return (
    <section className="space-y-12">
      <div className="flex flex-col sm:flex-row justify-between items-end gap-6 sticky top-0 bg-background/80 backdrop-blur-md py-4 z-30 border-b border-border-hairline -mx-6 px-6 lg:-mx-12 lg:px-12 transition-all duration-300">
        <div>
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-60">Weekly Focus</h3>
          <p className="text-3xl font-light text-primary tracking-tight">Daily Mastery Tracker</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={scrollToToday}
            className="rounded-full px-4 text-[10px] font-black uppercase tracking-widest text-primary bg-surface border-border-hairline shadow-sm hover:bg-muted/50 transition-all"
          >
            Today
          </Button>
          <div className="flex items-center bg-surface/50 backdrop-blur-sm border border-border-hairline rounded-full p-1 shadow-sm">
            <button 
              onClick={() => scrollToOneWeek('up')}
              disabled={reachedPastLimit && getActiveWeekIndex() === 0}
              className="p-2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              title="Previous week"
            >
              <span className="material-symbols-outlined text-lg">keyboard_arrow_up</span>
            </button>
            <button 
              onClick={scrollToToday}
              className="px-4 text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity"
            >
              {currentWeekLabel}
            </button>
            <button 
              onClick={() => scrollToOneWeek('down')}
              disabled={reachedFutureLimit && getActiveWeekIndex() === weeks.length - 1}
              className="p-2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              title="Next week"
            >
              <span className="material-symbols-outlined text-lg">keyboard_arrow_down</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {dataError && (
          <div className="p-3 rounded-xl bg-dot-red/10 border border-dot-red/20 text-[10px] font-black uppercase tracking-widest text-dot-red text-center">
            {dataError}
          </div>
        )}
        {/* Load Previous Week Button */}
        {!reachedPastLimit && (
          <div className="flex justify-center pt-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={loadPreviousWeek}
              className="gap-2 group"
            >
              <span className="material-symbols-outlined text-lg group-hover:-translate-y-1 transition-transform">keyboard_double_arrow_up</span>
              Load Previous Week
            </Button>
          </div>
        )}
        
        {reachedPastLimit && (
          <div className="text-center py-8 opacity-20 text-[10px] font-black uppercase tracking-[0.3em]">
            Timeline Start Reached
          </div>
        )}

        <div className="space-y-12">
          {weeks.map((ws) => (
            <div 
              key={formatIsoDate(ws)}
              data-week-start={ws.toISOString()}
              ref={(el) => {
                if (el) {
                  weekRefs.current.set(formatIsoDate(ws), el);
                } else {
                  weekRefs.current.delete(formatIsoDate(ws));
                }
              }}
              className="animate-in fade-in slide-in-from-bottom-8 duration-700"
            >
              <div className="mb-4 flex items-center gap-4">
                <div className="h-px flex-1 bg-border-hairline opacity-50" />
                <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em] opacity-40">
                  {formatWeekLabel(ws)}
                </h4>
                <div className="h-px flex-1 bg-border-hairline opacity-50" />
              </div>
              <PlannerGrid
                weekDays={getWeekDays(ws)}
                sessions={PLANNER_SESSIONS}
                getTask={getTask}
                subjectsById={subjectsById}
                onEditCell={openEditor}
              />
            </div>
          ))}
        </div>

        {/* Load Next Week Button */}
        {!reachedFutureLimit && (
          <div className="flex justify-center pb-12">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={loadNextWeek}
              className="gap-2 group"
            >
              <span className="material-symbols-outlined text-lg group-hover:translate-y-1 transition-transform">keyboard_double_arrow_down</span>
              Load Next Week
            </Button>
          </div>
        )}

        {reachedFutureLimit && (
          <div className="text-center py-8 opacity-20 text-[10px] font-black uppercase tracking-[0.3em]">
            Timeline End Reached
          </div>
        )}
      </div>

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
              disabled={isPersisting}
            >
              Clear
            </Button>
            <Button
              className="flex-[2] rounded-full text-[10px] font-black uppercase tracking-widest"
              onClick={handleSave}
              disabled={isPersisting}
            >
              Confirm Focus
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
