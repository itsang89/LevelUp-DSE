import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState, useMemo } from "react";

function navLinkClassName(isActive: boolean): string {
  return [
    "flex items-center gap-4 transition-all duration-200 group py-1",
    isActive
      ? "text-primary"
      : "text-muted-foreground hover:text-primary",
  ].join(" ");
}

export function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const pageTitle = useMemo(() => {
    switch (location.pathname) {
      case "/planner":
        return "Study Planner";
      case "/past-papers":
        return "Zen Analytics";
      case "/settings":
        return "Settings";
      default:
        return "LevelUp DSE";
    }
  }, [location.pathname]);

  const pageSubtitle = useMemo(() => {
    if (location.pathname === "/planner") {
      return "/ March 2026";
    }
    return "/ DSE Companion";
  }, [location.pathname]);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 border-r border-border-hairline flex-col py-8 px-8 bg-white/50 backdrop-blur-sm z-50">
        <div className="flex items-center gap-3 mb-16 px-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-white text-lg">circle_notifications</span>
          </div>
          <h2 className="text-sm font-bold tracking-tight uppercase">LevelUp</h2>
        </div>

        <nav className="flex-1 w-full space-y-10">
          <div className="space-y-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2 opacity-60">Planner</p>
            <div className="space-y-4">
              <NavLink to="/planner" className={({ isActive }) => navLinkClassName(isActive)}>
                <span className="material-symbols-outlined text-xl">grid_view</span>
                <span className="text-sm font-bold tracking-tight">Dashboard</span>
              </NavLink>
              <NavLink to="/past-papers" className={({ isActive }) => navLinkClassName(isActive)}>
                <span className="material-symbols-outlined text-xl">analytics</span>
                <span className="text-sm font-bold tracking-tight">Mastery</span>
              </NavLink>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2 opacity-60">Analysis</p>
            <div className="space-y-4">
              <NavLink to="/settings" className={({ isActive }) => navLinkClassName(isActive)}>
                <span className="material-symbols-outlined text-xl">settings</span>
                <span className="text-sm font-bold tracking-tight">Settings</span>
              </NavLink>
            </div>
          </div>
        </nav>

        <div className="mt-auto pt-8 border-t border-border-hairline">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 opacity-60">Exam Prep</p>
          <div className="glass-card rounded-2xl p-5 mb-4 hairline-border shadow-sm">
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-light tracking-tighter">DSE<span className="text-xs text-muted-foreground ml-2 font-bold uppercase tracking-widest">2026</span></span>
              <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Countdown Active</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2">
            <div className="w-1.5 h-1.5 rounded-full bg-dot-green animate-pulse"></div>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Stay Focused</span>
          </div>
        </div>
      </aside>

      {/* Mobile Nav Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-border-hairline bg-white/80 backdrop-blur-md z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-base">circle_notifications</span>
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
          <nav className="space-y-12">
            <div className="space-y-6">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">Planner</p>
              <div className="space-y-6">
                <NavLink to="/planner" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => navLinkClassName(isActive) + " text-2xl"}>
                  <span className="material-symbols-outlined text-3xl">grid_view</span>
                  <span className="font-bold">Dashboard</span>
                </NavLink>
                <NavLink to="/past-papers" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => navLinkClassName(isActive) + " text-2xl"}>
                  <span className="material-symbols-outlined text-3xl">analytics</span>
                  <span className="font-bold">Mastery</span>
                </NavLink>
              </div>
            </div>
            <div className="space-y-6">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">Analysis</p>
              <div className="space-y-6">
                <NavLink to="/settings" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => navLinkClassName(isActive) + " text-2xl"}>
                  <span className="material-symbols-outlined text-3xl">settings</span>
                  <span className="font-bold">Settings</span>
                </NavLink>
              </div>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="h-20 flex items-center justify-between px-6 lg:px-12 border-b border-border-hairline bg-white/30 backdrop-blur-sm sticky top-0 z-10 lg:pt-0 pt-0">
          <div className="flex items-center gap-4 mt-0 lg:mt-0 pt-0">
            <h1 className="text-lg font-bold tracking-tight">{pageTitle}</h1>
            <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest hidden sm:inline">{pageSubtitle}</span>
          </div>
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors tracking-widest uppercase">
              <span className="material-symbols-outlined text-lg">search</span>
              <span className="hidden md:block">Search</span>
            </button>
            <div className="h-10 w-10 rounded-full border border-border-hairline overflow-hidden shadow-sm bg-muted flex items-center justify-center">
              <span className="material-symbols-outlined text-muted-foreground text-xl">person</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12 pb-24 lg:pb-12">
          <div className="max-w-6xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
