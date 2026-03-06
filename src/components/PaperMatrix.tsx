import { useMemo } from "react";
import { Card } from "./ui/Card";
import type { PastPaperAttempt, Subject } from "../types";

interface PaperMatrixProps {
  subject: Subject;
  attempts: PastPaperAttempt[];
  availablePaperLabels: string[];
  cutoffData?: import("../types").CutoffData;
}

export function PaperMatrix({ subject, attempts, availablePaperLabels, cutoffData }: PaperMatrixProps) {
  const { matrix, minYear, maxYear, stats } = useMemo(() => {
    // Determine year range based on attempts
    const subjectAttempts = attempts.filter(a => a.subjectId === subject.id);
    
    let currentMaxYear = new Date().getFullYear();
    let currentMinYear = currentMaxYear - 10; // Default to last 10 years
    
    // Try to get years from cutoff data
    if (cutoffData && cutoffData[subject.shortCode]) {
      const subjectCutoffs = cutoffData[subject.shortCode];
      const cutoffYears = Object.keys(subjectCutoffs)
        .map(Number)
        .filter(y => !isNaN(y));
      
      if (cutoffYears.length > 0) {
        currentMaxYear = Math.max(...cutoffYears, currentMaxYear);
        currentMinYear = Math.min(...cutoffYears);
      }
    }
    
    if (subjectAttempts.length > 0) {
      const years = subjectAttempts.map(a => a.examYear);
      currentMaxYear = Math.max(currentMaxYear, ...years);
      currentMinYear = Math.min(currentMinYear, ...years);
    }
    
    // Create the matrix
    const grid: Record<number, Record<string, PastPaperAttempt[]>> = {};
    for (let year = currentMaxYear; year >= currentMinYear; year--) {
      grid[year] = {};
      for (const label of availablePaperLabels) {
        grid[year][label] = [];
      }
    }
    
    // Populate with attempts
    for (const attempt of subjectAttempts) {
      if (grid[attempt.examYear] && grid[attempt.examYear][attempt.paperLabel] !== undefined) {
        grid[attempt.examYear][attempt.paperLabel].push(attempt);
      }
    }
    
    // Calculate stats
    const totalSlots = (currentMaxYear - currentMinYear + 1) * availablePaperLabels.length;
    let completedSlots = 0;
    
    for (let year = currentMaxYear; year >= currentMinYear; year--) {
      for (const label of availablePaperLabels) {
        if (grid[year][label].length > 0) {
          completedSlots++;
        }
      }
    }
    
    const completionPercentage = totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : 0;
    
    return {
      matrix: grid,
      minYear: currentMinYear,
      maxYear: currentMaxYear,
      stats: { totalSlots, completedSlots, completionPercentage }
    };
  }, [attempts, subject, availablePaperLabels, cutoffData]);
  
  if (availablePaperLabels.length === 0) {
    return null;
  }
  
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);

  return (
    <Card variant="hairline" padding="md" className="animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-foreground tracking-tight">Paper Completion Grid</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.completedSlots} of {stats.totalSlots} papers completed ({stats.completionPercentage}%)
          </p>
        </div>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar pb-4">
        <table className="w-full text-left border-collapse min-w-[max-content]">
          <thead>
            <tr>
              <th className="p-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border-hairline sticky left-0 bg-surface/80 backdrop-blur-sm z-10 w-24">
                Paper
              </th>
              {years.map(year => (
                <th key={year} className="p-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border-hairline text-center whitespace-nowrap">
                  {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {availablePaperLabels.map(label => (
              <tr key={label} className="group hover:bg-muted/30 transition-colors">
                <td className="p-3 text-xs font-bold text-foreground border-b border-border-hairline sticky left-0 bg-surface/80 backdrop-blur-sm group-hover:bg-muted/30 transition-colors z-10 whitespace-nowrap">
                  {label}
                </td>
                {years.map(year => {
                  const cellAttempts = matrix[year][label];
                  const hasAttempt = cellAttempts.length > 0;
                  
                  // Get best attempt if multiple exist
                  const bestAttempt = hasAttempt 
                    ? [...cellAttempts].sort((a, b) => b.percentage - a.percentage)[0]
                    : null;
                  
                  return (
                    <td key={year} className="p-3 border-b border-border-hairline text-center">
                      <div className="flex items-center justify-center">
                        {hasAttempt && bestAttempt ? (
                          <div 
                            className="relative group/cell flex items-center justify-center w-7 h-7 rounded-full bg-success/20 text-success shadow-sm cursor-help transition-transform hover:scale-110"
                            title={`Best: ${Math.round(bestAttempt.percentage)}% (${bestAttempt.estimatedLevel}) - ${bestAttempt.date}`}
                          >
                            <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                            
                            {cellAttempts.length > 1 && (
                              <span className="absolute -top-1 -right-1 bg-surface text-foreground text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-border-hairline shadow-sm">
                                {cellAttempts.length}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full border border-dashed border-border-hairline/60 flex items-center justify-center text-muted-foreground/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20"></div>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
