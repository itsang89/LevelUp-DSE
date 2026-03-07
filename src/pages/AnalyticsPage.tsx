import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import type { PastPaperAttempt, Subject, CutoffData } from "../types";
import { listPastPaperAttempts } from "../lib/api/pastPapersApi";
import { Card } from "../components/ui/Card";

interface AnalyticsPageProps {
  userId: string;
  subjects: Subject[];
  cutoffData: CutoffData;
  usingGenericFallback: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-surface/90 backdrop-blur-md p-4 rounded-2xl shadow-zen border border-border-hairline">
        <p className="text-xs font-black uppercase text-muted-foreground mb-2">
          {data.displayDate}
        </p>
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <span className="font-bold">{data.subjectCode}</span>
          <span className="text-muted-foreground text-sm">
            {data.paperLabel}
          </span>
        </div>
        <div className="flex gap-4 mt-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</p>
            <p className="font-light text-lg">{data.percentage.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Level</p>
            <p className="font-bold text-lg">{data.estimatedLevel}</p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function AnalyticsPage({
  userId,
  subjects,
  usingGenericFallback,
}: AnalyticsPageProps) {
  const [attempts, setAttempts] = useState<PastPaperAttempt[]>([]);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [xAxisMode, setXAxisMode] = useState<"date" | "year">("date");
  const [yAxisMode, setYAxisMode] = useState<"percentage" | "level">("percentage");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    listPastPaperAttempts(userId)
      .then((rows) => {
        if (isMounted) {
          setAttempts(rows);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load data");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const subjectsById = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, s])),
    [subjects]
  );

  const filteredAttempts = useMemo(() => {
    const list =
      subjectFilter === "all"
        ? attempts
        : attempts.filter((a) => a.subjectId === subjectFilter);
    return [...list].sort((a, b) => {
      if (xAxisMode === "year" && a.examYear !== b.examYear) {
        return a.examYear - b.examYear;
      }
      return a.date.localeCompare(b.date);
    });
  }, [attempts, subjectFilter, xAxisMode]);

  // Derived Stats
  const stats = useMemo(() => {
    if (filteredAttempts.length === 0) {
      return { total: 0, avg: 0, bestLevel: "-", topSubject: "-" };
    }

    const total = filteredAttempts.length;
    const avg =
      filteredAttempts.reduce((acc, a) => acc + a.percentage, 0) / total;

    // Find best level
    const levelRank = { "5**": 7, "5*": 6, "5": 5, "4": 4, "3": 3, "2": 2, "1": 1, U: 0 };
    let best = "U";
    for (const a of filteredAttempts) {
      if (
        (levelRank[a.estimatedLevel as keyof typeof levelRank] || 0) >
        (levelRank[best as keyof typeof levelRank] || 0)
      ) {
        best = a.estimatedLevel;
      }
    }

    // Most practiced subject
    const subjectCounts: Record<string, number> = {};
    let topSubjId = filteredAttempts[0].subjectId;
    let maxCount = 0;
    for (const a of filteredAttempts) {
      subjectCounts[a.subjectId] = (subjectCounts[a.subjectId] || 0) + 1;
      if (subjectCounts[a.subjectId] > maxCount) {
        maxCount = subjectCounts[a.subjectId];
        topSubjId = a.subjectId;
      }
    }

    const topSubjectName = subjectsById[topSubjId]?.shortCode || "Unknown";

    return { total, avg, bestLevel: best, topSubject: `${topSubjectName} (${maxCount})` };
  }, [filteredAttempts, subjectsById]);

  // Chart Data preparation
  const chartData = useMemo(() => {
    const levelRank = { "5**": 7, "5*": 6, "5": 5, "4": 4, "3": 3, "2": 2, "1": 1, U: 0 };
    return filteredAttempts.map((a) => {
      return {
        ...a,
        displayDate: new Date(a.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        displayYear: a.examYear.toString(),
        levelValue: levelRank[a.estimatedLevel as keyof typeof levelRank] || 0,
        subjectCode: subjectsById[a.subjectId]?.shortCode || "Unknown",
        color: subjectsById[a.subjectId]?.baseColor || "#8884d8",
      };
    });
  }, [filteredAttempts, subjectsById]);

  // Grade Distribution Data
  const gradeDistribution = useMemo(() => {
    const counts = { "5**": 0, "5*": 0, "5": 0, "4": 0, "3": 0, "2": 0, "1": 0, U: 0 };
    for (const a of filteredAttempts) {
      if (a.estimatedLevel in counts) {
        counts[a.estimatedLevel as keyof typeof counts]++;
      }
    }
    return Object.entries(counts)
      .filter((entry) => entry[1] > 0)
      .map(([level, count]) => ({ level, count }));
  }, [filteredAttempts]);

  // Separate attempts by subject for multi-line chart when "All" is selected
  const linesData = useMemo(() => {
    if (subjectFilter !== "all") {
      return [{ id: subjectFilter, data: chartData }];
    }
    const grouped: Record<string, typeof chartData> = {};
    for (const d of chartData) {
      if (!grouped[d.subjectId]) grouped[d.subjectId] = [];
      grouped[d.subjectId].push(d);
    }
    return Object.entries(grouped).map(([id, data]) => ({ id, data }));
  }, [chartData, subjectFilter]);

  return (
    <section className="space-y-4 pt-6 lg:pt-12 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-end gap-6 sticky top-0 bg-background/80 backdrop-blur-md py-4 z-30 border-b border-border-hairline -mx-6 px-6 lg:-mx-12 lg:px-12 transition-all duration-300">
        <div>
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1 opacity-50 block">
            Performance
          </span>
          <h1 className="text-3xl font-light text-primary tracking-tight">
            Score Insights
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse flex flex-col gap-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-3xl" />
            ))}
          </div>
          <div className="h-[400px] bg-muted rounded-3xl" />
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-600 rounded-3xl">
          Failed to load analytics: {error}
        </div>
      ) : (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Subject Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSubjectFilter("all")}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                subjectFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-surface text-muted-foreground border border-border-hairline hover:bg-muted/50"
              }`}
            >
              All Subjects
            </button>
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setSubjectFilter(subject.id)}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
                  subjectFilter === subject.id
                    ? "bg-primary text-primary-foreground shadow-soft"
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

          {filteredAttempts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-border-hairline rounded-[2.5rem] bg-surface/30">
              <span className="material-symbols-outlined text-4xl text-muted-foreground/30 mb-4">
                monitoring
              </span>
              <h3 className="text-lg font-medium text-primary mb-1">
                No data available
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                Log some past paper attempts to see your progress charts.
              </p>
            </div>
          ) : (
            <>
              {usingGenericFallback && (
                <div className="flex items-center gap-2 p-4 rounded-zen bg-amber-50/50 border border-amber-100/50 text-xs font-medium text-amber-700">
                  <span className="material-symbols-outlined text-lg opacity-60">info</span>
                  Using generic cutoffs. Grade distribution may be inaccurate.
                </div>
              )}

              {/* Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <Card variant="hairline" padding="md" className="flex flex-col">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 mb-2">
                    Attempts
                  </span>
                  <span className="text-4xl font-light tabular-nums">
                    {stats.total}
                  </span>
                </Card>
                <Card variant="hairline" padding="md" className="flex flex-col">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 mb-2">
                    Avg Score
                  </span>
                  <span
                    className={`text-4xl font-light tabular-nums ${
                      stats.avg >= 70 ? "text-success" : ""
                    }`}
                  >
                    {stats.avg.toFixed(1)}%
                  </span>
                </Card>
                <Card variant="hairline" padding="md" className="flex flex-col">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 mb-2">
                    Best Level
                  </span>
                  <span className="text-4xl font-bold">{stats.bestLevel}</span>
                </Card>
                <Card variant="hairline" padding="md" className="flex flex-col">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 mb-2">
                    Top Subject
                  </span>
                  <span className="text-xl font-medium mt-auto pb-1">
                    {stats.topSubject}
                  </span>
                </Card>
              </div>

              {/* Line Chart */}
              <Card variant="zen" padding="lg" className="space-y-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h4 className="text-lg font-medium">Score Trends</h4>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Measure</span>
                      <div className="flex p-0.5 bg-surface border border-border-hairline rounded-full w-fit">
                        <button
                          onClick={() => setYAxisMode("percentage")}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                            yAxisMode === "percentage" 
                              ? "bg-muted text-foreground shadow-sm" 
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Percentage
                        </button>
                        <button
                          onClick={() => setYAxisMode("level")}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                            yAxisMode === "level" 
                              ? "bg-muted text-foreground shadow-sm" 
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Grade
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Trend By</span>
                      <div className="flex p-0.5 bg-surface border border-border-hairline rounded-full w-fit">
                        <button
                          onClick={() => setXAxisMode("date")}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                            xAxisMode === "date" 
                              ? "bg-muted text-foreground shadow-sm" 
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Study Date
                        </button>
                        <button
                          onClick={() => setXAxisMode("year")}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                            xAxisMode === "year" 
                              ? "bg-muted text-foreground shadow-sm" 
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Paper Year
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-[350px] w-full -ml-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey={xAxisMode === "date" ? "displayDate" : "displayYear"}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                        dy={10}
                        allowDuplicatedCategory={xAxisMode === "date" ? false : true}
                        type="category"
                      />
                      <YAxis
                        domain={yAxisMode === "percentage" ? [0, 100] : [0, 7]}
                        axisLine={false}
                        tickLine={false}
                        tickCount={yAxisMode === "percentage" ? undefined : 8}
                        tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                        tickFormatter={
                          yAxisMode === "percentage" 
                            ? (val) => `${val}%` 
                            : (val) => ["U", "1", "2", "3", "4", "5", "5*", "5**"][Math.round(val)] || ""
                        }
                      />
                      <Tooltip content={<CustomTooltip />} />
                      {subjectFilter !== "all" ? (
                        <Line
                          data={chartData}
                          type="monotone"
                          dataKey={yAxisMode === "percentage" ? "percentage" : "levelValue"}
                          stroke={subjectsById[subjectFilter]?.baseColor || "#111111"}
                          strokeWidth={3}
                          dot={{ r: 4, strokeWidth: 2 }}
                          activeDot={{ r: 6 }}
                        />
                      ) : (
                        linesData.map((series) => (
                          <Line
                            key={series.id}
                            data={series.data}
                            type="monotone"
                            dataKey={yAxisMode === "percentage" ? "percentage" : "levelValue"}
                            name={subjectsById[series.id]?.shortCode}
                            stroke={subjectsById[series.id]?.baseColor || "#111111"}
                            strokeWidth={2}
                            dot={{ r: 3, strokeWidth: 1 }}
                            activeDot={{ r: 5 }}
                          />
                        ))
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Grade Distribution */}
              <Card variant="hairline" padding="lg" className="space-y-8">
                <h4 className="text-lg font-medium">Level Distribution</h4>
                <div className="h-[250px] w-full -ml-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeDistribution} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="level"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fontWeight: "bold" }}
                        dy={10}
                      />
                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                      />
                      <Tooltip
                        cursor={{ fill: "var(--color-muted)", opacity: 0.5 }}
                        contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "var(--shadow-soft)" }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {gradeDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.level.includes("5")
                                ? "var(--color-success)"
                                : entry.level === "U" || entry.level === "1"
                                ? "var(--color-dot-red)"
                                : "var(--color-primary)"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

    </section>
  );
}
