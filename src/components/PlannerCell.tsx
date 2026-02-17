import type { PlannerTask, Subject } from "../types";
import { getSubjectGradientStyle } from "../utils/subjectStyles";

interface PlannerCellProps {
  task: PlannerTask | null;
  subject?: Subject;
  onClick: () => void;
}

export function PlannerCell({ task, subject, onClick }: PlannerCellProps) {
  if (!task) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="h-24 w-full rounded-xl border border-slate-200 bg-white p-2 text-left text-xs text-slate-500 shadow-sm transition hover:border-slate-300"
      >
        Add task
      </button>
    );
  }

  const isUnknownSubject = Boolean(task.subjectId) && !subject;
  const title = task.title.trim() || "(Untitled task)";

  return (
    <button
      type="button"
      onClick={onClick}
      style={getSubjectGradientStyle(subject)}
      className="h-24 w-full rounded-xl border border-slate-200 p-2 text-left shadow-sm transition hover:border-slate-300"
    >
      <div className="mb-1 flex items-center gap-2">
        {task.subjectId ? (
          <span className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] font-medium text-slate-700">
            {isUnknownSubject ? "Unknown Subject" : `${subject?.shortCode ?? ""}`}
          </span>
        ) : (
          <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600">
            Other
          </span>
        )}
      </div>
      <div className="truncate text-sm font-semibold text-slate-900">{title}</div>
      {task.notes ? (
        <div className="mt-1 truncate text-xs text-slate-600">{task.notes}</div>
      ) : null}
    </button>
  );
}
