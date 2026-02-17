import { type FormEvent, useState } from "react";
import type { PastPaperAttempt, Subject } from "../types";
import { formatIsoDate } from "../utils/dateHelpers";

export interface PastPaperFormValues {
  subjectId: string;
  examYear: string;
  paperLabel: string;
  date: string;
  score: string;
  total: string;
  tag: string;
  notes: string;
}

interface PastPaperFormProps {
  subjects: Subject[];
  initialValues?: Partial<PastPaperAttempt>;
  onSubmit: (values: PastPaperFormValues) => void;
  submitLabel: string;
  onCancel?: () => void;
}

function buildInitialValues(initialValues?: Partial<PastPaperAttempt>): PastPaperFormValues {
  return {
    subjectId: initialValues?.subjectId ?? "",
    examYear: initialValues?.examYear ? String(initialValues.examYear) : String(new Date().getFullYear()),
    paperLabel: initialValues?.paperLabel ?? "",
    date: initialValues?.date ?? formatIsoDate(new Date()),
    score: initialValues?.score !== undefined ? String(initialValues.score) : "",
    total: initialValues?.total !== undefined ? String(initialValues.total) : "",
    tag: initialValues?.tag ?? "",
    notes: initialValues?.notes ?? "",
  };
}

export function PastPaperForm({
  subjects,
  initialValues,
  onSubmit,
  submitLabel,
  onCancel,
}: PastPaperFormProps) {
  const [values, setValues] = useState<PastPaperFormValues>(() => buildInitialValues(initialValues));
  const [error, setError] = useState<string | null>(null);

  function handleChange<K extends keyof PastPaperFormValues>(key: K, value: PastPaperFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const requiredMissing =
      !values.subjectId || !values.examYear || !values.paperLabel.trim() || !values.score || !values.total;
    if (requiredMissing) {
      setError("Please fill all required fields.");
      return;
    }

    const score = Number(values.score);
    const total = Number(values.total);
    if (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0) {
      setError("Score and total marks must be valid numbers, with total > 0.");
      return;
    }
    if (score > total) {
      setError("Score cannot be greater than total marks.");
      return;
    }

    setError(null);
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-slate-700">
          Subject *
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            value={values.subjectId}
            onChange={(event) => handleChange("subjectId", event.target.value)}
          >
            <option value="">Select subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name} ({subject.shortCode})
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700">
          Exam year *
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            value={values.examYear}
            onChange={(event) => handleChange("examYear", event.target.value)}
          />
        </label>

        <label className="text-sm text-slate-700">
          Paper label *
          <input
            type="text"
            placeholder="Paper 1, Paper 2, Mock"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            value={values.paperLabel}
            onChange={(event) => handleChange("paperLabel", event.target.value)}
          />
        </label>

        <label className="text-sm text-slate-700">
          Date attempted *
          <input
            type="date"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            value={values.date}
            onChange={(event) => handleChange("date", event.target.value)}
          />
        </label>

        <label className="text-sm text-slate-700">
          Score *
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            value={values.score}
            onChange={(event) => handleChange("score", event.target.value)}
          />
        </label>

        <label className="text-sm text-slate-700">
          Total marks *
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            value={values.total}
            onChange={(event) => handleChange("total", event.target.value)}
          />
        </label>

        <label className="text-sm text-slate-700 md:col-span-2">
          Tag
          <input
            type="text"
            placeholder="Official, School Mock, Set Paper"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            value={values.tag}
            onChange={(event) => handleChange("tag", event.target.value)}
          />
        </label>

        <label className="text-sm text-slate-700 md:col-span-2">
          Notes
          <textarea
            className="mt-1 h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            value={values.notes}
            onChange={(event) => handleChange("notes", event.target.value)}
          />
        </label>
      </div>

      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          className="rounded-lg border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
