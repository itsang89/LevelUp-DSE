import { useMemo, useState } from "react";
import { PastPaperForm, type PastPaperFormValues } from "../components/PastPaperForm";
import { PastPaperTable } from "../components/PastPaperTable";
import { STORAGE_KEYS } from "../constants";
import { usePersistentState } from "../hooks/usePersistentState";
import type { CutoffData, PastPaperAttempt, Subject } from "../types";
import { estimateDseLevel } from "../utils/dseLevelEstimator";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";

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
  const [sortDirection] = useState<SortDirection>("desc");

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

  const stats = useMemo(() => {
    if (filteredAttempts.length === 0) return null;
    const avgPercentage = filteredAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / filteredAttempts.length;
    const totalAttempts = filteredAttempts.length;
    const topLevel = filteredAttempts.reduce((prev, curr) => {
      const levels = ["2", "3", "4", "5", "5*", "5**"];
      return levels.indexOf(curr.estimatedLevel) > levels.indexOf(prev) ? curr.estimatedLevel : prev;
    }, "2");

    return { avgPercentage, totalAttempts, topLevel };
  }, [filteredAttempts]);

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
    const confirmed = window.confirm("Are you sure you want to delete this attempt?");
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
    <section className="space-y-16 pt-6 lg:pt-12 pb-20">
      <div>
        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-60">Mastery</h3>
        <p className="text-3xl font-light text-primary tracking-tight">Zen Analytics</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="zen-shadow rounded-zen p-10 bg-surface border-0">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6 opacity-60">Aggregate Mastery</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-6xl font-extralight text-primary tracking-tighter">{stats?.topLevel || "—"}</h3>
            {stats && <span className="text-success text-sm font-light">+1.2%</span>}
          </div>
        </div>
        <div className="zen-shadow rounded-zen p-10 bg-surface border-0">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6 opacity-60">Completed Journeys</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-6xl font-extralight text-primary tracking-tighter">{stats?.totalAttempts || 0}</h3>
            <span className="text-muted-foreground text-sm font-light ml-1">papers</span>
          </div>
        </div>
        <div className="zen-shadow rounded-zen p-10 bg-surface border-0">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6 opacity-60">Current Velocity</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-6xl font-extralight text-primary tracking-tighter">
              {stats?.avgPercentage.toFixed(1) || "0.0"}<span className="text-3xl font-light opacity-40">%</span>
            </h3>
          </div>
        </div>
      </div>

      <div className="space-y-10">
        <div className="flex flex-col gap-8 px-2">
          <div className="flex items-center justify-between">
            <h4 className="text-2xl font-extralight text-primary tracking-tight">Past Paper History</h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Sort</span>
                <Select 
                  className="h-8 py-0 px-3 text-xs rounded-full bg-transparent border-border-hairline"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                >
                  <option value="date">Date</option>
                  <option value="examYear">Year</option>
                  <option value="percentage">Success</option>
                </Select>
              </div>
              <Button 
                size="sm" 
                className="rounded-full bg-primary text-white h-9 px-6 text-[10px] font-black uppercase tracking-widest"
                onClick={openAddModal}
              >
                Add Entry
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSubjectFilter("all")}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                subjectFilter === "all"
                  ? "bg-primary text-white shadow-soft"
                  : "bg-surface text-muted-foreground border border-border-hairline hover:bg-muted/50"
              }`}
            >
              Recent
            </button>
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setSubjectFilter(subject.id)}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
                  subjectFilter === subject.id
                    ? "bg-primary text-white shadow-soft"
                    : "bg-surface text-muted-foreground border border-border-hairline hover:bg-muted/50"
                }`}
              >
                <div 
                  className="w-1.5 h-1.5 rounded-full" 
                  style={{ 
                    backgroundColor: subjectFilter === subject.id ? "white" : subject.baseColor 
                  }} 
                />
                {subject.shortCode}
              </button>
            ))}
          </div>
        </div>

        {usingGenericFallback && (
          <div className="flex items-center gap-2 p-4 rounded-zen bg-amber-50/50 border border-amber-100/50 text-xs font-medium text-amber-700 mx-2">
            <span className="material-symbols-outlined text-lg opacity-60">info</span>
            Using generic cutoffs. Subject-specific data unavailable.
          </div>
        )}

        <PastPaperTable
          attempts={filteredAttempts}
          subjectsById={subjectsById}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAttempt(null);
        }}
        title={editingAttempt ? "Edit Journey" : "New Journey"}
        description={editingAttempt ? "Update your past paper results." : "Log your latest past paper session."}
      >
        <PastPaperForm
          key={editingAttempt?.id ?? "new"}
          subjects={subjects}
          initialValues={editingAttempt ?? undefined}
          onSubmit={handleSubmit}
          submitLabel={editingAttempt ? "Update Entry" : "Add Journey"}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingAttempt(null);
          }}
        />
      </Modal>
    </section>
  );
}
