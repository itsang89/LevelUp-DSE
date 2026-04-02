import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PLANNER_SESSIONS } from "../constants";

type FeatureId = "planner" | "past-papers" | "estimator" | "analytics";

interface FeatureCard {
  id: FeatureId;
  icon: string;
  title: string;
  description: string;
  accentClass: string;
}

const featureCards: FeatureCard[] = [
  {
    id: "planner",
    icon: "calendar_month",
    title: "Weekly Planner",
    description: "Plan each study block by subject, topic, and priority.",
    accentClass: "text-dot-blue",
  },
  {
    id: "past-papers",
    icon: "task_alt",
    title: "Past Papers",
    description: "Track attempts, scores, and weak areas with clear history.",
    accentClass: "text-dot-green",
  },
  {
    id: "estimator",
    icon: "insights",
    title: "Level Estimator",
    description: "Estimate likely DSE levels using weighted paper logic.",
    accentClass: "text-dot-purple",
  },
  {
    id: "analytics",
    icon: "bar_chart",
    title: "Progress Analytics",
    description: "See trends over time and focus on the biggest gains first.",
    accentClass: "text-dot-yellow",
  },
];

function FeaturePreview({ id }: { id: FeatureId }) {
  if (id === "planner") {
    return (
      <div className="pointer-events-none select-none" aria-hidden="true">
        <div className="rounded-xl border border-border-hairline bg-background/70 overflow-hidden">
          <div className="h-8 px-3 border-b border-border-hairline flex items-center justify-between bg-background/80">
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/80">
              Weekly Planner
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-primary">
              Apr 7 - Apr 13
            </span>
          </div>
          <div className="p-2.5">
            <div className="grid grid-cols-[68px_repeat(7,1fr)] gap-1.5 text-[8px] font-black uppercase tracking-wider">
              <div className="text-muted-foreground/55 flex items-center justify-center">Time</div>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-muted-foreground/55 text-center">
                  {day}
                </div>
              ))}
              {[
                ["Session 1", "MATH", "", "CHEM", "BIO", "", "M2", ""],
                ["Session 2", "", "HIST", "MATH", "", "ENG", "", ""],
                ["Session 3", "CHEM", "", "", "MATH", "BIO", "", ""],
              ].map((row) => (
                <div key={row[0]} className="contents">
                  <div className="h-8 rounded-md bg-surface/65 border border-border-hairline text-[8px] font-black tracking-[0.12em] text-primary flex items-center justify-center px-1 text-center">
                    {row[0]}
                  </div>
                  {row.slice(1).map((cell, index) => {
                    const colorClass =
                      cell === "MATH"
                        ? "bg-dot-blue/30"
                        : cell === "CHEM"
                          ? "bg-dot-purple/30"
                          : cell === "BIO"
                            ? "bg-dot-green/30"
                            : cell === "ENG"
                              ? "bg-dot-yellow/30"
                              : cell === "HIST"
                                ? "bg-dot-red/25"
                                : "bg-background/75";
                    return (
                      <div
                        key={`${row[0]}-${index}`}
                        className={`h-8 rounded-md border border-border-hairline/70 px-1.5 flex items-center ${colorClass}`}
                      >
                        <span className="text-[8px] font-black tracking-[0.1em] text-primary/85 truncate">
                          {cell || "Add"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (id === "past-papers") {
    return (
      <div className="pointer-events-none select-none" aria-hidden="true">
        <div className="rounded-xl border border-border-hairline bg-background/70 overflow-hidden">
          <div className="h-8 px-3 border-b border-border-hairline flex items-center justify-between bg-background/80">
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/80">
              Attempt History
            </span>
            <div className="flex items-center gap-1">
              <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-surface/70 border border-border-hairline text-muted-foreground">
                MATH
              </span>
              <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-surface/70 border border-border-hairline text-muted-foreground">
                2025
              </span>
            </div>
          </div>
          <div className="px-3 py-2.5 space-y-2">
            <div className="rounded-xl border border-border-hairline bg-surface/60 px-2.5 py-2 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.14em] text-muted-foreground/55">Subject Group</p>
                  <p className="text-[10px] font-black tracking-[0.12em] text-primary">MATH 2025 DSE</p>
                </div>
                <span className="px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-wider bg-dot-green/15 text-dot-green">
                  Complete
                </span>
              </div>
              <div className="grid grid-cols-[1.2fr_0.7fr_0.6fr_0.7fr] text-[8px] font-black uppercase tracking-[0.14em] text-muted-foreground/60 px-0.5">
                <span>Paper</span>
                <span className="text-right">Score</span>
                <span className="text-right">%</span>
                <span className="text-right">Level</span>
              </div>
              {[
                { paper: "Paper 1", score: "62/80", pct: "77.5", level: "5" },
                { paper: "Paper 2", score: "47/60", pct: "78.3", level: "5*" },
              ].map((row) => (
                <div
                  key={row.paper}
                  className="h-8 rounded-lg border border-border-hairline/80 bg-background/70 px-2.5 grid grid-cols-[1.2fr_0.7fr_0.6fr_0.7fr] items-center"
                >
                  <span className="text-[9px] font-black text-primary tracking-[0.1em]">{row.paper}</span>
                  <span className="text-[9px] font-black text-right text-muted-foreground">{row.score}</span>
                  <span className="text-[9px] font-black text-right text-dot-green">{row.pct}</span>
                  <span className="text-[9px] font-black text-right text-primary">{row.level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (id === "estimator") {
    return (
      <div className="pointer-events-none select-none" aria-hidden="true">
        <div className="rounded-xl border border-border-hairline bg-background/70 overflow-hidden">
          <div className="h-8 px-3 border-b border-border-hairline flex items-center justify-between bg-background/80">
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/80">
              Plan Beta
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-dot-purple">
              Goals + Targets
            </span>
          </div>
          <div className="p-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border-hairline bg-surface/60 p-2.5">
                <p className="text-[8px] font-black uppercase tracking-wider text-muted-foreground/70">Weekly Target</p>
                <p className="text-base font-black text-primary">18 Sessions</p>
              </div>
              <div className="rounded-lg border border-border-hairline bg-surface/60 p-2.5">
                <p className="text-[8px] font-black uppercase tracking-wider text-muted-foreground/70">Completed</p>
                <p className="text-base font-black text-dot-green">11 Sessions</p>
              </div>
            </div>
            <div className="rounded-lg border border-border-hairline bg-surface/60 p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[8px] font-black uppercase tracking-wider text-muted-foreground/70">MATH Progress</p>
                <p className="text-[9px] font-black text-primary">7 / 10</p>
              </div>
              <div className="h-2.5 rounded-full bg-background/75 border border-border-hairline overflow-hidden">
                <div className="h-full w-[70%] bg-dot-blue/70" />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[8px] font-black uppercase tracking-wider text-muted-foreground/70">Target Level</p>
                <p className="text-[10px] font-black text-dot-purple">5* (+0.4)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none select-none" aria-hidden="true">
      <div className="rounded-xl border border-border-hairline bg-background/70 overflow-hidden">
        <div className="h-8 px-3 border-b border-border-hairline flex items-center justify-between bg-background/80">
          <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/80">
            Score Insights
          </span>
          <div className="flex items-center gap-1">
            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-surface/70 border border-border-hairline text-muted-foreground">
              All Subjects
            </span>
            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-surface/70 border border-border-hairline text-muted-foreground">
              Level
            </span>
          </div>
        </div>
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-lg border border-border-hairline bg-surface/60 p-2.5">
              <p className="text-[8px] font-black uppercase tracking-wider text-muted-foreground/70">Attempts</p>
              <p className="text-base font-black text-primary">26</p>
            </div>
            <div className="rounded-lg border border-border-hairline bg-surface/60 p-2.5">
              <p className="text-[8px] font-black uppercase tracking-wider text-muted-foreground/70">Avg %</p>
              <p className="text-base font-black text-primary">72.4</p>
            </div>
            <div className="rounded-lg border border-border-hairline bg-surface/60 p-2.5">
              <p className="text-[8px] font-black uppercase tracking-wider text-muted-foreground/70">Best</p>
              <p className="text-base font-black text-dot-green">5*</p>
            </div>
          </div>
          <div className="rounded-lg border border-border-hairline bg-surface/60 p-2.5">
            <svg viewBox="0 0 320 88" className="w-full h-20" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2.8"
                className="text-dot-blue/80"
                points="0,68 53,61 106,57 159,50 212,44 265,35 320,28"
              />
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                className="text-dot-purple/75"
                points="0,76 53,73 106,70 159,63 212,58 265,51 320,48"
              />
            </svg>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {[2, 3, 4, 6, 5, 3].map((count, index) => (
              <div key={`grade-${index}`} className="rounded-md border border-border-hairline bg-surface/60 p-1">
                <div className="h-8 flex items-end">
                  <div className="w-full rounded-sm bg-dot-yellow/65" style={{ height: `${count * 15}%` }} />
                </div>
                <p className="text-[8px] font-black text-center mt-1 text-muted-foreground">
                  {["2", "3", "4", "5", "5*", "5**"][index]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroPlannerShowcase() {
  const weekDays = [
    { day: "Sun", date: "Apr 07", isToday: false },
    { day: "Mon", date: "Apr 08", isToday: false },
    { day: "Tue", date: "Apr 09", isToday: true },
    { day: "Wed", date: "Apr 10", isToday: false },
    { day: "Thu", date: "Apr 11", isToday: false },
    { day: "Fri", date: "Apr 12", isToday: false },
    { day: "Sat", date: "Apr 13", isToday: false },
  ];

  const mockTasks = new Map<
    string,
    { shortCode: string; title: string; color: string; isRest?: boolean; isDone?: boolean }
  >([
    ["0-s1", { shortCode: "MATH", title: "Paper 2 timed drill", color: "#3b82f6", isDone: true }],
    ["1-s1", { shortCode: "ENG", title: "Paper 1 reading set A", color: "#10b981" }],
    ["2-s1", { shortCode: "CHEM", title: "Organic summary notes", color: "#8b5cf6" }],
    ["3-s1", { shortCode: "BIO", title: "MC revision + mistakes", color: "#06b6d4" }],
    ["5-s1", { shortCode: "M2", title: "Vectors mixed questions", color: "#f59e0b" }],
    ["1-s2a", { shortCode: "HIST", title: "Essay outline (Q3)", color: "#ef4444" }],
    ["2-s2a", { shortCode: "MATH", title: "Past paper correction", color: "#3b82f6" }],
    ["4-s2a", { shortCode: "ENG", title: "Listening practice set", color: "#10b981" }],
    ["0-s2b", { shortCode: "CHEM", title: "Acids and bases recap", color: "#8b5cf6" }],
    ["3-s2b", { shortCode: "MATH", title: "Paper 1 Section B", color: "#3b82f6" }],
    ["4-s2b", { shortCode: "BIO", title: "Respiration concept map", color: "#06b6d4" }],
    ["2-s3", { shortCode: "REST", title: "Recovery session", color: "#6b7280", isRest: true }],
    ["5-s3", { shortCode: "ENG", title: "Vocabulary review", color: "#10b981", isDone: true }],
  ]);

  return (
    <div
      className="relative w-full max-w-[840px] min-w-0 mx-auto lg:mx-0 lg:[transform:perspective(1500px)_rotateY(-14deg)_rotateX(6deg)] lg:[transform-origin:right_center]"
      aria-hidden="true"
    >
      <div className="absolute -inset-6 bg-dot-blue/10 blur-3xl rounded-[2rem] pointer-events-none" />
      <div className="relative h-[410px] sm:h-[500px] lg:h-[560px] rounded-[1.8rem] border border-border-hairline bg-surface/90 backdrop-blur-md shadow-[0_35px_80px_-35px_rgba(0,0,0,0.65)] overflow-hidden p-2.5 sm:p-3 max-w-full">
        <div className="origin-top-left scale-[0.5] sm:scale-[0.58] lg:scale-[0.66] w-[1080px]">
          <div className="w-full overflow-x-auto custom-scrollbar pb-6 planner-grid-container">
            <div className="w-fit bg-background rounded-3xl overflow-hidden">
              <div className="grid grid-cols-[100px_repeat(7,140px)] h-[80px] bg-background z-20 border-b border-border-hairline">
                <div className="flex flex-col items-center justify-center text-sm font-black text-muted-foreground uppercase tracking-[0.2em] text-center border-r border-border-hairline">
                  <span>Time</span>
                  <span className="opacity-0 mt-1 font-bold tracking-tight text-[12px] select-none" aria-hidden="true">00 000</span>
                </div>
                {weekDays.map((entry, index) => (
                  <div
                    key={entry.day}
                    className={`relative flex flex-col items-center justify-center text-sm font-black uppercase tracking-[0.2em] text-center ${
                      index !== weekDays.length - 1 ? "border-r border-border-hairline" : ""
                    } ${entry.isToday ? "text-primary" : "text-muted-foreground opacity-60"}`}
                  >
                    {entry.isToday && <div className="absolute inset-2 bg-surface shadow-sm rounded-2xl -z-10" />}
                    <div className="relative flex flex-col items-center justify-center">
                      <span>{entry.day}</span>
                      <span className="opacity-50 mt-1 font-bold tracking-tight text-[12px]">{entry.date}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="divide-y divide-border-hairline">
                {PLANNER_SESSIONS.map((session) => (
                  <div key={session.id} className="grid grid-cols-[100px_repeat(7,140px)] h-[140px] group">
                    <div className="flex flex-col items-center justify-center bg-surface/20 transition-colors group-hover:bg-surface/40 border-r border-border-hairline">
                      <span className="text-sm font-black text-primary uppercase tracking-widest leading-none mb-1.5">{session.label}</span>
                      <span className="text-[12px] font-bold text-muted-foreground tracking-tighter uppercase opacity-70">
                        {session.timeRange.split("-")[0]?.trim()}
                      </span>
                    </div>

                    {weekDays.map((day, dayIndex) => {
                      const key = `${dayIndex}-${session.id}`;
                      const task = mockTasks.get(key);
                      const isTask = Boolean(task);

                      return (
                        <div
                          key={`${session.id}-${day.day}`}
                          className={`p-1.5 relative transition-all duration-300 ${
                            dayIndex !== weekDays.length - 1 ? "border-r border-border-hairline" : ""
                          } ${day.isToday ? "bg-surface/30" : "hover:bg-surface/10"}`}
                        >
                          {!isTask && (
                            <div className="h-full w-full flex items-center justify-center transition-all rounded-xl border-2 border-dashed min-h-[100px] border-transparent">
                              <span className="text-sm font-bold text-muted-foreground/30 uppercase tracking-widest">
                                Add
                              </span>
                            </div>
                          )}

                          {isTask && task && !task.isRest && (
                            <div
                              className={`h-full w-full text-left transition-all duration-200 flex flex-col rounded-xl p-3 border border-border-hairline/50 relative min-h-[100px] ${
                                task.isDone ? "shadow-none" : "shadow-soft"
                              }`}
                              style={{
                                background: `linear-gradient(135deg, ${task.color}${task.isDone ? "15" : "30"} 0%, ${task.color}${task.isDone ? "05" : "15"} 100%)`,
                              }}
                            >
                              <div className="h-full min-h-0 border-l-2 pl-3 py-0.5 flex flex-col justify-start overflow-y-auto pr-3" style={{ borderColor: task.color }}>
                                <p className={`text-[15px] font-black text-primary uppercase tracking-widest leading-none mb-2 flex-shrink-0 ${task.isDone ? "line-through opacity-60" : ""}`}>
                                  {task.shortCode}
                                </p>
                                <p className={`text-[12px] font-bold text-muted-foreground tracking-tight break-words whitespace-pre-wrap ${task.isDone ? "line-through opacity-60" : ""}`}>
                                  {task.title}
                                </p>
                              </div>
                            </div>
                          )}

                          {isTask && task?.isRest && (
                            <div className="rest-session-cell h-full w-full text-center transition-all duration-200 flex flex-col rounded-xl p-3 shadow-soft border border-border-hairline/50 bg-muted group/rest min-h-[100px]">
                              <div className="h-full py-0.5 flex flex-col items-center justify-center">
                                <div className="flex items-center gap-2">
                                  <span className="rest-session-icon material-symbols-outlined text-sm text-muted-foreground transition-colors">
                                    coffee
                                  </span>
                                  <p className="rest-session-label text-[12px] font-black text-muted-foreground uppercase tracking-[0.2em] transition-colors">
                                    Rest
                                  </p>
                                </div>
                                <p className="rest-session-notes text-[11px] font-bold text-muted-foreground/60 tracking-tight break-words whitespace-pre-wrap mt-1">
                                  Recovery session
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-2 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border-hairline bg-background/70 p-2.5">
              <p className="text-[8px] font-black uppercase tracking-wider text-muted-foreground/70">Planned</p>
              <p className="text-base font-black text-primary">14 Sessions</p>
            </div>
            <div className="rounded-lg border border-border-hairline bg-background/70 p-2.5">
              <p className="text-[8px] font-black uppercase tracking-wider text-muted-foreground/70">Done</p>
              <p className="text-base font-black text-dot-green">5 Sessions</p>
            </div>
            <div className="rounded-lg border border-border-hairline bg-background/70 p-2.5">
              <p className="text-[8px] font-black uppercase tracking-wider text-muted-foreground/70">Focus</p>
              <p className="text-base font-black text-dot-yellow">Math + Chem</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-clip font-sans selection:bg-gray-100">
      <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[40%] bg-dot-blue/5 rounded-full blur-[110px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[40%] bg-dot-purple/5 rounded-full blur-[110px] animate-pulse delay-700" />
      <div className="absolute top-[28%] right-[8%] w-14 h-14 bg-dot-yellow/10 rounded-full blur-xl animate-bounce duration-[3s]" />
      <div className="absolute bottom-[22%] left-[9%] w-10 h-10 bg-dot-red/10 rounded-full blur-lg animate-bounce duration-[4s] delay-500" />

      <header className="sticky top-0 z-20 backdrop-blur-md bg-background/70 border-b border-border-hairline">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between min-w-0 gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 min-w-0"
            onClick={() => navigate("/")}
          >
            <span className="material-symbols-outlined text-xl">school</span>
            <span className="font-display text-xs sm:text-sm font-black tracking-[0.15em] uppercase truncate">
              LevelUp DSE
            </span>
          </button>

          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] tracking-[0.15em]"
            type="button"
            onClick={() => navigate("/login")}
          >
            Sign In
          </Button>
        </div>
      </header>

      <main className="relative z-10">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-16 md:pt-24 md:pb-24">
          <div className="grid gap-10 min-w-0 lg:grid-cols-[minmax(0,1fr)_minmax(520px,740px)] lg:items-center">
            <div className="max-w-3xl min-w-0 space-y-7 animate-in fade-in slide-in-from-bottom-6 duration-1000">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground opacity-70">
                HKDSE Prep Workspace
              </p>
              <h1 className="font-display text-4xl sm:text-5xl md:text-7xl leading-[0.95] text-primary">
                <span className="sm:whitespace-nowrap">Your DSE.</span>
                <br />
                <span className="font-black">Engineered.</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl font-light">
                LevelUp DSE helps students plan weekly study sessions, track past-paper performance,
                estimate outcomes, and stay focused on what matters most before exams.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-3 pt-2">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-[11px] tracking-[0.18em]"
                  type="button"
                  onClick={() => navigate("/login", { state: { tab: "signup" } })}
                >
                  Get Started Free
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-[11px] tracking-[0.18em]"
                  type="button"
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </Button>
              </div>
            </div>
            <div className="min-w-0 w-full flex justify-center lg:justify-end lg:block">
              <HeroPlannerShowcase />
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <div className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground opacity-70 mb-3">
              What You Can Do
            </p>
            <h2 className="text-2xl md:text-3xl font-display font-light text-primary">
              One place for your entire DSE preparation cycle.
            </h2>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 gap-5">
            {featureCards.map((feature, index) => (
              <Card
                key={feature.title}
                variant="zen"
                padding="md"
                className={`backdrop-blur-sm bg-surface/85 border border-border-hairline animate-in fade-in slide-in-from-bottom-4 duration-700 min-w-0 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 md:items-center`}
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <div className="space-y-3 mb-4 min-w-0 md:mb-0">
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-background/70">
                    <span className={`material-symbols-outlined text-2xl ${feature.accentClass}`}>
                      {feature.icon}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-primary">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
                <div className="rounded-2xl border border-border-hairline bg-background/45 p-3.5 md:p-4 min-w-0 max-md:overflow-x-auto">
                  <FeaturePreview id={feature.id} />
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
          <Card
            variant="zen"
            padding="lg"
            className="text-center border border-border-hairline bg-surface/85 backdrop-blur-sm space-y-5"
          >
            <h2 className="text-2xl md:text-3xl font-display font-light text-primary">
              Ready to take control of your DSE prep?
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              Create your account and start building a focused plan in minutes.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button
                size="lg"
                className="w-full sm:w-auto text-[11px] tracking-[0.18em]"
                type="button"
                onClick={() => navigate("/login", { state: { tab: "signup" } })}
              >
                Create Free Account
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto text-[11px] tracking-[0.18em]"
                type="button"
                onClick={() => navigate("/login")}
              >
                I Already Have An Account
              </Button>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border-hairline py-6 px-4 sm:px-6 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40">
          DSE Study Companion &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
