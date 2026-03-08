import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { PlannerTask, Subject } from "../types";

interface PlannerCellProps {
  cellKey: string;
  task: PlannerTask | null;
  subject?: Subject;
  onClick: () => void;
  onToggleDone?: () => void;
}

function DoneCheckmark({
  isDone,
  onToggle,
}: {
  isDone: boolean;
  onToggle: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={isDone ? "Mark as not done" : "Mark as done"}
      className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 z-10 ${
        isDone
          ? "bg-success text-success-foreground border-2 border-success shadow-sm"
          : "border-2 border-muted-foreground/40 hover:border-muted-foreground/70 hover:bg-muted/30"
      }`}
    >
      {isDone && <span className="material-symbols-outlined text-xs">check</span>}
    </button>
  );
}

export function PlannerCell({ cellKey, task, subject, onClick, onToggleDone }: PlannerCellProps) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: cellKey });
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: cellKey,
    data: { task },
    disabled: !task,
  });

  const setRefs = (el: HTMLDivElement | null) => {
    setDropRef(el);
    setDragRef(el);
  };

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  if (!task) {
    return (
      <div
        ref={setDropRef}
        className={`h-full w-full flex items-center justify-center transition-all rounded-xl border-2 border-dashed min-h-[100px] group/cell ${
          isOver ? "border-primary/50 bg-primary/5" : "border-transparent"
        }`}
      >
        <button
          type="button"
          onClick={onClick}
          className="text-sm font-bold text-muted-foreground/40 uppercase tracking-widest opacity-0 group-hover/cell:opacity-100 hover:opacity-100 transition-opacity cursor-pointer h-full w-full"
        >
          Add
        </button>
      </div>
    );
  }

  if (task.isRest) {
    return (
      <div
        ref={setRefs}
        style={style}
        className={`rest-session-cell h-full w-full text-center transition-all duration-200 flex flex-col rounded-xl p-3 shadow-soft border border-border-hairline/50 bg-muted group/rest min-h-[100px] ${
          isDragging ? "opacity-50 cursor-grabbing" : "cursor-grab hover:translate-x-0.5"
        } ${isOver ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background" : ""}`}
        {...attributes}
        {...listeners}
        onClick={onClick}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      >
        <div className="h-full py-0.5 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="rest-session-icon material-symbols-outlined text-sm text-muted-foreground transition-colors">coffee</span>
            <p className="rest-session-label text-[12px] font-black text-muted-foreground uppercase tracking-[0.2em] transition-colors">
              Rest
            </p>
          </div>
          {task.notes && (
            <p className="rest-session-notes text-[11px] font-bold text-muted-foreground/60 tracking-tight break-words whitespace-pre-wrap mt-1">
              {task.notes}
            </p>
          )}
        </div>
      </div>
    );
  }

  const title = task.title.trim() || "(Untitled task)";
  const subjectColor = subject?.baseColor || "#666666";
  const isDone = !!task.isDone;
  const bgGradient = subject
    ? `linear-gradient(135deg, ${subjectColor}${isDone ? "15" : "30"} 0%, ${subjectColor}${isDone ? "05" : "15"} 100%)`
    : `linear-gradient(135deg, rgba(0,0,0,${isDone ? "0.04" : "0.12"}) 0%, rgba(0,0,0,${isDone ? "0.01" : "0.05"}) 100%)`;

  return (
    <div
      ref={setRefs}
      style={{ ...style, background: bgGradient }}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className={`h-full w-full text-left transition-all duration-200 flex flex-col rounded-xl p-3 border border-border-hairline/50 relative min-h-[100px] ${
        isDragging ? "opacity-50 cursor-grabbing shadow-lg" : "cursor-grab hover:translate-x-0.5"
      } ${isDone ? "shadow-none" : "shadow-soft"} ${isOver ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background" : ""}`}
      {...attributes}
      {...listeners}
    >
      {onToggleDone && (
        <DoneCheckmark
          isDone={isDone}
          onToggle={(e) => {
            e.stopPropagation();
            onToggleDone();
          }}
        />
      )}
      <div
        className="h-full min-h-0 border-l-2 pl-3 py-0.5 flex flex-col justify-start overflow-y-auto pr-6"
        style={{ borderColor: subjectColor }}
      >
        <p className={`text-[15px] font-black text-primary uppercase tracking-widest leading-none mb-2 flex-shrink-0 ${isDone ? "line-through opacity-60" : ""}`}>
          {subject?.shortCode || "Other"}
        </p>
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          <p className={`text-[12px] font-bold text-muted-foreground tracking-tight break-words whitespace-pre-wrap ${isDone ? "line-through opacity-60" : ""}`}>
            {title}
          </p>
          {task.notes && (
            <>
              <span className="text-[11px] text-muted-foreground opacity-30 flex-shrink-0">•</span>
              <span className="text-[12px] text-muted-foreground font-bold flex-shrink-0 opacity-60">
                Notes
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
