import { useState, useEffect } from "react";
import type { PlannerSessionTemplate } from "../types";
import { formatDayHeader, formatIsoDate } from "../utils/dateHelpers";
import { PlannerCell } from "./PlannerCell";
import type { PlannerTask, Subject } from "../types";

interface PlannerGridProps {
  weekDays: Date[];
  sessions: PlannerSessionTemplate[];
  getTask: (dateIso: string, sessionId: string) => PlannerTask | null;
  subjectsById: Record<string, Subject>;
  onEditCell: (dateIso: string, sessionId: string) => void;
  onToggleDone?: (dateIso: string, sessionId: string) => void;
  selectedDay?: number;
  onSelectedDayChange?: (index: number) => void;
}

function getTodayIndexInWeek(weekDays: Date[]): number {
  const todayIso = formatIsoDate(new Date());
  const idx = weekDays.findIndex((d) => formatIsoDate(d) === todayIso);
  return idx >= 0 ? idx : 0;
}

export function PlannerGrid({
  weekDays,
  sessions,
  getTask,
  subjectsById,
  onEditCell,
  onToggleDone,
  selectedDay: controlledSelectedDay,
  onSelectedDayChange,
}: PlannerGridProps) {
  const [internalSelectedDay, setInternalSelectedDay] = useState(0);

  const isControlled = controlledSelectedDay !== undefined;
  const selectedDay = isControlled ? controlledSelectedDay : internalSelectedDay;
  const setSelectedDay = isControlled
    ? (onSelectedDayChange ?? (() => {}))
    : setInternalSelectedDay;

  useEffect(() => {
    if (!isControlled) {
      setInternalSelectedDay(getTodayIndexInWeek(weekDays));
    }
  }, [weekDays, isControlled]);

  const selectedDate = weekDays[selectedDay];
  const selectedDateIso = selectedDate ? formatIsoDate(selectedDate) : "";
  const todayIso = formatIsoDate(new Date());

  const desktopGrid = (
    <div className="w-full overflow-x-auto custom-scrollbar pb-6 planner-grid-container scroll-mt-24">
      <div className="w-fit bg-background rounded-3xl overflow-hidden">
        {/* Header Grid */}
        <div className="grid grid-cols-[100px_repeat(7,140px)] h-[80px] bg-background z-20 border-b border-border-hairline">
          <div className="flex flex-col items-center justify-center text-sm font-black text-muted-foreground uppercase tracking-[0.2em] text-center border-r border-border-hairline">
            <span>Time</span>
            <span className="opacity-0 mt-1 font-bold tracking-tight text-[12px] select-none" aria-hidden="true">00 000</span>
          </div>
          {weekDays.map((date, index) => {
            const formatted = formatDayHeader(date);
            const [dayName, dayNum, monthName] = formatted.split(' ');
            const todayIso = formatIsoDate(new Date());
            const isToday = formatIsoDate(date) === todayIso;
            
            return (
              <div
                key={formatIsoDate(date)}
                className={`relative flex flex-col items-center justify-center text-sm font-black uppercase tracking-[0.2em] text-center ${
                  index !== weekDays.length - 1 ? "border-r border-border-hairline" : ""
                } ${
                  isToday ? "text-primary" : "text-muted-foreground opacity-60"
                }`}
              >
                {isToday && (
                  <div className="absolute inset-2 bg-surface shadow-sm rounded-2xl -z-10" />
                )}
                <div className="relative flex flex-col items-center justify-center">
                  <span>{dayName}</span>
                  <span className="opacity-50 mt-1 font-bold tracking-tight text-[12px]">{monthName} {dayNum}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Body Grid */}
        <div className="divide-y divide-border-hairline">
          {sessions.map((session) => (
            <div key={session.id} className="grid grid-cols-[100px_repeat(7,140px)] h-[140px] group">
              {/* Session Time Header */}
              <div className="flex flex-col items-center justify-center bg-surface/20 transition-colors group-hover:bg-surface/40 border-r border-border-hairline">
                <span className="text-sm font-black text-primary uppercase tracking-widest leading-none mb-1.5">{session.label}</span>
                <span className="text-[12px] font-bold text-muted-foreground tracking-tighter uppercase opacity-70">
                  {session.timeRange.split(' - ')[0]}
                </span>
              </div>

              {/* Day Cells */}
              {weekDays.map((date, index) => {
                const isoDate = formatIsoDate(date);
                const task = getTask(isoDate, session.id);
                const subject = task?.subjectId ? subjectsById[task.subjectId] : undefined;
                const todayIso = formatIsoDate(new Date());
                const isToday = isoDate === todayIso;

                return (
                  <div 
                    key={`${isoDate}-${session.id}`} 
                    className={`p-1.5 relative transition-all duration-300 ${
                      index !== weekDays.length - 1 ? "border-r border-border-hairline" : ""
                    } ${
                      isToday ? "bg-surface/30" : "hover:bg-surface/10"
                    }`}
                  >
                    <PlannerCell
                      cellKey={`${isoDate}__${session.id}`}
                      task={task}
                      subject={subject}
                      onClick={() => onEditCell(isoDate, session.id)}
                      onToggleDone={task && !task.isRest ? () => onToggleDone?.(isoDate, session.id) : undefined}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const mobileView = (
    <div className="md:hidden space-y-4">
      {/* Day selector strip — sticky so it stays visible when scrolling weeks */}
      <div className="sticky top-20 z-20 bg-background/95 backdrop-blur-sm py-2 -mx-1 px-1 -mt-2 pt-2">
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {weekDays.map((date, index) => {
          const iso = formatIsoDate(date);
          const isToday = iso === todayIso;
          const isSelected = index === selectedDay;
          const [dayName, dayNum] = formatDayHeader(date).split(" ");

          return (
            <button
              key={iso}
              type="button"
              onClick={() => setSelectedDay(index)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                isSelected
                  ? isToday
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-surface border border-border-hairline text-primary"
                  : "bg-surface/50 border border-transparent text-muted-foreground hover:bg-muted/30"
              }`}
            >
              <span className="block">{dayName}</span>
              <span className={`block mt-0.5 ${isSelected ? "opacity-90" : "opacity-60"}`}>
                {dayNum}
              </span>
            </button>
          );
        })}
        </div>
      </div>

      {/* Vertical session cards for selected day */}
      <div className="space-y-3">
        {sessions.map((session) => {
          const task = getTask(selectedDateIso, session.id);
          const subject = task?.subjectId ? subjectsById[task.subjectId] : undefined;

          return (
            <div
              key={session.id}
              className="rounded-2xl p-4 min-h-[100px] border border-border-hairline bg-surface/30 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {session.label}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground/70">
                  {session.timeRange.split("-")[0]?.trim()}
                </span>
              </div>
              <div className="min-h-[80px]">
                <PlannerCell
                  cellKey={`${selectedDateIso}__${session.id}`}
                  task={task}
                  subject={subject}
                  onClick={() => onEditCell(selectedDateIso, session.id)}
                  onToggleDone={
                    task && !task.isRest
                      ? () => onToggleDone?.(selectedDateIso, session.id)
                      : undefined
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden md:block">{desktopGrid}</div>
      {mobileView}
    </>
  );
}
