import type { PastPaperAttempt, Subject } from "../types";
import { getSubjectGradientStyle } from "../utils/subjectStyles";

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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
        No attempts yet. Add your first past paper above.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-[1120px] w-full">
        <thead className="bg-slate-50">
          <tr className="text-left text-xs uppercase tracking-wide text-slate-600">
            <th className="px-3 py-3">Date</th>
            <th className="px-3 py-3">Subject</th>
            <th className="px-3 py-3">Year</th>
            <th className="px-3 py-3">Paper</th>
            <th className="px-3 py-3">Score</th>
            <th className="px-3 py-3">Percentage</th>
            <th className="px-3 py-3">Estimated Level</th>
            <th className="px-3 py-3">Tag</th>
            <th className="px-3 py-3">Notes</th>
            <th className="px-3 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((attempt) => {
            const subject = subjectsById[attempt.subjectId];
            const isUnknownSubject = !subject;

            return (
              <tr key={attempt.id} className="border-t border-slate-100 text-sm text-slate-700">
                <td className="px-3 py-3">{attempt.date}</td>
                <td className="px-3 py-3">
                  <span
                    style={getSubjectGradientStyle(subject)}
                    className="inline-flex rounded-full border border-slate-300 px-2 py-1 text-xs font-medium"
                  >
                    {isUnknownSubject
                      ? "Unknown Subject"
                      : `${subject.shortCode} - ${subject.name}`}
                  </span>
                </td>
                <td className="px-3 py-3">{attempt.examYear}</td>
                <td className="px-3 py-3">{attempt.paperLabel}</td>
                <td className="px-3 py-3">
                  {attempt.score} / {attempt.total}
                </td>
                <td className="px-3 py-3">{attempt.percentage.toFixed(1)}%</td>
                <td className="px-3 py-3">
                  <span
                    style={getSubjectGradientStyle(subject)}
                    className="rounded-full border border-slate-300 px-2 py-1 text-xs font-semibold"
                  >
                    {attempt.estimatedLevel}
                  </span>
                </td>
                <td className="px-3 py-3">{attempt.tag || "-"}</td>
                <td className="max-w-xs truncate px-3 py-3" title={attempt.notes ?? ""}>
                  {attempt.notes || "-"}
                </td>
                <td className="px-3 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded border border-slate-300 px-2 py-1 text-xs"
                      onClick={() => onEdit(attempt)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700"
                      onClick={() => onDelete(attempt.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
