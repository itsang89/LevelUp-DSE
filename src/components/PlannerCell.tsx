import type { PlannerTask, Subject } from "../types";

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
        className="h-full w-full flex items-center justify-center transition-opacity cursor-pointer group/cell"
      >
        <span className="text-sm font-bold text-muted-foreground/40 uppercase tracking-widest opacity-0 group-hover/cell:opacity-100 transition-opacity">
          Add
        </span>
      </button>
    );
  }

  if (task.isRest) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="h-full w-full text-center transition-all duration-200 hover:translate-x-0.5 cursor-pointer flex flex-col rounded-xl p-3 shadow-soft border border-border-hairline/50 bg-black group/rest"
      >
        <div className="h-full py-0.5 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-white transition-colors">coffee</span>
            <p className="text-[12px] font-black text-white uppercase tracking-[0.2em] transition-colors">
              Rest
            </p>
          </div>
          {task.notes && (
            <p className="text-[11px] font-bold text-white/60 tracking-tight line-clamp-1 mt-1">
              {task.notes}
            </p>
          )}
        </div>
      </button>
    );
  }

  const title = task.title.trim() || "(Untitled task)";
  const subjectColor = subject?.baseColor || "#666666";
  const bgGradient = subject 
    ? `linear-gradient(135deg, ${subjectColor}30 0%, ${subjectColor}15 100%)`
    : `linear-gradient(135deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.05) 100%)`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="h-full w-full text-left transition-all duration-200 hover:translate-x-0.5 cursor-pointer flex flex-col rounded-xl p-3 shadow-soft border border-border-hairline/50"
      style={{ background: bgGradient }}
    >
      <div 
        className="h-full border-l-2 pl-3 py-0.5 flex flex-col justify-start"
        style={{ borderColor: subjectColor }}
      >
        <p className="text-[15px] font-black text-primary uppercase tracking-widest leading-none mb-2">
          {subject?.shortCode || "Other"}
        </p>
        <div className="flex items-center gap-1.5">
          <p className="text-[12px] font-bold text-muted-foreground tracking-tight line-clamp-1">
            {title}
          </p>
          {task.notes && (
            <>
              <span className="text-[11px] text-muted-foreground opacity-30">•</span>
              <span className="text-[12px] text-muted-foreground font-bold truncate opacity-60">
                Notes
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
