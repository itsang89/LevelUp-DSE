import { type FormEvent, useMemo, useState } from "react";
import type { CutoffData, PastPaperAttempt, Subject } from "../types";
import { formatIsoDate } from "../utils/dateHelpers";
import { estimateDseLevel, hasSubjectCutoffData } from "../utils/dseLevelEstimator";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";

const GRADE_OPTIONS = ["5**", "5*", "5", "4", "3", "2", "1", "U"] as const;

export interface PastPaperFormValues {
  subjectId: string;
  examYear: string;
  paperLabel: string;
  date: string;
  score: string;
  total: string;
  isDse: boolean;
  manualGrade: string;
  notes: string;
}

interface PastPaperFormProps {
  subjects: Subject[];
  cutoffData: CutoffData;
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
    isDse: true,
    manualGrade: initialValues?.estimatedLevel ?? "5",
    notes: initialValues?.notes ?? "",
  };
}

export function PastPaperForm({
  subjects,
  cutoffData,
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

  const subjectKey = selectedSubject?.shortCode ?? values.subjectId;
  const examYear = Number(values.examYear);

  const hasCutoffData = useMemo(
    () => hasSubjectCutoffData(cutoffData, subjectKey, examYear),
    [cutoffData, subjectKey, examYear]
  );

  const predictedGrade = useMemo(() => {
    const score = Number(values.score);
    const total = Number(values.total);
    if (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0) return null;
    const percentage = (score / total) * 100;
    return estimateDseLevel(subjectKey, percentage, cutoffData, examYear);
  }, [values.score, values.total, subjectKey, examYear, cutoffData]);

  const showManualGrade = !values.isDse || !hasCutoffData;

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
    if (showManualGrade && !values.manualGrade.trim()) {
      setError("Please select a grade.");
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

        <div className="space-y-3 md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 block">
            Paper type
          </label>
          <div className="flex p-1 bg-surface border border-border-hairline rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => handleChange("isDse", true)}
              className={`flex-1 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                values.isDse
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              DSE past paper
            </button>
            <button
              type="button"
              onClick={() => handleChange("isDse", false)}
              className={`flex-1 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                !values.isDse
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              Other / mock
            </button>
          </div>
        </div>

        {showManualGrade ? (
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              Grade *
            </label>
            <Select
              value={values.manualGrade}
              onChange={(event) => handleChange("manualGrade", event.target.value)}
            >
              {GRADE_OPTIONS.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </Select>
            {values.isDse && !hasCutoffData && (
              <p className="text-xs text-muted-foreground mt-1">
                No cutoff data for this subject or year. Enter your grade manually.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              Predicted grade
            </label>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <span className="text-2xl font-black text-primary size-12 flex items-center justify-center rounded-xl bg-primary/10">
                {predictedGrade ?? "—"}
              </span>
              <p className="text-sm text-muted-foreground">
                {predictedGrade
                  ? "Based on HKDSE cutoff data for this year and subject."
                  : "Enter score and total to see predicted grade."}
              </p>
            </div>
          </div>
        )}

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
