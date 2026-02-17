import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-full font-black uppercase tracking-widest transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/10 disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-95";
    
    const variants = {
      primary: "bg-primary text-white hover:opacity-90 shadow-md shadow-primary/10",
      outline: "border border-border-hairline bg-white/50 backdrop-blur-sm text-foreground hover:bg-white",
      ghost: "text-muted-foreground hover:text-primary hover:bg-muted/50",
      danger: "bg-dot-red text-white hover:opacity-90 shadow-md shadow-dot-red/10",
      success: "bg-success text-white hover:opacity-90 shadow-lg shadow-success/20",
    };
    
    const sizes = {
      sm: "h-9 px-6 text-[10px]",
      md: "h-11 px-8 text-[11px]",
      lg: "h-14 px-10 text-xs",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
