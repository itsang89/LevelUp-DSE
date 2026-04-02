import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
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

const OPTIONS: { value: DateRangeFilter; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "last30", label: "Last 30 Days" },
  { value: "last3months", label: "Last 3 Months" },
  { value: "custom", label: "Custom Range" },
];

const MAX_MD = "(max-width: 767px)";

function useMaxMd() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(MAX_MD);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(MAX_MD).matches,
    () => true
  );
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
  const isMobileSheet = useMaxMd();
  const containerRef = useRef<HTMLDivElement>(null);
  const mobileSheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (containerRef.current?.contains(t)) return;
      if (mobileSheetRef.current?.contains(t)) return;
      setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const activeOption = OPTIONS.find((o) => o.value === filter);

  const panelInner = (
    <>
      <div className="px-3 py-2 text-[10px] md:text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40 border-b border-border-hairline/50 mb-1">
        Date Range Filter
      </div>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
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
            <label className="text-[10px] md:text-[8px] font-black uppercase tracking-widest opacity-40">From</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-10 min-h-[44px] px-3 rounded-lg text-sm bg-background border-border-hairline"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] md:text-[8px] font-black uppercase tracking-widest opacity-40">To</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-10 min-h-[44px] px-3 rounded-lg text-sm bg-background border-border-hairline"
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            className="w-full h-10 text-[10px] font-black uppercase tracking-widest rounded-lg"
            onClick={() => setIsOpen(false)}
          >
            Apply Range
          </Button>
        </div>
      )}
    </>
  );

  const mobileSheet =
    isOpen &&
    isMobileSheet &&
    typeof document !== "undefined" &&
    createPortal(
      <div className="fixed inset-0 z-[100] flex flex-col justify-end pointer-events-auto">
        <button
          type="button"
          aria-label="Close date filter"
          className="absolute inset-0 bg-background/70 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
        <div
          ref={mobileSheetRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="date-filter-sheet-title"
          className="relative w-full rounded-t-[1.75rem] border border-border-hairline border-b-0 bg-surface shadow-2xl p-3 pt-4 max-h-[85dvh] overflow-y-auto overscroll-contain custom-scrollbar safe-bottom animate-in slide-in-from-bottom-4 duration-200"
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/25" aria-hidden />
          <p id="date-filter-sheet-title" className="sr-only">
            Date range filter
          </p>
          <div className="rounded-2xl border border-border-hairline/60 bg-surface/80 p-1.5">{panelInner}</div>
        </div>
      </div>,
      document.body
    );

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        size="sm"
        className="h-9 px-3 rounded-full text-[10px] font-black uppercase tracking-widest gap-2 text-muted-foreground hover:text-primary transition-all duration-300"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
        <span className="hidden sm:inline-block">
          {filter === "custom" && fromDate && toDate
            ? `${fromDate.split("-").slice(1).join("/")} – ${toDate.split("-").slice(1).join("/")}`
            : activeOption?.label}
        </span>
      </Button>

      {mobileSheet}

      {isOpen && !isMobileSheet && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[220px] rounded-2xl border border-border-hairline bg-surface/95 p-1.5 shadow-zen backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          {panelInner}
        </div>
      )}
    </div>
  );
}
