import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/Button";

interface ExportDropdownProps {
  onExportCsv: () => void;
  onExportJson: () => void;
  label?: string;
}

export function ExportDropdown({ onExportCsv, onExportJson, label = "Export" }: ExportDropdownProps) {
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

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        className="h-9 px-3 rounded-full text-[10px] font-black uppercase tracking-widest gap-2 text-muted-foreground hover:text-primary transition-all duration-300"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="material-symbols-outlined text-[18px]">download</span>
        <span className="hidden sm:inline-block">{label}</span>
      </Button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-surface/95 backdrop-blur-md rounded-2xl shadow-zen border border-border-hairline p-1.5 z-40 min-w-[150px] animate-in fade-in zoom-in-95 duration-200">
          <div className="px-3 py-2 text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40 border-b border-border-hairline/50 mb-1">
            Data Export
          </div>
          <button
            type="button"
            className="w-full text-left px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-muted/50 transition-all flex items-center gap-3"
            onClick={() => {
              onExportCsv();
              setIsOpen(false);
            }}
          >
            <span className="material-symbols-outlined text-sm opacity-60 text-dot-blue">table_chart</span>
            Spreadsheet (CSV)
          </button>
          <button
            type="button"
            className="w-full text-left px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-muted/50 transition-all flex items-center gap-3"
            onClick={() => {
              onExportJson();
              setIsOpen(false);
            }}
          >
            <span className="material-symbols-outlined text-sm opacity-60 text-dot-purple">code</span>
            Developer (JSON)
          </button>
        </div>
      )}
    </div>
  );
}
