import { useEffect, useMemo, useState } from "react";
import { PastPaperForm, type PastPaperFormValues } from "../components/PastPaperForm";
import { PastPaperTable } from "../components/PastPaperTable";
import { PaperMatrix } from "../components/PaperMatrix";
import { ExportDropdown } from "../components/ExportDropdown";
import { SortDropdown } from "../components/SortDropdown";
import { DateFilterDropdown } from "../components/DateFilterDropdown";
import type { CutoffData, PastPaperAttempt, Subject } from "../types";
import { estimateDseLevel, hasSubjectCutoffData } from "../utils/dseLevelEstimator";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import {
  createPastPaperAttempt,
  deletePastPaperAttempt,
  listPastPaperAttempts,
  updatePastPaperAttempt,
} from "../lib/api/pastPapersApi";
import { formatIsoDate, subDays } from "../utils/dateHelpers";
import {
  exportPastPapersCsv,
  exportPastPapersJson,
  downloadBlob,
  getExportFilename,
} from "../utils/exportUtils";

interface PastPapersPageProps {
  userId: string;
  subjects: Subject[];
  cutoffData: CutoffData;
  usingGenericFallback: boolean;
}

type SortKey = "date" | "examYear" | "percentage";
type SortDirection = "asc" | "desc";
type DateRangeFilter = "all" | "last30" | "last3months" | "custom";

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
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>("all");
  const [customFromDate, setCustomFromDate] = useState<string>("");
  const [customToDate, setCustomToDate] = useState<string>("");
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

    if (dateRangeFilter !== "all") {
      const today = formatIsoDate(new Date());
      if (dateRangeFilter === "last30") {
        const cutoff = formatIsoDate(subDays(new Date(), 30));
        list = list.filter((a) => a.date >= cutoff && a.date <= today);
      } else if (dateRangeFilter === "last3months") {
        const cutoff = formatIsoDate(subDays(new Date(), 90));
        list = list.filter((a) => a.date >= cutoff && a.date <= today);
      } else if (dateRangeFilter === "custom" && customFromDate && customToDate) {
        list = list.filter((a) => a.date >= customFromDate && a.date <= customToDate);
      }
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
  }, [attempts, sortDirection, sortKey, subjectFilter, paperFilter, dateRangeFilter, customFromDate, customToDate]);

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
          isDse: values.isDse,
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
          isDse: values.isDse,
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
    <section className="space-y-4 pt-6 lg:pt-12 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6 sticky top-0 bg-background/80 backdrop-blur-md py-4 z-30 border-b border-border-hairline -mx-6 px-6 lg:-mx-12 lg:px-12 transition-all duration-300">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-50 mb-1 leading-none">Evaluation</span>
          <h1 className="text-3xl font-light text-primary tracking-tight leading-none">Past Paper History</h1>
        </div>
        <div className="flex items-center gap-2">
          <DateFilterDropdown
            filter={dateRangeFilter}
            setFilter={setDateRangeFilter}
            fromDate={customFromDate}
            setFromDate={setCustomFromDate}
            toDate={customToDate}
            setToDate={setCustomToDate}
          />
          <SortDropdown
            sortKey={sortKey}
            setSortKey={setSortKey}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
          />
          <ExportDropdown
            onExportCsv={() => {
              const csv = exportPastPapersCsv(filteredAttempts, subjectsById);
              downloadBlob(new Blob([csv], { type: "text/csv" }), getExportFilename("past-papers", "csv"));
            }}
            onExportJson={() => {
              const json = exportPastPapersJson(filteredAttempts);
              downloadBlob(new Blob([json], { type: "application/json" }), getExportFilename("past-papers", "json"));
            }}
          />
          <div className="w-px h-6 bg-border-hairline mx-2 opacity-50" />
          <Button 
            size="sm" 
            className="rounded-full bg-primary text-primary-foreground h-10 px-6 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 zen-shadow hover:scale-105 transition-all duration-300 active:scale-95"
            onClick={openAddModal}
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add Entry
          </Button>
        </div>
      </div>

      <div className="space-y-10">
        <div className="flex flex-col gap-6 px-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSubjectFilter("all")}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                subjectFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-soft hover:scale-105 active:scale-95"
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
                    ? "bg-primary text-primary-foreground shadow-soft hover:scale-105 active:scale-95"
                    : "bg-surface text-muted-foreground border border-border-hairline hover:bg-muted/50"
                }`}
              >
                <div 
                  className="w-1.5 h-1.5 rounded-full" 
                  style={{ 
                    backgroundColor: subjectFilter === subject.id ? "var(--theme-primary-foreground)" : subject.baseColor 
                  }} 
                />
                {subject.shortCode}
              </button>
            ))}
          </div>

          {availablePaperLabels.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-500 bg-muted/20 p-2 rounded-3xl border border-border-hairline/50">
              <button
                onClick={() => setPaperFilter("all")}
                className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                  paperFilter === "all"
                    ? "bg-primary text-primary-foreground shadow-sm hover:scale-105"
                    : "bg-transparent text-muted-foreground/60 hover:text-muted-foreground"
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
                      ? "bg-primary text-primary-foreground shadow-sm hover:scale-105"
                      : "bg-transparent text-muted-foreground/60 hover:text-muted-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
              
              <div className="w-px h-4 bg-border-hairline mx-2 opacity-50" />
              
              <button
                onClick={() => setIsMatrixOpen(!isMatrixOpen)}
                className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5 ${
                  isMatrixOpen
                    ? "bg-primary text-primary-foreground shadow-soft hover:scale-105"
                    : "bg-transparent text-muted-foreground/60 border border-border-hairline hover:text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <span className="material-symbols-outlined text-[12px]">grid_view</span>
                Matrix
              </button>
            </div>
          )}
        </div>

        {activeSubject && isMatrixOpen && (
          <div className="px-2">
            <PaperMatrix
              subject={activeSubject}
              attempts={attempts}
              availablePaperLabels={availablePaperLabels}
              cutoffData={cutoffData}
            />
          </div>
        )}

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
          cutoffData={cutoffData}
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
        title={editingAttempt ? "Edit Past Paper" : "Add Past Paper"}
        description={editingAttempt ? "Update your past paper results." : "Log your latest past paper session."}
      >
        <PastPaperForm
          key={editingAttempt?.id ?? "new"}
          subjects={subjects}
          cutoffData={cutoffData}
          initialValues={editingAttempt ?? undefined}
          onSubmit={handleSubmit}
          submitLabel={isPersisting ? "Saving..." : editingAttempt ? "Update Entry" : "Add Entry"}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingAttempt(null);
          }}
        />
      </Modal>
    </section>
  );
}
