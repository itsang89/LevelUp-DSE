import type { PastPaperAttempt, Subject } from "../types";

interface PastPaperTableProps {
  attempts: PastPaperAttempt[];
  subjectsById: Record<string, Subject>;
  onEdit: (attempt: PastPaperAttempt) => void;
  onDelete: (attemptId: string) => void;
}

export function PastPaperTable({
  attempts,
  subjectsById,
  onEdit,
  onDelete,
}: PastPaperTableProps) {
  if (attempts.length === 0) {
    return (
      <div className="rounded-zen border border-dashed border-border-hairline bg-white/40 p-20 text-center">
        <span className="material-symbols-outlined text-muted-foreground/20 text-6xl mb-4">description</span>
        <h3 className="text-xl font-light text-foreground mb-1 leading-tight">Your history is a blank page</h3>
        <p className="text-sm text-muted-foreground font-light">Add your first past paper to start the journey.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {attempts.map((attempt) => {
        const subject = subjectsById[attempt.subjectId];
        const date = new Date(attempt.date);
        const day = date.toLocaleDateString(undefined, { day: '2-digit' });
        const month = date.toLocaleDateString(undefined, { month: 'short' });
        const year = date.getFullYear();

        return (
          <div 
            key={attempt.id} 
            className="group zen-shadow bg-white rounded-zen p-8 flex flex-col md:flex-row items-center justify-between gap-8 transition-all hover:scale-[1.005] relative overflow-hidden"
          >
            {/* Subject Indicator Bar */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-1 opacity-20 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: subject?.baseColor || 'var(--color-primary)' }}
            />

            <div className="flex items-center gap-10 flex-1 w-full md:w-auto">
              <div className="text-center min-w-[80px]">
                <p className="text-[10px] text-muted-foreground font-black tracking-widest uppercase opacity-40">{month} {day}</p>
                <p className="text-xl font-light text-foreground">{year}</p>
              </div>
              <div className="w-px h-10 bg-border-hairline hidden md:block" />
              <div className="flex-1">
                <div 
                  className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 border border-border-hairline"
                  style={{ color: subject?.baseColor || 'inherit', backgroundColor: `${subject?.baseColor}10` || 'transparent' }}
                >
                  {subject?.name || "Unknown"}
                </div>
                <h5 className="text-lg font-medium leading-tight text-foreground tracking-tight">
                  DSE {attempt.examYear} · {attempt.paperLabel}
                </h5>
                {attempt.tag && (
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-60">
                    {attempt.tag}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between md:justify-end gap-10 w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 border-border-hairline">
              <div className="text-left md:text-right flex-1 md:flex-none">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1 opacity-40">Score</p>
                <p className="text-3xl font-light text-foreground leading-none tabular-nums">
                  {attempt.score}<span className="text-sm text-muted-foreground ml-1">/ {attempt.total}</span>
                </p>
              </div>
              
              <div className="text-left md:text-right flex-1 md:flex-none">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1 opacity-40">Success</p>
                <p className="text-3xl font-light text-success leading-none tabular-nums">
                  {attempt.percentage.toFixed(1)}%
                </p>
              </div>

              <div className="flex flex-col items-center min-w-[60px]">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1 opacity-40">Level</p>
                <span className="text-2xl font-black text-white bg-primary size-12 flex items-center justify-center rounded-2xl shadow-lg shadow-primary/10">
                  {attempt.estimatedLevel}
                </span>
              </div>

              <div className="flex md:flex-col gap-2 md:opacity-0 group-hover:opacity-100 transition-all duration-300 w-full md:w-auto justify-end">
                <button 
                  onClick={() => onEdit(attempt)}
                  className="p-2 text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 md:justify-end"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                  <span className="text-[10px] font-black uppercase tracking-widest md:hidden">Edit</span>
                </button>
                <button 
                  onClick={() => onDelete(attempt.id)}
                  className="p-2 text-muted-foreground hover:text-dot-red transition-colors flex items-center gap-2 md:justify-end"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                  <span className="text-[10px] font-black uppercase tracking-widest md:hidden">Delete</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
