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
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3 shadow-sm">
      <table className="min-w-[980px] w-full border-separate border-spacing-2">
        <thead>
          <tr>
            <th className="w-40 rounded-lg bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700">
              Session
            </th>
            {weekDays.map((date) => (
              <th
                key={formatIsoDate(date)}
                className="rounded-lg bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700"
              >
                {formatDayHeader(date)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.id}>
              <td className="rounded-lg bg-white px-3 py-2 align-top text-sm text-slate-700">
                <div className="font-semibold">{session.label}</div>
                <div className="text-xs text-slate-500">{session.timeRange}</div>
              </td>
              {weekDays.map((date) => {
                const isoDate = formatIsoDate(date);
                const task = getTask(isoDate, session.id);
                const subject = task?.subjectId ? subjectsById[task.subjectId] : undefined;
                return (
                  <td key={`${isoDate}-${session.id}`} className="align-top">
                    <PlannerCell
                      task={task}
                      subject={subject}
                      onClick={() => onEditCell(isoDate, session.id)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
