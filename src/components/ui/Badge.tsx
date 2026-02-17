import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "secondary" | "success" | "warning";
}

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all duration-300";
  
  const variants = {
    default: "bg-primary text-white shadow-md shadow-primary/10",
    outline: "border border-border-hairline text-foreground bg-white/50",
    secondary: "bg-muted text-muted-foreground",
    success: "bg-success/10 text-success border border-success/20",
    warning: "bg-dot-yellow/10 text-amber-700 border border-dot-yellow/20",
  };

  return <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props} />;
}
