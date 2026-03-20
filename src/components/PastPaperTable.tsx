import { useMemo, useState } from "react";
import type { CutoffData, PastPaperAttempt, Subject } from "../types";
import { getMarksToNextLevel } from "../utils/dseLevelEstimator";
import { parseIsoDate } from "../utils/dateHelpers";
import {
  buildSortedPastPaperGroups,
  getMissingRequiredPaperLabels,
  type PastPaperGroupModel,
  type PastPaperSortKey,
} from "../utils/pastPaperGroups";
import { Button } from "./ui/Button";

const EM_DASH = "—";

const EMPTY_CUTOFF: CutoffData = {};

// ─── Shared layout tokens ────────────────────────────────────────────────────
// Every row (summary, column-header, attempt) uses the SAME horizontal padding
// and the SAME metric column order: Score | % | Level | actions.
const OUTER_PX = "px-6 md:px-9 pl-7 md:pl-10";
const ROW = "flex items-center gap-4 md:gap-8";
const ID_COL = "flex-1 min-w-0";
const MET_GROUP = "flex items-center gap-4 md:gap-8 shrink-0";
const COL_PCT = "w-[5.25rem] md:w-[6rem] flex flex-col items-end text-right";
const COL_SCORE = "w-[5.5rem] md:w-[6.5rem] flex flex-col items-end text-right";
const COL_LEVEL = "w-[4.25rem] md:w-[5rem] flex flex-col items-end";
const COL_ACTION = "w-[4rem] md:w-[4.5rem] flex justify-end";

const LABEL = "text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground/50 leading-none mb-1.5";

/** Short token for chip, e.g. Paper 1 → 1, Paper 3 → 3 */
function paperChipToken(label: string): string {
  const n = label.match(/\d+/)?.[0];
  if (n) return n;
  return label.replace(/\s+/g, "").slice(0, 2).toUpperCase();
}

function PaperProgressSummary({
  group,
  accentColor,
}: {
  group: PastPaperGroupModel;
  accentColor: string;
}) {
  const labels = group.requiredPaperLabels;
  if (labels.length === 0) return null;

  if (group.isComplete) {
    return (
      <div
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 pl-2 pr-2.5 py-1 shadow-sm shadow-success/5"
        title="All papers for this year are logged"
        aria-label="All papers for this year are logged"
      >
        <span className="material-symbols-outlined text-success text-[18px] leading-none" aria-hidden>
          verified
        </span>
        <span
          className="flex h-1.5 gap-0.5"
          aria-hidden
        >
          {labels.map((label) => (
            <span
              key={label}
              className="w-1 rounded-full bg-success/80"
              style={{ minWidth: "0.28rem" }}
            />
          ))}
        </span>
      </div>
    );
  }

  const loggedCount = labels.filter((l) => group.bestByPaperLabel.has(l)).length;

  return (
    <div
      className="mt-3 flex flex-wrap items-center gap-1.5"
      aria-label={`${loggedCount} of ${labels.length} papers logged for this year`}
    >
      {labels.map((label) => {
        const done = group.bestByPaperLabel.has(label);
        const token = paperChipToken(label);
        return (
          <span
            key={label}
            title={label}
            className={`inline-flex items-center justify-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[9px] font-black tabular-nums tracking-tight transition-colors ${
              done
                ? "border-transparent text-primary-foreground shadow-sm"
                : "border-dashed border-muted-foreground/35 bg-muted/15 text-muted-foreground/55"
            }`}
            style={
              done
                ? {
                    backgroundColor: accentColor,
                    boxShadow: `0 1px 8px -2px ${accentColor}66`,
                  }
                : undefined
            }
          >
            <span className="material-symbols-outlined text-[14px] leading-none opacity-95" aria-hidden>
              {done ? "check" : "radio_button_unchecked"}
            </span>
            <span className="min-w-[0.65rem] text-center leading-none">{token}</span>
          </span>
        );
      })}
    </div>
  );
}

