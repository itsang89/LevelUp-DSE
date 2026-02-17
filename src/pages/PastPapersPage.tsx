import { useMemo, useState } from "react";
import { PastPaperForm, type PastPaperFormValues } from "../components/PastPaperForm";
import { PastPaperTable } from "../components/PastPaperTable";
import { STORAGE_KEYS } from "../constants";
import { usePersistentState } from "../hooks/usePersistentState";
import type { CutoffData, PastPaperAttempt, Subject } from "../types";
import { estimateDseLevel, getGenericCutoffs } from "../utils/dseLevelEstimator";

interface PastPapersPageProps {
  subjects: Subject[];
  cutoffData: CutoffData;
  usingGenericFallback: boolean;
}

type SortKey = "date" | "examYear" | "percentage";
type SortDirection = "asc" | "desc";

function createAttemptId(): string {
  return `attempt-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function PastPapersPage({
  subjects,
  cutoffData,
  usingGenericFallback,
}: PastPapersPageProps) {
  const [attempts, setAttempts] = usePersistentState<PastPaperAttempt[]>(STORAGE_KEYS.pastPapers, []);
  const [editingAttempt, setEditingAttempt] = useState<PastPaperAttempt | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const subjectsById = useMemo(
    () => Object.fromEntries(subjects.map((subject) => [subject.id, subject])),
    [subjects]
  );

  const filteredAttempts = useMemo(() => {
    const list = subjectFilter === "all"
      ? attempts
      : attempts.filter((attempt) => attempt.subjectId === subjectFilter);

    const sorted = [...list].sort((a, b) => {
      if (sortKey === "date") {
        return a.date.localeCompare(b.date);
      }
      if (sortKey === "examYear") {
        return a.examYear - b.examYear;
      }
      return a.percentage - b.percentage;
    });

    return sortDirection === "asc" ? sorted : sorted.reverse();
  }, [attempts, sortDirection, sortKey, subjectFilter]);

  function handleSubmit(values: PastPaperFormValues): void {
    const score = Number(values.score);
    const total = Number(values.total);
    const percentage = (score / total) * 100;

    const subject = subjectsById[values.subjectId];
    const subjectKey = subject?.shortCode ?? values.subjectId;
    const estimatedLevel = estimateDseLevel(subjectKey, percentage, cutoffData);

    if (editingAttempt) {
      setAttempts((prev) =>
        prev.map((attempt) =>
          attempt.id === editingAttempt.id
            ? {
                ...attempt,
                subjectId: values.subjectId,
                examYear: Number(values.examYear),
                paperLabel: values.paperLabel.trim(),
                date: values.date,
                score,
                total,
                percentage,
                estimatedLevel,
                tag: values.tag.trim() || undefined,
                notes: values.notes.trim() || undefined,
              }
            : attempt
        )
      );
    } else {
      const newAttempt: PastPaperAttempt = {
        id: createAttemptId(),
        subjectId: values.subjectId,
        examYear: Number(values.examYear),
        paperLabel: values.paperLabel.trim(),
        date: values.date,
        score,
        total,
        percentage,
        estimatedLevel,
        tag: values.tag.trim() || undefined,
        notes: values.notes.trim() || undefined,
      };
      setAttempts((prev) => [...prev, newAttempt]);
    }

    setEditingAttempt(null);
    setIsModalOpen(false);
  }

  function handleDelete(attemptId: string): void {
    const confirmed = window.confirm("Delete this attempt?");
    if (!confirmed) {
      return;
    }
    setAttempts((prev) => prev.filter((attempt) => attempt.id !== attemptId));
  }

  function openAddModal(): void {
    setEditingAttempt(null);
    setIsModalOpen(true);
  }

  function openEditModal(attempt: PastPaperAttempt): void {
    setEditingAttempt(attempt);
    setIsModalOpen(true);
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Past Paper Log</h2>
            <p className="mt-1 text-sm text-slate-600">
              Track attempts, percentages, and estimated DSE levels.
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            onClick={openAddModal}
          >
            Add New Attempt
          </button>
        </div>

        {usingGenericFallback ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Using generic cutoffs. Subject-specific data unavailable.
          </p>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="text-sm text-slate-700">
            Filter by subject
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
            >
              <option value="all">All subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.shortCode})
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Sort by
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
            >
              <option value="date">Date</option>
              <option value="examYear">Exam Year</option>
              <option value="percentage">Percentage</option>
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Direction
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              value={sortDirection}
              onChange={(event) => setSortDirection(event.target.value as SortDirection)}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </label>
        </div>
      </div>

      <PastPaperTable
        attempts={filteredAttempts}
        subjectsById={subjectsById}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold">
              {editingAttempt ? "Edit Past Paper Attempt" : "Add Past Paper Attempt"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Generic fallback levels: {getGenericCutoffs().map((row) => `${row.level}>=${row.minimumPercentage}%`).join(", ")}
            </p>
            <div className="mt-4">
              <PastPaperForm
                key={editingAttempt?.id ?? "new"}
                subjects={subjects}
                initialValues={editingAttempt ?? undefined}
                onSubmit={handleSubmit}
                submitLabel={editingAttempt ? "Save Changes" : "Add Attempt"}
                onCancel={() => {
                  setIsModalOpen(false);
                  setEditingAttempt(null);
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
