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
}

export function PlannerGrid({
  weekDays,
  sessions,
  getTask,
  subjectsById,
  onEditCell,
}: PlannerGridProps) {
  return (
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
            const isToday = formatIsoDate(date) === formatIsoDate(new Date());
            
            return (
              <div
                key={formatIsoDate(date)}
                className={`flex flex-col items-center justify-center text-sm font-black uppercase tracking-[0.2em] text-center ${
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
                const isToday = formatIsoDate(date) === formatIsoDate(new Date());

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
                      task={task}
                      subject={subject}
                      onClick={() => onEditCell(isoDate, session.id)}
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
}
