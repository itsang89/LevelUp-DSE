import { useEffect, useMemo, useState } from "react";
import { PastPaperForm, type PastPaperFormValues } from "../components/PastPaperForm";
import { PastPaperTable } from "../components/PastPaperTable";
import type { CutoffData, PastPaperAttempt, Subject } from "../types";
import { estimateDseLevel, hasSubjectCutoffData } from "../utils/dseLevelEstimator";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import {
  createPastPaperAttempt,
  deletePastPaperAttempt,
  listPastPaperAttempts,
  updatePastPaperAttempt,
} from "../lib/api/pastPapersApi";

interface PastPapersPageProps {
  userId: string;
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
  userId,
  subjects,
  cutoffData,
  usingGenericFallback,
}: PastPapersPageProps) {
  const [attempts, setAttempts] = useState<PastPaperAttempt[]>([]);
  const [editingAttempt, setEditingAttempt] = useState<PastPaperAttempt | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [paperFilter, setPaperFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection] = useState<SortDirection>("desc");
  const [dataError, setDataError] = useState<string | null>(null);
  const [isPersisting, setIsPersisting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    listPastPaperAttempts(userId)
      .then((rows) => {
        if (isMounted) {
          setAttempts(rows);
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setDataError(
            requestError instanceof Error ? requestError.message : "Failed to load past paper history."
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const subjectsById = useMemo(
    () => Object.fromEntries(subjects.map((subject) => [subject.id, subject])),
    [subjects]
  );

  const activeSubject = useMemo(
    () => subjects.find((s) => s.id === subjectFilter),
    [subjects, subjectFilter]
  );

  const availablePaperLabels = useMemo(() => {
    if (!activeSubject) return [];
    
    // Get labels from current attempts for this subject
    const subjectAttempts = attempts.filter(a => a.subjectId === subjectFilter);
    const usedLabels = Array.from(new Set(subjectAttempts.map(a => a.paperLabel)));
    
    // Get predefined labels
    const predefinedLabels = activeSubject.paperLabels && activeSubject.paperLabels.length > 0
      ? activeSubject.paperLabels
      : ["Paper 1", "Paper 2"];
      
    // Combine and deduplicate
    return Array.from(new Set([...predefinedLabels, ...usedLabels])).sort();
  }, [activeSubject, attempts, subjectFilter]);

  useEffect(() => {
    setPaperFilter("all");
  }, [subjectFilter]);

  const filteredAttempts = useMemo(() => {
    let list = subjectFilter === "all"
      ? attempts
      : attempts.filter((attempt) => attempt.subjectId === subjectFilter);

    if (paperFilter !== "all") {
      list = list.filter((attempt) => attempt.paperLabel === paperFilter);
    }

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
  }, [attempts, sortDirection, sortKey, subjectFilter, paperFilter]);

  async function handleSubmit(values: PastPaperFormValues): Promise<void> {
    const score = Number(values.score);
    const total = Number(values.total);
    const percentage = (score / total) * 100;

    const subjectKey = subjectsById[values.subjectId]?.shortCode ?? values.subjectId;
    const examYear = Number(values.examYear);
    const hasCutoff = hasSubjectCutoffData(cutoffData, subjectKey, examYear);
    const estimatedLevel =
      values.isDse && hasCutoff
        ? estimateDseLevel(subjectKey, percentage, cutoffData, examYear)
        : values.manualGrade.trim();

    try {
      setIsPersisting(true);
      if (editingAttempt) {
        const updatedAttempt: PastPaperAttempt = {
          ...editingAttempt,
          subjectId: values.subjectId,
          examYear: Number(values.examYear),
          paperLabel: values.paperLabel.trim(),
          date: values.date,
          score,
          total,
          percentage,
          estimatedLevel,
          notes: values.notes.trim() || undefined,
        };
        await updatePastPaperAttempt(userId, updatedAttempt);
        setAttempts((prev) =>
          prev.map((attempt) => (attempt.id === editingAttempt.id ? updatedAttempt : attempt))
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
          notes: values.notes.trim() || undefined,
        };
        await createPastPaperAttempt(userId, newAttempt);
        setAttempts((prev) => [...prev, newAttempt]);
      }
      setDataError(null);
      setEditingAttempt(null);
      setIsModalOpen(false);
    } catch (requestError) {
      setDataError(
        requestError instanceof Error ? requestError.message : "Failed to save past paper attempt."
      );
    } finally {
      setIsPersisting(false);
    }
  }

  async function handleDelete(attemptId: string): Promise<void> {
    const confirmed = window.confirm("Are you sure you want to delete this attempt?");
    if (!confirmed) {
      return;
    }
    try {
      setIsPersisting(true);
      await deletePastPaperAttempt(userId, attemptId);
      setAttempts((prev) => prev.filter((attempt) => attempt.id !== attemptId));
      setDataError(null);
    } catch (requestError) {
      setDataError(
        requestError instanceof Error ? requestError.message : "Failed to delete past paper attempt."
      );
    } finally {
      setIsPersisting(false);
    }
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
      <div className="flex flex-col sm:flex-row justify-between items-end gap-6 sticky top-0 bg-background/80 backdrop-blur-md py-4 z-30 border-b border-border-hairline -mx-6 px-6 lg:-mx-12 lg:px-12 transition-all duration-300">
        <div>
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-60">Mastery</h3>
          <p className="text-3xl font-light text-primary tracking-tight">Past Paper History</p>
        </div>
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
              <option value="percentage">Percentage</option>
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

      <div className="space-y-10">
        <div className="flex flex-col gap-8 px-2">
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

          {availablePaperLabels.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
              <button
                onClick={() => setPaperFilter("all")}
                className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                  paperFilter === "all"
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-transparent text-muted-foreground/60 border border-transparent hover:text-muted-foreground"
                }`}
              >
                All Papers
              </button>
              {availablePaperLabels.map((label) => (
                <button
                  key={label}
                  onClick={() => setPaperFilter(label)}
                  className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                    paperFilter === label
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-transparent text-muted-foreground/60 border border-transparent hover:text-muted-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {usingGenericFallback && (
          <div className="flex items-center gap-2 p-4 rounded-zen bg-amber-50/50 border border-amber-100/50 text-xs font-medium text-amber-700 mx-2">
            <span className="material-symbols-outlined text-lg opacity-60">info</span>
            Using generic cutoffs. Subject-specific data unavailable.
          </div>
        )}

        {dataError && (
          <div className="flex items-center gap-2 p-4 rounded-zen bg-rose-50/50 border border-rose-100/50 text-xs font-medium text-rose-700 mx-2">
            <span className="material-symbols-outlined text-lg opacity-60">error</span>
            {dataError}
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
          cutoffData={cutoffData}
          initialValues={editingAttempt ?? undefined}
          onSubmit={handleSubmit}
          submitLabel={isPersisting ? "Saving..." : editingAttempt ? "Update Entry" : "Add Journey"}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingAttempt(null);
          }}
        />
      </Modal>
    </section>
  );
}
