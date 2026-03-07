import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

type DateRangeFilter = "all" | "last30" | "last3months" | "custom";

interface DateFilterDropdownProps {
  filter: DateRangeFilter;
  setFilter: (f: DateRangeFilter) => void;
  fromDate: string;
  setFromDate: (d: string) => void;
  toDate: string;
  setToDate: (d: string) => void;
}

export function DateFilterDropdown({
  filter,
  setFilter,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
}: DateFilterDropdownProps) {
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

  const options: { value: DateRangeFilter; label: string }[] = [
    { value: "all", label: "All Time" },
    { value: "last30", label: "Last 30 Days" },
    { value: "last3months", label: "Last 3 Months" },
    { value: "custom", label: "Custom Range" },
  ];

  const activeOption = options.find((o) => o.value === filter);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        className="h-9 px-3 rounded-full text-[10px] font-black uppercase tracking-widest gap-2 text-muted-foreground hover:text-primary transition-all duration-300"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
        <span className="hidden sm:inline-block">
          {filter === "custom" && fromDate && toDate
            ? `${fromDate.split("-").slice(1).join("/")} – ${toDate.split("-").slice(1).join("/")}`
            : activeOption?.label}
        </span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-surface/95 backdrop-blur-md rounded-2xl shadow-zen border border-border-hairline p-1.5 z-40 min-w-[220px] animate-in fade-in zoom-in-95 duration-200">
          <div className="px-3 py-2 text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40 border-b border-border-hairline/50 mb-1">
            Date Range Filter
          </div>
          {options.map((option) => (
            <button
              key={option.value}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                filter === option.value && option.value !== "custom"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/30"
              }`}
              onClick={() => {
                setFilter(option.value);
                if (option.value !== "custom") {
                  setIsOpen(false);
                }
              }}
            >
              {option.label}
              {filter === option.value && option.value !== "custom" && (
                <span className="material-symbols-outlined text-[14px]">check</span>
              )}
            </button>
          ))}

          {filter === "custom" && (
            <div className="mt-2 px-3 py-3 bg-muted/20 rounded-xl border border-border-hairline/30 space-y-3 animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase tracking-widest opacity-40">From</label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-8 px-3 rounded-lg text-[10px] bg-background border-border-hairline"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase tracking-widest opacity-40">To</label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-8 px-3 rounded-lg text-[10px] bg-background border-border-hairline"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                className="w-full h-8 text-[9px] font-black uppercase tracking-widest rounded-lg"
                onClick={() => setIsOpen(false)}
              >
                Apply Range
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
