import type { CutoffData, PastPaperAttempt, Subject } from "../types";
import { estimateDseLevel, hasSubjectCutoffData } from "./dseLevelEstimator";
import {
  attemptMatchesFormalPaper,
  getSubjectWeightingFromJson,
  type SubjectWeightingConfig,
} from "./subjectWeighting";

export type PastPaperSortKey = "date" | "examYear" | "percentage";

export function pastPaperGroupKey(attempt: PastPaperAttempt): string {
  const dse = attempt.isDse !== false;
  return `${attempt.subjectId}\0${attempt.examYear}\0${dse ? "dse" : "mock"}`;
}

function defaultPaperLabels(subject: Subject | undefined): string[] {
  if (subject?.paperLabels && subject.paperLabels.length > 0) {
    return [...subject.paperLabels];
  }
  return ["Paper 1", "Paper 2"];
}

/**
 * Normalized weights per required paper label; sums to 1.
 */
export function normalizedPaperWeights(
  labels: string[],
  paperWeights: Record<string, number> | undefined
): Record<string, number> {
  if (labels.length === 0) return {};
  const raw: Record<string, number> = {};
  let sum = 0;
  for (const label of labels) {
    const w = paperWeights?.[label];
    const v = typeof w === "number" && Number.isFinite(w) && w > 0 ? w : 1;
    raw[label] = v;
    sum += v;
  }
  const out: Record<string, number> = {};
  for (const label of labels) {
    out[label] = sum > 0 ? raw[label] / sum : 1 / labels.length;
  }
  return out;
}

function bestAttemptPerLabel(attempts: PastPaperAttempt[]): Map<string, PastPaperAttempt> {
  const map = new Map<string, PastPaperAttempt>();
  for (const a of attempts) {
    const prev = map.get(a.paperLabel);
    if (!prev || a.percentage > prev.percentage) {
      map.set(a.paperLabel, a);
    }
  }
  return map;
}

/** Best attempt per formal paper label (JSON / official names), matching flexible user labels. */
function bestAttemptPerFormalLabel(
  attempts: PastPaperAttempt[],
  formalLabels: string[]
): Map<string, PastPaperAttempt> {
  const map = new Map<string, PastPaperAttempt>();
  for (const formal of formalLabels) {
    for (const a of attempts) {
      if (!attemptMatchesFormalPaper(a.paperLabel, formal, formalLabels)) continue;
      const prev = map.get(formal);
      if (!prev || a.percentage > prev.percentage) {
        map.set(formal, a);
      }
    }
  }
  return map;
}

function weightsFromJsonConfig(config: SubjectWeightingConfig): Record<string, number> {
  const labels = config.papers.map((p) => p.label);
  const raw: Record<string, number> = {};
  let sum = 0;
  for (const p of config.papers) {
    const v = typeof p.weight === "number" && Number.isFinite(p.weight) && p.weight > 0 ? p.weight : 0;
    raw[p.label] = v;
    sum += v;
  }
  const out: Record<string, number> = {};
  for (const label of labels) {
    out[label] = sum > 0 ? raw[label] / sum : 1 / labels.length;
  }
  return out;
}

export interface PastPaperGroupModel {
  key: string;
  subjectId: string;
  examYear: number;
  isDse: boolean;
  subject: Subject | undefined;
  /** All attempts in this group (for inner rows), sorted for stable display */
  attempts: PastPaperAttempt[];
  requiredPaperLabels: string[];
  /** Best attempt per paper label within the group */
  bestByPaperLabel: Map<string, PastPaperAttempt>;
  /** Every required paper has at least one attempt */
  isComplete: boolean;
  /** Weighted % from best attempts; null if incomplete */
  weightedPercentage: number | null;
  /** Sum of best scores / sum of best totals when complete */
  overallScoreSum: number | null;
  overallTotalSum: number | null;
  /** From cutoff estimator when DSE + data; partial/fallback when incomplete */
  overallLevel: string | null;
  /**
   * Percentage used for summary level and gap-to-next (full weighted when complete,
   * renormalized partial weighted when some papers missing, else best attempt %).
   */
  levelBasisPercentage: number | null;
  /** Sum of totals matching levelBasisPercentage (for getMarksToNextLevel marks scale). */
  levelBasisTotalMarks: number | null;
}

