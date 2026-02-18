import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useRef } from "react";
import { getSupabaseClient } from "../lib/supabase";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";

function navLinkClassName(isActive: boolean): string {
  return [
    "flex items-center gap-4 transition-all duration-200 group py-1",
    isActive
      ? "text-primary"
      : "text-muted-foreground hover:text-primary",
  ].join(" ");
}

export function Layout() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserPopoverOpen, setIsUserPopoverOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [userName, setUserName] = useState("Student User");
  const [newName, setNewName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function getUserData() {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name);
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
      } catch (error) {
        console.error("Failed to sign out from Supabase.", error);
      }
      navigate("/login");
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

  const daysToDSE = useMemo(() => {
    const targetDate = new Date('2026-04-09T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 border-r border-border-hairline flex-col py-8 px-8 bg-sidebar z-50">
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
                <span className="text-sm font-bold tracking-tight">Dashboard</span>
              </NavLink>
              <NavLink to="/past-papers" className={({ isActive }) => navLinkClassName(isActive)}>
                <span className="material-symbols-outlined text-xl">analytics</span>
                <span className="text-sm font-bold tracking-tight">Mastery</span>
              </NavLink>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2 opacity-60">Curriculum</p>
            <div className="space-y-4">
              <NavLink to="/subjects" className={({ isActive }) => navLinkClassName(isActive)}>
                <span className="material-symbols-outlined text-xl">library_books</span>
                <span className="text-sm font-bold tracking-tight">Subjects</span>
              </NavLink>
            </div>
          </div>
        </nav>

        <div className="mt-auto pt-8 border-t border-border-hairline space-y-8">
          <div className="space-y-4">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2 opacity-60">Exam Prep</p>
            <div className="glass-card rounded-2xl p-5 mb-2 hairline-border shadow-sm">
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-light tracking-tighter">D-{daysToDSE}</span>
                <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Countdown to 2026 DSE</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-2">
              <div className="w-1.5 h-1.5 rounded-full bg-dot-green animate-pulse"></div>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Stay Focused</span>
            </div>
          </div>

          <div className="pt-8 border-t border-border-hairline">
            <div className="flex items-center justify-between px-2 group">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-surface border border-border-hairline flex items-center justify-center shadow-soft overflow-hidden transition-transform group-hover:scale-105">
                  <span className="material-symbols-outlined text-muted-foreground text-xl">person</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-primary tracking-tight">{userName}</span>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Candidate 2026</span>
                </div>
              </div>
              <div className="relative" ref={popoverRef}>
                <button 
                  onClick={() => setIsUserPopoverOpen(!isUserPopoverOpen)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-primary transition-all ${isUserPopoverOpen ? 'bg-muted/50 text-primary rotate-90' : 'hover:bg-muted/30'}`}
                  title="Options"
                >
                  <span className="material-symbols-outlined text-xl transition-transform duration-300">chevron_right</span>
                </button>
                
                {isUserPopoverOpen && (
                  <div className="absolute bottom-0 left-full ml-4 w-48 p-2 bg-surface border border-border-hairline rounded-2xl shadow-xl animate-in fade-in slide-in-from-left-2 duration-300 z-[100]">
                    <button 
                      onClick={() => {
                        setIsUserPopoverOpen(false);
                        setNewName(userName);
                        setIsNameModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all group mb-1"
                    >
                      <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">edit</span>
                      <span className="text-[11px] font-black uppercase tracking-widest">Change Name</span>
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
                <NavLink 
                  to="/planner" 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (window.location.pathname === "/planner") {
                      window.dispatchEvent(new CustomEvent("scroll-to-today"));
                    }
                  }} 
                  className={({ isActive }) => navLinkClassName(isActive) + " text-2xl"}
                >
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
              <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">Curriculum</p>
              <div className="space-y-6">
                <NavLink to="/subjects" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => navLinkClassName(isActive) + " text-2xl"}>
                  <span className="material-symbols-outlined text-3xl">library_books</span>
                  <span className="font-bold">Subjects</span>
                </NavLink>
              </div>
            </div>
          </nav>
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
