import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/Button";

interface SortDropdownProps {
  sortKey: string;
  setSortKey: (key: string) => void;
  sortDirection: "asc" | "desc";
  setSortDirection: (dir: "asc" | "desc") => void;
}

export function SortDropdown({ sortKey, setSortKey, sortDirection, setSortDirection }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = [
    { value: "date", label: "Date" },
    { value: "examYear", label: "Year" },
    { value: "percentage", label: "Score" },
  ];

  const activeOption = options.find(o => o.value === sortKey);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        className="h-9 px-3 rounded-full text-[10px] font-black uppercase tracking-widest gap-2 text-muted-foreground hover:text-primary transition-all duration-300"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="material-symbols-outlined text-[18px]">sort</span>
        <span className="hidden sm:inline-block">{activeOption?.label}</span>
        <span className="material-symbols-outlined text-[14px] opacity-40">
          {sortDirection === "desc" ? "arrow_downward" : "arrow_upward"}
        </span>
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-surface/95 backdrop-blur-md rounded-2xl shadow-zen border border-border-hairline p-1.5 z-40 min-w-[140px] animate-in fade-in zoom-in-95 duration-200">
          <div className="px-3 py-2 text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Sort By</div>
          {options.map((option) => (
            <button
              key={option.value}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                sortKey === option.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/30"
              }`}
              onClick={() => {
                if (sortKey === option.value) {
                  setSortDirection(sortDirection === "desc" ? "asc" : "desc");
                } else {
                  setSortKey(option.value);
                  setSortDirection("desc");
                }
                setIsOpen(false);
              }}
            >
              {option.label}
              {sortKey === option.value && (
                <span className="material-symbols-outlined text-[14px]">
                  {sortDirection === "desc" ? "arrow_downward" : "arrow_upward"}
                </span>
              )}
            </button>
          ))}
          <div className="h-px bg-border-hairline my-1.5 mx-1" />
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-muted/30 transition-all"
            onClick={() => {
              setSortDirection(sortDirection === "desc" ? "asc" : "desc");
              setIsOpen(false);
            }}
          >
            <span className="material-symbols-outlined text-sm">swap_vert</span>
            Toggle Order
          </button>
        </div>
      )}
    </div>
  );
}
