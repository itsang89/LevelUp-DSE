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
    <div className="w-full overflow-x-auto custom-scrollbar pb-6">
      <div className="min-w-[1000px] glass-card rounded-3xl overflow-hidden hairline-border">
        {/* Header Grid */}
        <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-border-hairline bg-white/40">
          <div className="p-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-center border-r border-border-hairline">
            Time
          </div>
          {weekDays.map((date) => {
            const [dayName] = formatDayHeader(date).split(' ');
            const isToday = formatIsoDate(date) === formatIsoDate(new Date());
            
            return (
              <div
                key={formatIsoDate(date)}
                className={`p-5 text-[10px] font-black uppercase tracking-[0.2em] text-center border-l border-border-hairline first:border-l-0 ${
                  isToday ? "text-foreground bg-white/60" : "text-muted-foreground opacity-60"
                }`}
              >
                {dayName}
              </div>
            );
          })}
        </div>

        {/* Body Grid */}
        <div className="divide-y divide-border-hairline">
          {sessions.map((session) => (
            <div key={session.id} className="grid grid-cols-[100px_repeat(7,1fr)] min-h-[140px] group">
              {/* Session Time Header */}
              <div className="p-5 flex flex-col items-center justify-center bg-white/20 transition-colors group-hover:bg-white/40 border-r border-border-hairline">
                <span className="text-[10px] font-black text-foreground uppercase tracking-widest leading-none mb-1">{session.label}</span>
                <span className="text-[9px] font-bold text-muted-foreground tracking-tighter uppercase opacity-70">
                  {session.timeRange.split(' - ')[0]}
                </span>
              </div>

              {/* Day Cells */}
              {weekDays.map((date) => {
                const isoDate = formatIsoDate(date);
                const task = getTask(isoDate, session.id);
                const subject = task?.subjectId ? subjectsById[task.subjectId] : undefined;
                const isToday = formatIsoDate(date) === formatIsoDate(new Date());

                return (
                  <div 
                    key={`${isoDate}-${session.id}`} 
                    className={`p-4 border-l border-border-hairline relative transition-all duration-300 ${
                      isToday ? "bg-white/30" : "hover:bg-white/10"
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
