import { type FormEvent, useState } from "react";
import type { PastPaperAttempt, Subject } from "../types";
import { formatIsoDate } from "../utils/dateHelpers";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";

export interface PastPaperFormValues {
  subjectId: string;
  examYear: string;
  paperLabel: string;
  date: string;
  score: string;
  total: string;
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

  const selectedSubject = subjects.find((s) => s.id === values.subjectId);
  const paperLabels = selectedSubject?.paperLabels && selectedSubject.paperLabels.length > 0
    ? selectedSubject.paperLabels
    : ["Paper 1", "Paper 2"];

  const [isCustomLabel, setIsCustomLabel] = useState(() => {
    if (!values.paperLabel) return false;
    return !paperLabels.includes(values.paperLabel);
  });

  function handleChange<K extends keyof PastPaperFormValues>(key: K, value: PastPaperFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key === "subjectId") {
      setIsCustomLabel(false);
    }
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
            Subject *
          </label>
          <Select
            value={values.subjectId}
            onChange={(event) => handleChange("subjectId", event.target.value)}
          >
            <option value="">Select subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name} ({subject.shortCode})
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
            Exam year *
          </label>
          <Input
            type="number"
            placeholder="e.g. 2024"
            value={values.examYear}
            onChange={(event) => handleChange("examYear", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
            Paper label *
          </label>
          {paperLabels.length > 0 && !isCustomLabel ? (
            <Select
              value={values.paperLabel}
              onChange={(event) => {
                if (event.target.value === "__custom__") {
                  setIsCustomLabel(true);
                  handleChange("paperLabel", "");
                } else {
                  handleChange("paperLabel", event.target.value);
                }
              }}
            >
              <option value="">Select paper</option>
              {paperLabels.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
              <option value="__custom__">+ Enter custom label...</option>
            </Select>
          ) : (
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="e.g. Paper 1, Paper 2, Mock"
                value={values.paperLabel}
                onChange={(event) => handleChange("paperLabel", event.target.value)}
              />
              {paperLabels.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCustomLabel(false)}
                  className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors ml-1"
                >
                  Choose from list
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
            Date attempted *
          </label>
          <Input
            type="date"
            value={values.date}
            onChange={(event) => handleChange("date", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
            Score *
          </label>
          <Input
            type="number"
            placeholder="Marks obtained"
            value={values.score}
            onChange={(event) => handleChange("score", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
            Total marks *
          </label>
          <Input
            type="number"
            placeholder="Maximum marks"
            value={values.total}
            onChange={(event) => handleChange("total", event.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
            Notes
          </label>
          <textarea
            className="flex min-h-[100px] w-full rounded-xl border border-input bg-surface px-4 py-3 text-base transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
            placeholder="What did you learn from this attempt? Areas for improvement?"
            value={values.notes}
            onChange={(event) => handleChange("notes", event.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm font-bold text-rose-600">
          {error}
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            className="sm:min-w-[120px]"
            onClick={onCancel}
          >
            Cancel
          </Button>
        ) : null}
        <Button
          type="submit"
          className="sm:min-w-[160px]"
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