function formatAttemptDate(iso: string): string {
  const date = parseIsoDate(iso);
  const day = date.toLocaleDateString(undefined, { day: "2-digit" });
  const month = date.toLocaleDateString(undefined, { month: "short" });
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

interface PastPaperTableProps {
  attempts: PastPaperAttempt[];
  subjectsById: Record<string, Subject>;
  cutoffData?: CutoffData;
  onEdit: (attempt: PastPaperAttempt) => void;
  onDelete: (attemptId: string) => void;
  /** Open add form with subject, year, paper, DSE/mock pre-filled */
  onLogMissingPaper?: (prefill: Partial<PastPaperAttempt>) => void;
  sortKey?: PastPaperSortKey;
  sortDirection?: "asc" | "desc";
}

export function PastPaperTable({
  attempts,
  subjectsById,
  cutoffData,
  onEdit,
  onDelete,
  onLogMissingPaper,
  sortKey = "date",
  sortDirection = "desc",
}: PastPaperTableProps) {
  const cutoff = cutoffData ?? EMPTY_CUTOFF;
  const groups = useMemo(
    () => buildSortedPastPaperGroups(attempts, subjectsById, cutoff, sortKey, sortDirection),
    [attempts, subjectsById, cutoff, sortKey, sortDirection]
  );

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggleExpanded(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (attempts.length === 0) {
    return (
      <div className="rounded-zen border border-dashed border-border-hairline bg-surface/40 p-20 text-center">
        <span className="material-symbols-outlined text-muted-foreground/20 text-6xl mb-4">description</span>
        <h3 className="text-xl font-light text-primary mb-1 leading-tight">Your history is a blank page</h3>
        <p className="text-sm text-muted-foreground font-light">Add your first past paper to start the journey.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <GroupedPastPaperCard
          key={group.key}
          group={group}
          subjectsById={subjectsById}
          cutoffData={cutoff}
          expanded={!!expanded[group.key]}
          onToggleExpand={() => toggleExpanded(group.key)}
          onEdit={onEdit}
          onDelete={onDelete}
          onLogMissingPaper={onLogMissingPaper}
        />
      ))}
    </div>
  );
}

interface GroupedPastPaperCardProps {
  group: PastPaperGroupModel;
  subjectsById: Record<string, Subject>;
  cutoffData: CutoffData;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: (attempt: PastPaperAttempt) => void;
  onDelete: (attemptId: string) => void;
  onLogMissingPaper?: (prefill: Partial<PastPaperAttempt>) => void;
}

