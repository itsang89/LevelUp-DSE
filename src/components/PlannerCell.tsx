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
        className="h-full w-full flex items-center gap-2 group transition-opacity cursor-pointer"
      >
        <div className="w-1 h-1 rounded-full bg-muted-foreground/30 group-hover:bg-primary transition-colors"></div>
        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
          Add
        </span>
      </button>
    );
  }

  const title = task.title.trim() || "(Untitled task)";
  const subjectColor = subject?.baseColor || "var(--color-muted-foreground)";

  return (
    <button
      type="button"
      onClick={onClick}
      className="h-full w-full text-left transition-all duration-200 hover:translate-x-0.5 cursor-pointer flex flex-col"
    >
      <div 
        className="h-full border-l-2 pl-3 py-1 flex flex-col justify-start"
        style={{ borderColor: subjectColor }}
      >
        <p className="text-[11px] font-black text-foreground leading-tight tracking-tight line-clamp-2">
          {title}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
            {subject?.shortCode || "Other"}
          </span>
          {task.notes && (
            <>
              <span className="text-[8px] text-muted-foreground opacity-30">•</span>
              <span className="text-[9px] text-muted-foreground font-bold truncate opacity-60">
                Notes
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
