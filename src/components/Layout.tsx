import { NavLink, Outlet } from "react-router-dom";

function linkClassName(isActive: boolean): string {
  return [
    "rounded-lg px-3 py-2 text-sm font-medium transition",
    isActive
      ? "bg-slate-900 text-white"
      : "text-slate-700 hover:bg-white hover:text-slate-900",
  ].join(" ");
}

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">LevelUp DSE</h1>
            <p className="text-xs text-slate-500">Study Planner + Past Paper Tracker</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            <NavLink to="/planner" className={({ isActive }) => linkClassName(isActive)}>
              Planner
            </NavLink>
            <NavLink to="/past-papers" className={({ isActive }) => linkClassName(isActive)}>
              Past Papers
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => linkClassName(isActive)}>
              Settings
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