function maxDateInGroup(attempts: PastPaperAttempt[]): string {
  if (attempts.length === 0) return "";
  return attempts.reduce((a, b) => (a.date >= b.date ? a : b)).date;
}

function maxPercentageInGroup(attempts: PastPaperAttempt[]): number {
  if (attempts.length === 0) return 0;
  return Math.max(...attempts.map((a) => a.percentage));
}

/**
 * Sort attempts for inner list: paper label, then date descending.
 */
export function sortAttemptsForDisplay(attempts: PastPaperAttempt[]): PastPaperAttempt[] {
  return [...attempts].sort((a, b) => {
    const c = a.paperLabel.localeCompare(b.paperLabel);
    if (c !== 0) return c;
    return b.date.localeCompare(a.date);
  });
}

/** Required papers that have no attempt in this group yet. */
export function getMissingRequiredPaperLabels(group: PastPaperGroupModel): string[] {
  return group.requiredPaperLabels.filter((label) => !group.bestByPaperLabel.has(label));
}

export function buildPastPaperGroupModel(
  attempts: PastPaperAttempt[],
  subjectsById: Record<string, Subject>,
  cutoffData: CutoffData
): PastPaperGroupModel {
  const first = attempts[0];
  const subject = subjectsById[first.subjectId];
  const jsonConfig = getSubjectWeightingFromJson(subject?.shortCode ?? "");

  const requiredPaperLabels = jsonConfig
    ? jsonConfig.papers.map((p) => p.label)
    : defaultPaperLabels(subject);
  const weights = jsonConfig
    ? weightsFromJsonConfig(jsonConfig)
    : normalizedPaperWeights(requiredPaperLabels, subject?.paperWeights);
  const bestByPaperLabel = jsonConfig
    ? bestAttemptPerFormalLabel(attempts, requiredPaperLabels)
    : bestAttemptPerLabel(attempts);

  const isComplete = requiredPaperLabels.every((label) => bestByPaperLabel.has(label));

  let weightedPercentage: number | null = null;
  let overallScoreSum: number | null = null;
  let overallTotalSum: number | null = null;
  let overallLevel: string | null = null;
  let levelBasisPercentage: number | null = null;
  let levelBasisTotalMarks: number | null = null;

  const isDse = first.isDse !== false;
  const subjectKey = subject?.shortCode ?? first.subjectId;
  const hasCutoff = hasSubjectCutoffData(cutoffData, subjectKey, first.examYear);

  if (isComplete) {
    let wSum = 0;
    let scoreSum = 0;
    let totalSum = 0;
    for (const label of requiredPaperLabels) {
      const best = bestByPaperLabel.get(label)!;
      const w = weights[label] ?? 1 / requiredPaperLabels.length;
      wSum += w * best.percentage;
      scoreSum += best.score;
      totalSum += best.total;
    }
    weightedPercentage = wSum;
    overallScoreSum = scoreSum;
    overallTotalSum = totalSum;
    levelBasisPercentage = weightedPercentage;
    levelBasisTotalMarks = totalSum;

    if (isDse && hasCutoff) {
      overallLevel = estimateDseLevel(subjectKey, weightedPercentage, cutoffData, first.examYear);
    }
  } else if (attempts.length > 0) {
    const presentRequired = requiredPaperLabels.filter((label) => bestByPaperLabel.has(label));
    let pctBasis: number;
    let totalBasis: number;

    if (presentRequired.length > 0) {
      let weightSumPresent = 0;
      for (const label of presentRequired) {
        weightSumPresent += weights[label] ?? 1 / requiredPaperLabels.length;
      }
      if (weightSumPresent <= 0) {
        weightSumPresent = presentRequired.length;
      }
      pctBasis = 0;
      totalBasis = 0;
      for (const label of presentRequired) {
        const best = bestByPaperLabel.get(label)!;
        const w = (weights[label] ?? 1 / requiredPaperLabels.length) / weightSumPresent;
        pctBasis += w * best.percentage;
        totalBasis += best.total;
      }
    } else {
      const bestOverall = attempts.reduce((a, b) => (a.percentage >= b.percentage ? a : b));
      pctBasis = bestOverall.percentage;
      totalBasis = bestOverall.total;
    }

    levelBasisPercentage = pctBasis;
    levelBasisTotalMarks = totalBasis;

    if (isDse && hasCutoff) {
      overallLevel = estimateDseLevel(subjectKey, pctBasis, cutoffData, first.examYear);
    } else {
      const bestOverall = attempts.reduce((a, b) => (a.percentage >= b.percentage ? a : b));
      overallLevel = bestOverall.estimatedLevel;
    }
  }

  return {
    key: pastPaperGroupKey(first),
    subjectId: first.subjectId,
    examYear: first.examYear,
    isDse: first.isDse !== false,
    subject,
    attempts: sortAttemptsForDisplay(attempts),
    requiredPaperLabels,
    bestByPaperLabel,
    isComplete,
    weightedPercentage,
    overallScoreSum,
    overallTotalSum,
    overallLevel,
    levelBasisPercentage,
    levelBasisTotalMarks,
  };
}