function GroupedPastPaperCard({
  group,
  subjectsById,
  cutoffData,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onLogMissingPaper,
}: GroupedPastPaperCardProps) {
  const subject = group.subject ?? subjectsById[group.subjectId];
  const missingPaperLabels = !group.isComplete ? getMissingRequiredPaperLabels(group) : [];
  const subjectKey = subject?.shortCode ?? group.subjectId;

  const hasFullYearPct = group.weightedPercentage != null;
  const pctValue = hasFullYearPct ? group.weightedPercentage : group.levelBasisPercentage;
  const pctDisplay = pctValue != null ? `${pctValue.toFixed(1)}%` : EM_DASH;
  const showPartialPctHint = !hasFullYearPct && pctValue != null;
  const requiredPaperCount = group.requiredPaperLabels.length;
  const loggedRequiredCount = showPartialPctHint
    ? group.requiredPaperLabels.filter((l) => group.bestByPaperLabel.has(l)).length
    : 0;
  const partialPapersLabel =
    showPartialPctHint && requiredPaperCount > 0
      ? `${loggedRequiredCount}/${requiredPaperCount} papers`
      : null;
  const levelDisplay = group.overallLevel ?? EM_DASH;

  let gapSummary: string | null = null;
  if (
    group.isDse &&
    group.levelBasisPercentage != null &&
    group.levelBasisTotalMarks != null &&
    group.levelBasisTotalMarks > 0
  ) {
    const gap = getMarksToNextLevel(
      subjectKey,
      group.levelBasisPercentage,
      cutoffData,
      group.examYear,
      group.levelBasisTotalMarks
    );
    if (gap) gapSummary = `${gap.percentageGap.toFixed(1)}% to ${gap.nextLevel}`;
  }

  return (
    <div className="group/card zen-shadow bg-surface rounded-zen overflow-hidden relative transition-all hover:scale-[1.005]">
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 opacity-20 group-hover/card:opacity-100 transition-opacity pointer-events-none"
        style={{ backgroundColor: subject?.baseColor || "#64748b" }}
      />

      {/* ── Summary row ── */}
      <div className={`${OUTER_PX} py-7 md:py-8 ${ROW}`}>
        {/* Identity */}
        <div className={`${ID_COL} flex items-center gap-4 md:gap-5`}>
          <div className="shrink-0 text-center w-16">
            <p className={`${LABEL} text-center`}>{group.isDse ? "DSE" : "Mock"}</p>
            <p className="text-3xl font-light text-primary tracking-tighter tabular-nums leading-none">
              {group.examYear}
            </p>
          </div>
          <div className="hidden sm:block w-px self-stretch min-h-[2.75rem] bg-border-hairline shrink-0" />
          <div className="min-w-0 flex-1 flex flex-col items-start">
            <span
              className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-border-hairline"
              style={{
                color: subject?.baseColor || "#64748b",
                backgroundColor: subject?.baseColor ? `${subject.baseColor}30` : "transparent",
              }}
            >
              {subject?.name || "Unknown"}
            </span>
            <PaperProgressSummary group={group} accentColor={subject?.baseColor || "#64748b"} />
          </div>
        </div>

        {/* Metrics: Score | overall % | Level | action — matches expanded row column order */}
        <div className={MET_GROUP}>
          {/* Spacer aligns with per-paper Score column when expanded */}
          <div className={COL_SCORE} aria-hidden />
          <div
            className={COL_PCT}
            title={
              showPartialPctHint
                ? "Weighted average over logged papers only; weights renormalized. Missing papers are excluded—not the same as the full-year aggregate."
                : undefined
            }
          >
            <span className={`${LABEL} flex flex-col items-end gap-0`}>
              <span className="leading-tight">Overall</span>
              <span className="leading-tight">percentage</span>
            </span>
            <p
              className={`text-2xl md:text-3xl font-light leading-none tabular-nums ${showPartialPctHint ? "text-success/90" : "text-success"}`}
              aria-label={
                showPartialPctHint
                  ? partialPapersLabel
                    ? `${pctDisplay} partial year, ${partialPapersLabel} logged`
                    : `${pctDisplay} partial year, weights renormalized over logged papers only`
                  : undefined
              }
            >
              {pctDisplay}
            </p>
            {showPartialPctHint ? (
              <p className="text-[9px] font-bold text-muted-foreground/70 mt-1.5 text-right leading-tight max-w-[6rem]">
                Partial
                {partialPapersLabel ? (
                  <>
                    <span className="text-muted-foreground/45 mx-0.5" aria-hidden>
                      ·
                    </span>
                    {partialPapersLabel}
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
          <div className={COL_LEVEL}>
            <span className={LABEL}>Level</span>
            <LevelBadge value={levelDisplay} size="lg" subLine={gapSummary} />
          </div>
          <div className={COL_ACTION}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors"
              aria-expanded={expanded}
              aria-label={expanded ? "Collapse attempts" : "Expand attempts"}
            >
              <span className="material-symbols-outlined text-2xl">
                {expanded ? "expand_less" : "expand_more"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Expanded section ── */}
      {expanded && (
        <div className="border-t border-border-hairline bg-muted/10">
          {/* Column headers — same OUTER_PX + same MET_GROUP structure */}
          <div className={`${OUTER_PX} pt-4 pb-2 ${ROW}`}>
            <div className={ID_COL}>
              <span className={LABEL}>Paper / details</span>
            </div>
            <div className={MET_GROUP}>
              <div className={COL_SCORE}><span className={LABEL}>Score</span></div>
              <div className={COL_PCT}><span className={LABEL}>%</span></div>
              <div className={COL_LEVEL}><span className={LABEL}>Level</span></div>
              <div className={COL_ACTION} />
            </div>
          </div>

          {/* Attempt rows — same OUTER_PX + same MET_GROUP structure */}
          <div className="pb-4">
            {group.attempts.map((attempt, idx) => (
              <AttemptRow
                key={attempt.id}
                attempt={attempt}
                subject={subject}
                cutoffData={cutoffData}
                hasBorderTop={idx > 0}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {missingPaperLabels.map((paperLabel, idx) => (
              <MissingPaperRow
                key={`missing-${group.key}-${paperLabel}`}
                paperLabel={paperLabel}
                hasBorderTop={group.attempts.length > 0 || idx > 0}
                disabled={!onLogMissingPaper}
                onLogResult={() => {
                  onLogMissingPaper?.({
                    subjectId: group.subjectId,
                    examYear: group.examYear,
                    paperLabel,
                    isDse: group.isDse,
                  });
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LevelBadge({
  value,
  size,
  subLine,
}: {
  value: string;
  size: "lg" | "md";
  subLine?: string | null;
}) {
  if (value === EM_DASH) {
    const sz = size === "lg" ? "text-2xl md:text-3xl" : "text-xl";
    return <p className={`${sz} font-light text-primary tabular-nums`}>{EM_DASH}</p>;
  }
  const badge =
    size === "lg"
      ? "text-2xl min-w-[3rem] h-11 px-2 rounded-2xl"
      : "text-xl min-w-[2.75rem] h-9 px-2 rounded-xl";
  return (
    <div className="flex flex-col items-end gap-0">
      <span
        className={`font-black text-primary-foreground bg-primary inline-flex items-center justify-center shadow-md shadow-primary/20 tabular-nums ${badge}`}
      >
        {value}
      </span>
      {subLine ? (
        <p className="text-[9px] font-bold text-muted-foreground/70 mt-1.5 whitespace-nowrap text-right">
          {subLine}
        </p>
      ) : null}
    </div>
  );
}

function MissingPaperRow({
  paperLabel,
  hasBorderTop,
  onLogResult,
  disabled,
}: {
  paperLabel: string;
  hasBorderTop: boolean;
  onLogResult: () => void;
  disabled: boolean;
}) {
  return (
    <div
      className={`${OUTER_PX} py-4 ${ROW} bg-muted/10 transition-colors ${hasBorderTop ? "border-t border-dashed border-border-hairline/70" : ""}`}
    >
      <div className={`${ID_COL} min-w-0`}>
        <p className="text-[13px] font-semibold text-primary/80 leading-snug">{paperLabel}</p>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-50">
          Not logged yet
        </p>
        <p className="text-xs text-muted-foreground/80 mt-2 max-w-md">
          Add a result for this paper to complete the year summary.
        </p>
      </div>
      <div className={MET_GROUP}>
        <div className={COL_SCORE}>
          <p className="text-lg md:text-xl font-light text-muted-foreground/40 leading-none tabular-nums">{EM_DASH}</p>
        </div>
        <div className={COL_PCT}>
          <p className="text-lg md:text-xl font-light text-muted-foreground/40 leading-none tabular-nums">{EM_DASH}</p>
        </div>
        <div className={COL_LEVEL}>
          <p className="text-xl font-light text-muted-foreground/40 tabular-nums">{EM_DASH}</p>
        </div>
        <div className={`${COL_ACTION} flex-col sm:flex-row items-end gap-1`}>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            className="rounded-full text-[9px] font-black uppercase tracking-widest h-9 px-4 shrink-0"
            onClick={onLogResult}
          >
            Log result
          </Button>
        </div>
      </div>
    </div>
  );
}

function AttemptRow({
  attempt,
  subject,
  cutoffData,
  hasBorderTop,
  onEdit,
  onDelete,
}: {
  attempt: PastPaperAttempt;
  subject: Subject | undefined;
  cutoffData: CutoffData;
  hasBorderTop: boolean;
  onEdit: (attempt: PastPaperAttempt) => void;
  onDelete: (attemptId: string) => void;
}) {
  const subjectKey = subject?.shortCode ?? attempt.subjectId;
  let gapLine: string | null = null;
  if (attempt.isDse !== false) {
    const gap = getMarksToNextLevel(
      subjectKey,
      attempt.percentage,
      cutoffData,
      attempt.examYear,
      attempt.total
    );
    if (gap) gapLine = `${gap.percentageGap.toFixed(1)}% to ${gap.nextLevel}`;
  }

  return (
    <div
      className={`${OUTER_PX} py-4 ${ROW} transition-colors hover:bg-muted/20 ${hasBorderTop ? "border-t border-border-hairline/50" : ""}`}
    >
      {/* Identity */}
      <div className={ID_COL}>
        <p className="text-[13px] font-semibold text-primary leading-snug">{attempt.paperLabel}</p>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-60">
          {formatAttemptDate(attempt.date)}
        </p>
        {attempt.notes ? (
          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{attempt.notes}</p>
        ) : null}
      </div>

      {/* Metrics — same MET_GROUP + column order as summary */}
      <div className={MET_GROUP}>
        <div className={COL_SCORE}>
          <p className="text-lg md:text-xl font-light text-primary leading-none tabular-nums">
            {attempt.score}
            <span className="text-sm font-light text-muted-foreground ml-1">/ {attempt.total}</span>
          </p>
        </div>
        <div className={COL_PCT}>
          <p className="text-lg md:text-xl font-light text-success leading-none tabular-nums">
            {attempt.percentage.toFixed(1)}%
          </p>
        </div>
        <div className={COL_LEVEL}>
          <LevelBadge value={attempt.estimatedLevel} size="md" subLine={gapLine} />
        </div>
        <div className={COL_ACTION}>
          <button
            type="button"
            onClick={() => onEdit(attempt)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors"
            aria-label="Edit attempt"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(attempt.id)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-dot-red hover:bg-muted/50 transition-colors"
            aria-label="Delete attempt"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
