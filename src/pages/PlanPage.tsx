import { useEffect, useMemo, useState } from "react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip 
} from "recharts";
import type { Subject, PlannerCell, CutoffData, PastPaperAttempt } from "../types";
import { getCurrentExamYear, getTimetableForYear } from "../constants";
import { 
  formatIsoDate, 
  isDateInWeek, 
  startOfWeekSunday, 
  addDays, 
  getWeekDays
} from "../utils/dateHelpers";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { listStudyGoals, upsertStudyGoal, type StudyGoal } from "../lib/api/goalsApi";
import { listPastPaperAttempts } from "../lib/api/pastPapersApi";

import { estimateDseLevel } from "../utils/dseLevelEstimator";

interface PlanPageProps {
  userId: string;
  subjects: Subject[];
  cells: PlannerCell[];
  cutoffData: CutoffData;
  usingGenericFallback: boolean;
}

export function PlanPage({ userId, subjects, cells, cutoffData }: PlanPageProps) {
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [attempts, setAttempts] = useState<PastPaperAttempt[]>([]);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [targetLevels, setTargetLevels] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(`plan-targets-${userId}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [loading, setLoading] = useState(true);
  const [draftGoals, setDraftGoals] = useState<Record<string, number>>({});

  const todayStr = useMemo(() => formatIsoDate(new Date()), []);
  const currentWeekStart = useMemo(() => startOfWeekSunday(new Date()), []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      listStudyGoals(userId),
      listPastPaperAttempts(userId)
    ]).then(([goalsData, attemptsData]) => {
      if (isMounted) {
        setGoals(goalsData);
        setAttempts(attemptsData);
        setLoading(false);
      }
    }).catch(err => {
      console.error("Failed to load plan data:", err);
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, [userId]);

  const handleSetTargetLevel = (subjectId: string, level: string) => {
    const next = { ...targetLevels, [subjectId]: level };
    setTargetLevels(next);
    localStorage.setItem(`plan-targets-${userId}`, JSON.stringify(next));
  };

  const handleUpdateGoal = async (subjectId: string, target: number) => {
    try {
      const updated = await upsertStudyGoal(userId, subjectId, target);
      setGoals(prev => {
        const idx = prev.findIndex(g => g.subjectId === subjectId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [...prev, updated];
      });
      return updated;
    } catch (err) {
      console.error("Failed to update goal:", err);
      throw err;
    }
  };

  const handleOpenGoalsModal = () => {
    const initialDraft: Record<string, number> = {};
    subjects.forEach(s => {
      const g = goals.find(goal => goal.subjectId === s.id);
      initialDraft[s.id] = g?.weeklyTarget || 0;
    });
    setDraftGoals(initialDraft);
    setIsGoalsModalOpen(true);
  };

  const handleSaveGoals = async () => {
    try {
      // Upsert each changed goal
      const updates = subjects.map(s => {
        const target = draftGoals[s.id] || 0;
        const currentGoal = goals.find(g => g.subjectId === s.id);
        if (currentGoal?.weeklyTarget === target) return null;
        return handleUpdateGoal(s.id, target);
      }).filter(Boolean);

      if (updates.length > 0) {
        await Promise.all(updates);
      }
      setIsGoalsModalOpen(false);
    } catch (err) {
      console.error("Failed to save goals:", err);
    }
  };

  // 1. Countdown Data
  const countdownData = useMemo(() => {
    const examYear = getCurrentExamYear();
    const timetable = getTimetableForYear(examYear);
    if (!timetable) return [];

    const today = new Date(`${todayStr}T00:00:00`);
    
    return subjects.map(subject => {
      const subjectExams = timetable
        .filter(e => e.subjectCode === subject.shortCode)
        .map(e => {
          const parsedDate = new Date(`${e.date}T00:00:00`);
          const diffTime = parsedDate.getTime() - today.getTime();
          const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return { ...e, daysRemaining, parsedDate };
        })
        .filter(e => e.daysRemaining >= 0)
        .sort((a, b) => a.daysRemaining - b.daysRemaining);

      return {
        subject,
        nextPaper: subjectExams[0] || null
      };
    }).sort((a, b) => {
      if (!a.nextPaper) return 1;
      if (!b.nextPaper) return -1;
      return a.nextPaper.daysRemaining - b.nextPaper.daysRemaining;
    });
  }, [subjects, todayStr]);

  const timeBudget = useMemo(() => {
    if (subjects.length === 0) return null;
    const earliestExam = countdownData.find(c => c.nextPaper !== null)?.nextPaper?.daysRemaining;
    if (earliestExam === undefined) return null;
    return {
      daysPerSubject: (earliestExam / subjects.length).toFixed(1),
      totalDays: earliestExam,
      subjectCount: subjects.length
    };
  }, [countdownData, subjects.length]);

  // 2. Weekly Progress
  const weeklyProgress = useMemo(() => {
    const thisWeekCells = cells.filter(c => isDateInWeek(c.date, currentWeekStart) && c.task && !c.task.isRest);
    
    return subjects.map(subject => {
      const done = thisWeekCells.filter(c => c.task?.subjectId === subject.id).length;
      const target = goals.find(g => g.subjectId === subject.id)?.weeklyTarget || 0;
      return { subject, done, target };
    });
  }, [subjects, cells, goals, currentWeekStart]);

  // 3. Subject Balance (Last 4 Weeks)
  const balanceData = useMemo(() => {
    const fourWeeksAgo = addDays(currentWeekStart, -21); // Approx 4 weeks including this week
    const last28DaysCells = cells.filter(c => {
      const d = c.date;
      return d >= formatIsoDate(fourWeeksAgo) && d <= todayStr && c.task && !c.task.isRest;
    });

    const total = last28DaysCells.length;
    if (total === 0) return subjects.map(s => ({ subject: s, count: 0, percentage: 0 }));

    return subjects.map(subject => {
      const count = last28DaysCells.filter(c => c.task?.subjectId === subject.id).length;
      return { subject, count, percentage: (count / total) * 100 };
    });
  }, [subjects, cells, todayStr, currentWeekStart]);

  // 4. Readiness Status
  const readinessData = useMemo(() => {
    return subjects.map(subject => {
      const subjectAttempts = attempts.filter(a => a.subjectId === subject.id);
      
      // Calculate average percentage and derive current level from current cutoffs
      const avgPercentage = subjectAttempts.length > 0 
        ? subjectAttempts.reduce((acc, a) => acc + a.percentage, 0) / subjectAttempts.length
        : null;
      
      const currentLevel = avgPercentage !== null 
        ? estimateDseLevel(subject.shortCode, avgPercentage, cutoffData)
        : "N/A";

      const targetLevel = targetLevels[subject.id] || "4";
      const daysUntilExam = countdownData.find(c => c.subject.id === subject.id)?.nextPaper?.daysRemaining ?? null;

      // Group attempts by label
      const labelCounts: Record<string, number> = {};
      subjectAttempts.forEach(a => {
        labelCounts[a.paperLabel] = (labelCounts[a.paperLabel] || 0) + 1;
      });

      // Status logic: 
      // green if current >= target
      // amber if within 1 level
      // red if 2+ levels below
      const levels: string[] = ["U", "1", "2", "3", "4", "5", "5*", "5**"];
      const currentIdx = levels.indexOf(currentLevel);
      const targetIdx = levels.indexOf(targetLevel);
      
      let status: "green" | "amber" | "red" = "amber";
      if (currentIdx >= targetIdx && currentIdx !== -1) status = "green";
      else if (targetIdx !== -1 && currentIdx !== -1 && targetIdx - currentIdx >= 2) status = "red";
      else if (currentIdx === -1 && subjectAttempts.length > 0) status = "red"; // Unrecognized level is poor
      else if (subjectAttempts.length === 0) status = "amber"; // No data is neutral

      return {
        subject,
        currentLevel,
        avgPercentage,
        targetLevel,
        labelCounts,
        attemptsCount: subjectAttempts.length,
        daysUntilExam,
        status
      };
    });
  }, [subjects, attempts, targetLevels, countdownData, cutoffData]);

  // 5. Priority Queue
  const priorityQueue = useMemo(() => {
    const items: { type: "goal" | "paper" | "plan"; text: string; subject: Subject; urgency: number }[] = [];

    subjects.forEach(subject => {
      const daysUntil = countdownData.find(c => c.subject.id === subject.id)?.nextPaper?.daysRemaining ?? 999;
      
      // Goal check
      const progress = weeklyProgress.find(p => p.subject.id === subject.id);
      if (progress && progress.target > 0 && progress.done < progress.target) {
        items.push({
          type: "goal",
          text: `${progress.target - progress.done} more sessions needed to hit your weekly goal`,
          subject,
          urgency: daysUntil
        });
      }

      // Past paper check (no attempt in 14 days and exam within 21 days)
      const lastAttempt = attempts
        .filter(a => a.subjectId === subject.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      const daysSinceLastPaper = lastAttempt 
        ? Math.ceil((new Date().getTime() - new Date(lastAttempt.date).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      if (daysSinceLastPaper > 14 && daysUntil < 21) {
        items.push({
          type: "paper",
          text: `Time to do a past paper. Last one was ${lastAttempt ? daysSinceLastPaper + ' days ago' : 'never'}.`,
          subject,
          urgency: daysUntil
        });
      }

      // Planning check (0 sessions in next 7 days while exam within 14 days)
      const next7Days = Array.from({ length: 7 }, (_, i) => formatIsoDate(addDays(new Date(), i + 1)));
      const plannedNext7 = cells.filter(c => next7Days.includes(c.date) && c.task?.subjectId === subject.id).length;
      
      if (plannedNext7 === 0 && daysUntil < 14) {
        items.push({
          type: "plan",
          text: `Nothing planned for next week despite your exam in ${daysUntil} days.`,
          subject,
          urgency: daysUntil
        });
      }
    });

    return items.sort((a, b) => a.urgency - b.urgency);
  }, [subjects, countdownData, weeklyProgress, attempts, cells]);

  // 6. Study Rhythm
  const rhythmData = useMemo(() => {
    const weeks = [
      addDays(currentWeekStart, -21),
      addDays(currentWeekStart, -14),
      addDays(currentWeekStart, -7),
      currentWeekStart
    ];

    const grid = weeks.map(weekStart => {
      const days = getWeekDays(weekStart);
      return days.map(day => {
        const iso = formatIsoDate(day);
        const dayCells = cells.filter(c => c.date === iso && c.task && !c.task.isRest);
        return {
          iso,
          intensity: Math.min(dayCells.length, 4) // cap at 4 for shading
        };
      });
    });

    const sessionsPerWeek = weeks.map(weekStart => {
      return cells.filter(c => isDateInWeek(c.date, weekStart) && c.task && !c.task.isRest).length;
    });

    const avg = sessionsPerWeek.reduce((a, b) => a + b, 0) / 4;
    const best = Math.max(...sessionsPerWeek);
    const last = sessionsPerWeek[3];

    return { grid, stats: { avg, best, last } };
  }, [cells, currentWeekStart]);

  const DonutTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface/95 backdrop-blur-md p-3 rounded-2xl shadow-zen border border-border-hairline">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
            <span className="font-bold text-sm tracking-tight">{data.name}</span>
          </div>
          <div className="flex gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-black">Sessions</p>
              <p className="font-light text-lg">{data.value}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-black">Share</p>
              <p className="font-bold text-lg">{data.percentage.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading your study plan...</div>;
  }

  return (
    <div className="space-y-12 pt-6 lg:pt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <header>
        <h1 className="text-3xl font-light tracking-tighter">Strategic Plan (Beta)</h1>
        <p className="text-sm text-muted-foreground mt-1">Step back and see the big picture</p>
      </header>

      {/* 1. Time Budget */}
      <section>
        <Card className="p-8 flex flex-col items-center text-center bg-primary/5 border-primary/10">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Study Days per Subject
          </span>
          <div className="flex items-baseline gap-3">
            <span className="text-7xl font-light tracking-tighter text-primary">
              {timeBudget ? timeBudget.daysPerSubject : "—"}
            </span>
            <span className="text-2xl font-medium text-muted-foreground tracking-tight opacity-40">Days</span>
          </div>
          <div className="flex items-center gap-3 mt-4 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">
            <span>{timeBudget?.totalDays ?? "—"} Total Days</span>
            <span className="w-1 h-1 rounded-full bg-border-hairline" />
            <span>{timeBudget?.subjectCount ?? subjects.length} Subjects</span>
          </div>
        </Card>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 2. Weekly Goals */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Weekly Progress</h2>
            <Button variant="outline" size="sm" onClick={handleOpenGoalsModal}>
              Set Goals
            </Button>
          </div>
          <Card className="p-6 space-y-6">
            {weeklyProgress.every(p => p.target === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Set weekly session targets to track your progress here.
              </p>
            ) : (
              weeklyProgress.filter(p => p.target > 0).map(({ subject, done, target }) => (
                <div key={subject.id} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span style={{ color: subject.baseColor }}>{subject.name}</span>
                    <span className="text-muted-foreground">{done} / {target}</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min((done / target) * 100, 100)}%`,
                        backgroundColor: subject.baseColor
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </Card>
        </section>

        {/* 3. Subject Balance */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight">Distribution</h2>
          <Card className="p-6 h-[340px] flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full h-[180px] sm:h-full sm:w-1/2 relative">
              {balanceData.every(d => d.count === 0) ? (
                <div className="absolute inset-0 flex items-center justify-center text-center">
                  <p className="text-sm text-muted-foreground max-w-[120px]">
                    No study sessions in the last 4 weeks.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={balanceData.map(d => ({
                        name: d.subject.name,
                        value: d.count,
                        color: d.subject.baseColor,
                        percentage: d.percentage
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {balanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.subject.baseColor} className="hover:opacity-80 transition-opacity cursor-pointer" />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<DonutTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {/* Center count display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-light tracking-tighter">
                  {balanceData.reduce((acc, d) => acc + d.count, 0)}
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Total</span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-2.5 overflow-y-auto custom-scrollbar pr-1 max-h-[220px]">
              {balanceData.map(({ subject, percentage, count }) => (
                <div key={subject.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subject.baseColor }} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                      {subject.shortCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {Math.round(percentage)}%
                    </span>
                    {count === 0 && (
                      <Badge variant="warning" className="text-[8px] px-1.5 py-0">Neglected</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>

      {/* 4. Readiness Status */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight">Preparedness</h2>
        <Card className="overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Average Level</th>
                <th className="px-6 py-4">Target Level</th>
                <th className="px-6 py-4">Papers Done</th>
                <th className="px-6 py-4">Exam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-hairline">
              {readinessData.map((row) => (
                <tr 
                  key={row.subject.id} 
                  className={`transition-colors ${
                    row.status === 'green' ? 'bg-success/5' : 
                    row.status === 'red' ? 'bg-dot-red/5' : ''
                  }`}
                >
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: row.subject.baseColor }} />
                    <span className="font-bold text-sm">{row.subject.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <Badge variant={row.status === 'green' ? 'success' : row.status === 'red' ? 'warning' : 'outline'} className="w-fit">
                        {row.currentLevel}
                      </Badge>
                      {row.avgPercentage !== null && (
                        <span className="text-[10px] text-muted-foreground mt-1 font-mono uppercase tracking-widest opacity-60">
                          Avg: {row.avgPercentage.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={row.targetLevel}
                      onChange={(e) => handleSetTargetLevel(row.subject.id, e.target.value)}
                      className="bg-transparent text-sm font-bold focus:outline-none cursor-pointer border-b border-dashed border-muted-foreground/30"
                    >
                      {["5**", "5*", "5", "4", "3", "2", "1"].reverse().map(l => (
                        <option key={l} value={l} className="bg-surface">{l}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(row.labelCounts).length > 0 ? (
                        Object.entries(row.labelCounts).map(([label, count]) => (
                          <div key={label} className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted font-bold text-muted-foreground flex items-center gap-1 border border-border-hairline/50">
                            <span className="opacity-60">{label.replace('Paper ', 'P')}</span>
                            <span className="text-primary">{count}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">None</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm">
                    {row.daysUntilExam !== null ? (
                      <span className={row.daysUntilExam < 7 ? "text-dot-red font-bold" : "text-muted-foreground"}>
                        D-{row.daysUntilExam}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/30">Done</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      {/* 5. Priority Queue */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight">Action Plan</h2>
        {priorityQueue.length === 0 ? (
          <div className="p-10 text-center glass-card rounded-3xl border border-success/20 bg-success/5 flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl text-success">check_circle</span>
            <p className="font-bold text-success">You are all caught up!</p>
            <p className="text-sm text-success/60">Everything is on track with your study plan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {priorityQueue.map((item, i) => {
              const typeConfig = {
                goal: {
                  icon: 'flag',
                  label: 'Weekly Goal',
                  bg: 'bg-dot-yellow/8',
                  border: 'border-dot-yellow/20',
                  labelColor: 'text-amber-600',
                },
                paper: {
                  icon: 'history_edu',
                  label: 'Past Paper Due',
                  bg: 'bg-dot-blue/8',
                  border: 'border-dot-blue/20',
                  labelColor: 'text-blue-500',
                },
                plan: {
                  icon: 'calendar_month',
                  label: 'Schedule Gap',
                  bg: 'bg-dot-red/8',
                  border: 'border-dot-red/20',
                  labelColor: 'text-dot-red',
                },
              }[item.type];

              return (
                <div
                  key={i}
                  className={`rounded-3xl border p-5 flex flex-col gap-4 ${typeConfig.bg} ${typeConfig.border} animate-in slide-in-from-bottom-2 duration-500`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${item.subject.baseColor}20`, color: item.subject.baseColor }}
                      >
                        <span className="material-symbols-outlined text-[18px]">{typeConfig.icon}</span>
                      </div>
                      <div>
                        <p className={`text-[9px] font-black uppercase tracking-[0.15em] ${typeConfig.labelColor}`}>
                          {typeConfig.label}
                        </p>
                        <p className="text-sm font-bold tracking-tight" style={{ color: item.subject.baseColor }}>
                          {item.subject.name}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                        {item.urgency < 999 ? `${item.urgency}d` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Action Text */}
                  <p className="text-sm text-foreground/80 leading-relaxed">{item.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 6. Study Rhythm */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight">Consistency</h2>
        <Card className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="grid grid-rows-4 grid-flow-col gap-1.5">
              {rhythmData.grid.map((week, wIdx) => 
                week.map((day, dIdx) => (
                  <div 
                    key={`${wIdx}-${dIdx}`}
                    className={`w-4 h-4 rounded-sm transition-colors duration-500 ${
                      day.intensity === 0 ? 'bg-muted' : 
                      day.intensity === 1 ? 'bg-primary/20' :
                      day.intensity === 2 ? 'bg-primary/40' :
                      day.intensity === 3 ? 'bg-primary/60' : 'bg-primary'
                    }`}
                    title={`${day.iso}: ${day.intensity} sessions`}
                  />
                ))
              )}
            </div>
            
            <div className="flex-1 grid grid-cols-3 gap-8 w-full">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Avg sessions</p>
                <p className="text-2xl font-light tracking-tighter">{rhythmData.stats.avg.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Best week</p>
                <p className="text-2xl font-light tracking-tighter">{rhythmData.stats.best}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Last week</p>
                <p className="text-2xl font-light tracking-tighter">{rhythmData.stats.last}</p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Goals Modal */}
      <Modal 
        isOpen={isGoalsModalOpen} 
        onClose={() => setIsGoalsModalOpen(false)}
        title="Set Weekly Study Goals"
      >
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            How many study sessions per week are you aiming for in each subject?
          </p>
          <div className="space-y-4">
            {subjects.map(subject => {
              const val = draftGoals[subject.id] ?? 0;
              return (
                <div key={subject.id} className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.baseColor }} />
                    <span className="font-bold text-sm">{subject.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input 
                      type="number" 
                      className="w-20 h-9 text-center"
                      value={val}
                      min={0}
                      max={28}
                      onChange={(e) => setDraftGoals(prev => ({ ...prev, [subject.id]: parseInt(e.target.value) || 0 }))}
                    />
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Sessions</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-4">
            <Button className="w-full" onClick={handleSaveGoals}>
              Save Goals
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