export function groupPastPaperAttempts(attempts: PastPaperAttempt[]): Map<string, PastPaperAttempt[]> {
  const map = new Map<string, PastPaperAttempt[]>();
  for (const a of attempts) {
    const k = pastPaperGroupKey(a);
    const list = map.get(k);
    if (list) list.push(a);
    else map.set(k, [a]);
  }
  return map;
}

function groupSortValue(
  model: PastPaperGroupModel,
  sortKey: PastPaperSortKey
): number | string {
  if (sortKey === "examYear") {
    return model.examYear;
  }
  if (sortKey === "date") {
    return maxDateInGroup(model.attempts);
  }
  if (model.weightedPercentage != null) {
    return model.weightedPercentage;
  }
  if (model.levelBasisPercentage != null) {
    return model.levelBasisPercentage;
  }
  return maxPercentageInGroup(model.attempts);
}

/**
 * Build sorted array of group models from flat attempts.
 */
export function buildSortedPastPaperGroups(
  attempts: PastPaperAttempt[],
  subjectsById: Record<string, Subject>,
  cutoffData: CutoffData,
  sortKey: PastPaperSortKey,
  sortDirection: "asc" | "desc"
): PastPaperGroupModel[] {
  const grouped = groupPastPaperAttempts(attempts);
  const models: PastPaperGroupModel[] = [];
  for (const [, groupAttempts] of grouped) {
    models.push(buildPastPaperGroupModel(groupAttempts, subjectsById, cutoffData));
  }

  const mult = sortDirection === "asc" ? 1 : -1;
  models.sort((a, b) => {
    const va = groupSortValue(a, sortKey);
    const vb = groupSortValue(b, sortKey);
    let primary = 0;
    if (typeof va === "string" && typeof vb === "string") {
      primary = va.localeCompare(vb);
    } else if (typeof va === "number" && typeof vb === "number") {
      primary = va === vb ? 0 : va < vb ? -1 : 1;
    }
    if (primary !== 0) return primary * mult;

    if (sortKey === "examYear") {
      const da = maxDateInGroup(a.attempts);
      const db = maxDateInGroup(b.attempts);
      const dateCmp = db.localeCompare(da);
      if (dateCmp !== 0) return dateCmp * mult;
    }

    if (a.examYear !== b.examYear) {
      return (a.examYear - b.examYear) * mult;
    }
    return a.subjectId.localeCompare(b.subjectId);
  });

  return models;
}
