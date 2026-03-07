import type { PastPaperAttempt, PlannerCell, Subject } from "../types";
import { PLANNER_SESSIONS } from "../constants";

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportPastPapersCsv(
  attempts: PastPaperAttempt[],
  subjectsById: Record<string, Subject>
): string {
  const headers = [
    "Date",
    "Subject",
    "Exam Year",
    "Paper",
    "Score",
    "Total",
    "Percentage",
    "Estimated Level",
    "Type",
    "Notes",
  ];
  const rows = attempts.map((a) => [
    a.date,
    subjectsById[a.subjectId]?.name ?? a.subjectId,
    String(a.examYear),
    a.paperLabel,
    String(a.score),
    String(a.total),
    `${a.percentage.toFixed(1)}%`,
    a.estimatedLevel,
    a.isDse === false ? "Mock" : "DSE",
    a.notes ?? "",
  ]);
  const lines = [headers.map(escapeCsvField).join(","), ...rows.map((r) => r.map(escapeCsvField).join(","))];
  return lines.join("\n");
}

export function exportPastPapersJson(attempts: PastPaperAttempt[]): string {
  return JSON.stringify(attempts, null, 2);
}

export function exportPlannerCsv(
  cells: PlannerCell[],
  subjectsById: Record<string, Subject>
): string {
  const headers = ["Date", "Session", "Subject", "Title", "Notes", "Is Rest"];
  const sessionLabels = Object.fromEntries(PLANNER_SESSIONS.map((s) => [s.id, s.label]));
  const rows = cells
    .filter((c) => c.task)
    .map((c) => {
      const t = c.task!;
      return [
        c.date,
        sessionLabels[c.sessionId] ?? c.sessionId,
        t.subjectId ? subjectsById[t.subjectId]?.name ?? t.subjectId : "",
        t.title ?? "",
        t.notes ?? "",
        t.isRest ? "Yes" : "No",
      ];
    });
  const lines = [headers.map(escapeCsvField).join(","), ...rows.map((r) => r.map(escapeCsvField).join(","))];
  return lines.join("\n");
}

export function exportPlannerJson(cells: PlannerCell[]): string {
  return JSON.stringify(cells, null, 2);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getExportFilename(prefix: string, extension: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `dse-${prefix}-${date}.${extension}`;
}
