import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useRef } from "react";
import { getSupabaseClient } from "../lib/supabase";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import type { PlannerCell, Subject } from "../types";
import { startOfWeekSunday, formatWeekLabel, isDateInWeek } from "../utils/dateHelpers";
import { getCurrentExamYear, getTimetableForYear } from "../constants";

function navLinkClassName(isActive: boolean): string {
  return [
    "flex items-center gap-3 transition-all duration-200 group px-3 py-2 rounded-xl",
    isActive
      ? "text-primary bg-primary/5 shadow-sm"
      : "text-muted-foreground hover:text-primary hover:bg-muted/30",
  ].join(" ");
}

interface LayoutProps {
  subjects?: Subject[];
  cells?: PlannerCell[];
}

export function Layout({ subjects = [], cells = [] }: LayoutProps) {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserPopoverOpen, setIsUserPopoverOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [userName, setUserName] = useState("Student User");
  const [newName, setNewName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    async function getUserData() {
      try {
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.full_name) {
          setUserName(user.user_metadata.full_name);
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      }
    }
    getUserData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsUserPopoverOpen(false);
      }
    }
    if (isUserPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserPopoverOpen]);

  const handleSignOut = async () => {
    const confirmed = window.confirm("Are you sure you want to sign out?");
    if (confirmed) {
      setIsUserPopoverOpen(false);
      try {
        const supabase = getSupabaseClient();
        await supabase.auth.signOut();
        navigate("/login");
      } catch (error) {
        console.error("Failed to sign out from Supabase.", error);
        navigate("/login");
      }
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    setIsSavingName(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({
        data: { full_name: newName.trim() }
      });
      if (error) throw error;
      setUserName(newName.trim());
      setIsNameModalOpen(false);
    } catch (error) {
      console.error("Failed to update name.", error);
      alert("Failed to update name. Please try again.");
    } finally {
      setIsSavingName(false);
    }
  };

  const nextExam = useMemo(() => {
    const timetable = getTimetableForYear(getCurrentExamYear());
    if (!timetable) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userSubjectCodes = subjects.map((s) => s.shortCode);
    const relevantExams = timetable.filter((exam) =>
      userSubjectCodes.includes(exam.subjectCode)
    );

    const examsToConsider = relevantExams.length > 0 ? relevantExams : timetable;

    const upcoming = examsToConsider
      .map((exam) => ({ ...exam, parsedDate: new Date(`${exam.date}T00:00:00`) }))
      .filter((exam) => exam.parsedDate.getTime() >= today.getTime())
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    return upcoming[0] || null;
  }, [subjects]);

  const daysToNextExam = useMemo(() => {
    if (!nextExam) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = nextExam.parsedDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [nextExam]);

  const weeklyProgress = useMemo(() => {
    const weekStart = startOfWeekSunday(new Date());
    const studyCells = cells.filter(
      (c) => c.task && !c.task.isRest && isDateInWeek(c.date, weekStart)
    );
    const total = studyCells.length;
    const done = studyCells.filter((c) => c.task?.isDone).length;
    return { total, done, weekStart };
  }, [cells]);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 border-r border-border-hairline flex-col py-8 px-8 bg-sidebar z-50">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-primary-foreground text-lg">circle_notifications</span>
          </div>
          <h2 className="text-sm font-bold tracking-tight uppercase">LevelUp</h2>
        </div>

        {weeklyProgress.total > 0 && (
          <div
            onClick={() => navigate("/planner")}
            className="mb-6 px-3 py-3 rounded-2xl bg-surface/50 border border-border-hairline shadow-soft cursor-pointer hover:bg-muted/30 transition-colors group"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider opacity-70">
                This week
              </span>
              <span className="text-[11px] font-bold text-primary tabular-nums">
                {weeklyProgress.done} / {weeklyProgress.total}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-success transition-all duration-300"
                style={{ width: `${weeklyProgress.total ? (weeklyProgress.done / weeklyProgress.total) * 100 : 0}%` }}
              />
            </div>
            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-1.5 opacity-60">
              {formatWeekLabel(weeklyProgress.weekStart)}
            </p>
          </div>
        )}

        <nav className="flex-1 w-full space-y-1">
          <NavLink 
            to="/planner" 
            className={({ isActive }) => navLinkClassName(isActive)}
            onClick={() => {
              if (window.location.pathname === "/planner") {
                window.dispatchEvent(new CustomEvent("scroll-to-today"));
              }
            }}
          >
            <span className="material-symbols-outlined text-xl">grid_view</span>
            <span className="text-sm font-medium tracking-tight">Dashboard</span>
          </NavLink>
          <NavLink to="/plan" className={({ isActive }) => navLinkClassName(isActive)}>
            <span className="material-symbols-outlined text-xl">flag</span>
            <span className="text-sm font-medium tracking-tight">Plan (Beta)</span>
          </NavLink>
          <NavLink to="/past-papers" className={({ isActive }) => navLinkClassName(isActive)}>
            <span className="material-symbols-outlined text-xl">analytics</span>
            <span className="text-sm font-medium tracking-tight">Past Papers</span>
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => navLinkClassName(isActive)}>
            <span className="material-symbols-outlined text-xl">insights</span>
            <span className="text-sm font-medium tracking-tight">Insights</span>
          </NavLink>
          <NavLink to="/subjects" className={({ isActive }) => navLinkClassName(isActive)}>
            <span className="material-symbols-outlined text-xl">library_books</span>
            <span className="text-sm font-medium tracking-tight">Subjects</span>
          </NavLink>
        </nav>

        <div className="mt-auto space-y-4 pt-6">
          {/* Compact Countdown */}
          <div 
            onClick={() => navigate('/exam-timetable')}
            className="glass-card rounded-2xl p-4 hairline-border shadow-soft flex items-center justify-between group cursor-pointer hover:bg-muted/30 transition-colors"
          >
            <div className="flex flex-col">
              {nextExam && daysToNextExam !== null ? (
                <>
                  <span className="text-xl font-light tracking-tighter">
                    {daysToNextExam === 0 ? "Today" : `D-${daysToNextExam}`}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                    {nextExam.subjectCode} {nextExam.paper}
                    <span className="material-symbols-outlined text-[10px] group-hover:translate-x-0.5 transition-transform">chevron_right</span>
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xl font-light tracking-tighter text-muted-foreground">Done</span>
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                    Exams Complete
                    <span className="material-symbols-outlined text-[10px] group-hover:translate-x-0.5 transition-transform">chevron_right</span>
                  </span>
                </>
              )}
            </div>
            {nextExam && daysToNextExam !== null && daysToNextExam >= 0 && (
              <div className="w-1.5 h-1.5 rounded-full bg-dot-green animate-pulse shadow-[0_0_8px_rgba(85,239,196,0.6)]"></div>
            )}
          </div>

          {/* Unified User Profile Footer */}
          <div className="pt-4 border-t border-border-hairline">
            <div className="flex items-center justify-between group px-1">
              <div 
                className="flex items-center gap-3 cursor-pointer overflow-hidden"
                onClick={() => {
                  setNewName(userName);
                  setIsNameModalOpen(true);
                }}
              >
                <div className="w-9 h-9 flex-shrink-0 rounded-full bg-surface border border-border-hairline flex items-center justify-center shadow-soft overflow-hidden transition-transform group-hover:scale-105 group-hover:border-primary/20">
                  <span className="material-symbols-outlined text-muted-foreground text-lg">person</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-primary tracking-tight truncate">{userName}</span>
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Candidate</span>
                </div>
              </div>

              <div className="relative" ref={popoverRef}>
                <button 
                  onClick={() => setIsUserPopoverOpen(!isUserPopoverOpen)}
                  className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full text-muted-foreground hover:text-primary transition-all ${isUserPopoverOpen ? 'bg-muted/50 text-primary rotate-90' : 'hover:bg-muted/30'}`}
                  title="Options"
                >
                  <span className="material-symbols-outlined text-xl transition-transform duration-300">chevron_right</span>
                </button>
                
                {isUserPopoverOpen && (
                  <div className="absolute bottom-0 left-full ml-4 w-48 p-2 bg-surface border border-border-hairline rounded-2xl shadow-xl animate-in fade-in slide-in-from-left-2 duration-300 z-[100]">
                    <button 
                      onClick={() => {
                        setIsDarkMode(!isDarkMode);
                        setIsUserPopoverOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all group mb-1"
                    >
                      <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">
                        {isDarkMode ? 'light_mode' : 'dark_mode'}
                      </span>
                      <span className="text-[11px] font-black uppercase tracking-widest">
                        {isDarkMode ? 'Light' : 'Dark'}
                      </span>
                    </button>
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-dot-red hover:bg-dot-red/5 transition-all group"
                    >
                      <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">logout</span>
                      <span className="text-[11px] font-black uppercase tracking-widest">Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Nav Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-border-hairline bg-sidebar/80 backdrop-blur-md z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-primary-foreground text-base">circle_notifications</span>
          </div>
          <h2 className="text-sm font-bold tracking-tight uppercase">LevelUp</h2>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">{isMobileMenuOpen ? "close" : "menu"}</span>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-background/95 backdrop-blur-lg z-50 pt-24 px-10 animate-in fade-in duration-300">
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-6 right-6 p-2 text-muted-foreground"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
          {weeklyProgress.total > 0 && (
            <div
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate("/planner");
              }}
              className="mb-6 p-4 rounded-2xl bg-surface/50 border border-border-hairline shadow-soft cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-black text-muted-foreground uppercase tracking-wider opacity-70">
                  This week
                </span>
                <span className="text-sm font-bold text-primary tabular-nums">
                  {weeklyProgress.done} / {weeklyProgress.total}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-success transition-all duration-300"
                  style={{ width: `${weeklyProgress.total ? (weeklyProgress.done / weeklyProgress.total) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-2 opacity-60">
                {formatWeekLabel(weeklyProgress.weekStart)}
              </p>
            </div>
          )}
          <nav className="space-y-1">
            <NavLink 
              to="/planner" 
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (window.location.pathname === "/planner") {
                  window.dispatchEvent(new CustomEvent("scroll-to-today"));
                }
              }} 
              className={({ isActive }) => navLinkClassName(isActive)}
            >
              <span className="material-symbols-outlined text-2xl">grid_view</span>
              <span className="font-medium">Dashboard</span>
            </NavLink>
            <NavLink to="/plan" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => navLinkClassName(isActive)}>
              <span className="material-symbols-outlined text-2xl">flag</span>
              <span className="font-medium">Plan (Beta)</span>
            </NavLink>
            <NavLink to="/past-papers" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => navLinkClassName(isActive)}>
              <span className="material-symbols-outlined text-2xl">analytics</span>
              <span className="font-medium">Past Papers</span>
            </NavLink>
            <NavLink to="/analytics" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => navLinkClassName(isActive)}>
              <span className="material-symbols-outlined text-2xl">insights</span>
              <span className="font-medium">Insights</span>
            </NavLink>
            <NavLink to="/subjects" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => navLinkClassName(isActive)}>
              <span className="material-symbols-outlined text-2xl">library_books</span>
              <span className="font-medium">Subjects</span>
            </NavLink>
          </nav>

          <div className="mt-auto space-y-6 pb-12">
            <div 
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate('/exam-timetable');
              }}
              className="glass-card rounded-2xl p-6 hairline-border shadow-soft flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <div className="flex flex-col">
                {nextExam && daysToNextExam !== null ? (
                  <>
                    <span className="text-3xl font-light tracking-tighter">
                      {daysToNextExam === 0 ? "Today" : `D-${daysToNextExam}`}
                    </span>
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                      {nextExam.subjectCode} {nextExam.paper}
                      <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-light tracking-tighter text-muted-foreground">Done</span>
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                      Exams Complete
                      <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                    </span>
                  </>
                )}
              </div>
              {nextExam && daysToNextExam !== null && daysToNextExam >= 0 && (
                <div className="w-2 h-2 rounded-full bg-dot-green animate-pulse shadow-[0_0_10px_rgba(85,239,196,0.6)]"></div>
              )}
            </div>

            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-surface border border-border-hairline flex items-center justify-center shadow-soft">
                  <span className="material-symbols-outlined text-muted-foreground text-2xl">person</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-primary tracking-tight">{userName}</span>
                  <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-60">Candidate</span>
                </div>
              </div>
              <button 
                onClick={handleSignOut}
                className="w-10 h-10 flex items-center justify-center rounded-full text-dot-red hover:bg-dot-red/5 transition-all"
              >
                <span className="material-symbols-outlined text-2xl">logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 lg:px-12 pt-16 lg:pt-0 pb-24 lg:pb-12">
          <div className="max-w-6xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Outlet />
          </div>
        </div>
      </main>

      <Modal
        isOpen={isNameModalOpen}
        onClose={() => setIsNameModalOpen(false)}
        title="Update Profile"
        description="Change how your name appears in the dashboard."
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 ml-1">
              Display Name
            </label>
            <Input
              placeholder="Enter your name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 rounded-full text-[10px] font-black uppercase tracking-widest"
              onClick={() => setIsNameModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-[2] rounded-full text-[10px] font-black uppercase tracking-widest"
              onClick={handleUpdateName}
              disabled={isSavingName || !newName.trim()}
            >
              {isSavingName ? "Updating..." : "Save Name"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
