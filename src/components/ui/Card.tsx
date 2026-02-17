import { type HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  variant?: "default" | "glass" | "zen" | "hairline";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", padding = "md", variant = "default", ...props }, ref) => {
    const paddings = {
      none: "",
      sm: "p-4",
      md: "p-8",
      lg: "p-12",
    };
    
    const variants = {
      default: "bg-surface border border-border-hairline shadow-soft rounded-3xl",
      glass: "glass-card hairline-border rounded-3xl",
      zen: "bg-surface zen-shadow rounded-zen border-0",
      hairline: "bg-surface/50 border border-border-hairline hairline-border rounded-3xl",
    };

    return (
      <div
        ref={ref}
        className={`${variants[variant]} ${paddings[padding]} ${className}`}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";
