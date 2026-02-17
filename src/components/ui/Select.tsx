import { SelectHTMLAttributes, forwardRef } from "react";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={`flex h-11 w-full rounded-2xl border border-border-hairline bg-background/50 px-4 py-2 text-sm transition-all focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-50 appearance-none cursor-pointer hairline-border ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground/40">
          <span className="material-symbols-outlined text-lg">unfold_more</span>
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";
