import { type HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  variant?: "zen" | "hairline";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", padding = "md", variant = "hairline", ...props }, ref) => {
    const paddings = {
      none: "",
      sm: "p-4",
      md: "p-8",
      lg: "p-12",
    };

    const variants = {
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
