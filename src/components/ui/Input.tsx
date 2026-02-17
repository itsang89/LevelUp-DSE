import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`flex h-11 w-full rounded-2xl border border-border-hairline bg-background/50 px-4 py-2 text-sm transition-all placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-50 hairline-border ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
