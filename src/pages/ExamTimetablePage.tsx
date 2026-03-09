import { useCallback, useEffect, useMemo, useState } from "react";
import type { Subject } from "../types";
import { getCurrentExamYear, getTimetableForYear, HKEAA_TIMETABLE_URL } from "../constants";

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface ExamTimetablePageProps {
  subjects: Subject[];
}

export function ExamTimetablePage({ subjects }: ExamTimetablePageProps) {
  const [todayStr, setTodayStr] = useState(getTodayStr);

  // Refresh `today` when the tab regains focus (handles overnight stale date)
  const checkDate = useCallback(() => {
    setTodayStr((prev) => {
      const now = getTodayStr();
      return now !== prev ? now : prev;
    });
  }, []);

  useEffect(() => {
    document.addEventListener("visibilitychange", checkDate);
    return () => document.removeEventListener("visibilitychange", checkDate);
  }, [checkDate]);

  const { allExams, nextExam, nextExamPerSubject, stats, timetableYear, hasTimetable } = useMemo(() => {
    const today = new Date(`${todayStr}T00:00:00`);
    const examYear = getCurrentExamYear();
    const timetable = getTimetableForYear(examYear);

    if (!timetable) {
      return {
        allExams: [],
        nextExam: null,
        nextExamPerSubject: subjects.map((s) => ({ subject: s, nextPaper: null })),
        stats: { remainingSittings: 0, totalDaysRemaining: 0 },
        timetableYear: examYear,
        hasTimetable: false,
      };
    }

    const userSubjectCodes = subjects.map((s) => s.shortCode);
    
    // Filter to only the user's subjects, or all if no subjects selected yet
    const relevantExams = timetable.filter((exam) =>
      userSubjectCodes.length > 0 ? userSubjectCodes.includes(exam.subjectCode) : true
    );

    const processedExams = relevantExams.map((exam) => {
      const parsedDate = new Date(`${exam.date}T00:00:00`);
      const diffTime = parsedDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let status: "past" | "today" | "upcoming" = "upcoming";
      if (daysRemaining < 0) status = "past";
      else if (daysRemaining === 0) status = "today";

      const subject = subjects.find(s => s.shortCode === exam.subjectCode);

      return {
        ...exam,
        parsedDate,
        daysRemaining,
        status,
        subjectName: subject?.name || exam.subjectCode,
        subjectColor: subject?.baseColor || "#64748b",
      };
    }).sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    const upcomingExams = processedExams.filter(e => e.status !== "past");
    const next = upcomingExams[0] || null;

    const remainingSittings = upcomingExams.length;
    const lastExam = upcomingExams[upcomingExams.length - 1];
    const totalDaysRemaining = lastExam ? lastExam.daysRemaining : 0;

    // Calculate next exam for each user subject
    const nextExamPerSubject = subjects.map(subject => {
      const subjectExams = processedExams
        .filter(e => e.subjectCode === subject.shortCode && e.status !== "past")
        .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
      
      return {
        subject,
        nextPaper: subjectExams[0] || null
      };
    }).sort((a, b) => {
      // Sort subjects by their next exam date
      if (!a.nextPaper) return 1;
      if (!b.nextPaper) return -1;
      return a.nextPaper.parsedDate.getTime() - b.nextPaper.parsedDate.getTime();
    });

    return { 
      allExams: processedExams, 
      nextExam: next,
      nextExamPerSubject,
      stats: {
        remainingSittings,
        totalDaysRemaining
      },
      timetableYear: examYear,
      hasTimetable: true,
    };
  }, [subjects, todayStr]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
  };

  if (!hasTimetable) {
    return (
      <div className="space-y-8 pt-6 lg:pt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
        <div>
          <h1 className="text-3xl font-light tracking-tighter">Exam Timetable</h1>
          <p className="text-sm text-muted-foreground mt-1">Your personalised {timetableYear} DSE schedule</p>
        </div>
        <div className="glass-card rounded-3xl p-8 border border-border-hairline shadow-soft text-center">
          <h2 className="text-xl font-bold tracking-tight mb-2">Timetable not yet available</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            The {timetableYear} DSE examination timetable has not been published yet. Check the HKEAA website for updates.
          </p>
          <a
            href={HKEAA_TIMETABLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline"
          >
            View timetable on HKEAA
            <span className="material-symbols-outlined text-lg">open_in_new</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-6 lg:pt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-light tracking-tighter">Exam Timetable</h1>
          <p className="text-sm text-muted-foreground mt-1">Your personalised {timetableYear} DSE schedule</p>
        </div>

        {stats.remainingSittings > 0 && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            <div className="flex items-center gap-2">
              <span className="text-foreground font-black text-sm tracking-tighter">{stats.totalDaysRemaining}</span> days until last exam
            </div>
            <div className="w-1 h-1 rounded-full bg-border-hairline hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="text-foreground font-black text-sm tracking-tighter">{stats.remainingSittings}</span> sittings remaining
            </div>
          </div>
        )}
      </div>

      {/* Hero Banner */}
      <div className="glass-card rounded-3xl p-8 relative overflow-hidden border border-border-hairline shadow-soft">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        
        {nextExam ? (
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Next Paper</span>
              <span className="text-5xl md:text-7xl font-light tracking-tighter text-primary">
                {nextExam.daysRemaining === 0 ? "Today" : `D-${nextExam.daysRemaining}`}
              </span>
            </div>
            
            <div className="flex-1 border-l-2 border-border-hairline pl-6 py-2">
              <div className="flex items-center gap-2 mb-1">
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: nextExam.subjectColor }}
                />
                <span className="text-sm font-bold tracking-widest uppercase opacity-80" style={{ color: nextExam.subjectColor }}>
                  {nextExam.subjectCode}
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-1">{nextExam.subjectName}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
                <p className="text-lg">{nextExam.paper}</p>
                <div className="w-1.5 h-1.5 rounded-full bg-border-hairline hidden md:block"></div>
                <p className="text-lg font-medium text-foreground">{nextExam.time}</p>
              </div>
              <p className="text-sm font-medium mt-3 px-3 py-1 bg-surface border border-border-hairline rounded-full inline-block">
                {formatDate(nextExam.parsedDate)}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative z-10 py-8 text-center">
            <h2 className="text-3xl font-light tracking-tighter mb-2">Exams Complete</h2>
            <p className="text-muted-foreground">Congratulations on finishing all your papers!</p>
          </div>
        )}
      </div>

      {/* Subject Countdown Cards */}
      {subjects.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
              By Subject
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nextExamPerSubject.map(({ subject, nextPaper }) => (
              <div 
                key={subject.id}
                className="glass-card rounded-2xl p-5 border border-border-hairline shadow-soft flex flex-col justify-between group hover:border-primary/20 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: subject.baseColor }}
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {subject.shortCode}
                    </span>
                  </div>
                  {nextPaper && (
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      nextPaper.status === 'today' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {nextPaper.daysRemaining === 0 ? "Today" : `D-${nextPaper.daysRemaining}`}
                    </span>
                  )}
                </div>
                
                {nextPaper ? (
                  <div>
                    <h4 className="text-sm font-bold truncate mb-1">{nextPaper.paper}</h4>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDate(nextPaper.parsedDate)} • {nextPaper.time}
                    </p>
                  </div>
                ) : (
                  <div className="py-2">
                    <p className="text-xs text-muted-foreground italic">Exams complete</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Table */}
      <div className="glass-card rounded-2xl border border-border-hairline shadow-soft overflow-hidden">
        <div className="p-5 border-b border-border-hairline bg-surface/50">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Chronological Schedule</h3>
        </div>
        
        <div className="divide-y divide-border-hairline">
          {allExams.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No exams found. Add subjects to see your timetable.
            </div>
          ) : (
            allExams.map((exam) => {
              const isNext = nextExam?.date === exam.date && nextExam?.subjectCode === exam.subjectCode;
              
              return (
                <div 
                  key={`${exam.date}-${exam.subjectCode}-${exam.paper}`} 
                  className={`p-4 sm:px-6 flex items-center justify-between transition-colors ${
                    isNext ? 'bg-primary/5' : 'hover:bg-muted/10'
                  } ${exam.status === 'past' ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
                    {/* Date Block */}
                    <div className="w-20 flex-shrink-0 flex flex-col">
                      <span className={`text-sm font-bold ${exam.status === 'past' ? 'line-through text-muted-foreground' : ''}`}>
                        {formatDate(exam.parsedDate).split(',')[0]}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {formatDate(exam.parsedDate).split(',')[1]?.trim()}
                      </span>
                    </div>

                    {/* Subject Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div 
                        className="w-1.5 h-8 rounded-full flex-shrink-0"
                        style={{ backgroundColor: exam.status === 'past' ? 'var(--color-muted)' : exam.subjectColor }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className={`text-sm font-bold truncate ${exam.status === 'past' ? 'line-through' : ''}`}>
                          {exam.subjectCode} <span className="font-normal text-muted-foreground hidden sm:inline ml-1">• {exam.subjectName}</span>
                        </span>
                        <span className="text-[11px] text-muted-foreground uppercase tracking-wider truncate flex items-center gap-2">
                          {exam.paper}
                          {exam.time && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-border-hairline"></span>
                              <span className="font-bold text-foreground/70">{exam.time}</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status / Countdown */}
                  <div className="flex-shrink-0 ml-4 text-right">
                    {exam.status === 'past' ? (
                      <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                        Done
                      </span>
                    ) : exam.status === 'today' ? (
                      <span className="text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/10 px-2 py-1 rounded-md">
                        Today
                      </span>
                    ) : (
                      <span className={`text-xs font-medium ${isNext ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                        in {exam.daysRemaining} days
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
