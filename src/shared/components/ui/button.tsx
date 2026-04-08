import * as React from "react";

import { cn } from "@/shared/lib/utils";

const variantStyles = {
  default:
    "bg-[rgb(var(--accent-strong))] text-white shadow-[0_18px_50px_-24px_rgba(64,119,255,0.9)] hover:bg-[rgb(var(--accent-strong))/0.9]",
  secondary:
    "bg-[rgb(var(--surface-elevated))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-elevated))/0.85]",
  outline:
    "border border-[rgb(var(--border))] bg-transparent text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-elevated))]",
  ghost:
    "bg-transparent text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-elevated))]",
  danger:
    "bg-rose-500 text-white hover:bg-rose-400",
} as const;

const sizeStyles = {
  default: "h-11 px-4 py-2",
  sm: "h-9 rounded-xl px-3 text-sm",
  lg: "h-12 rounded-2xl px-6",
  icon: "h-11 w-11",
} as const;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center rounded-2xl text-sm font-semibold transition duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]",
          "disabled:pointer-events-none disabled:opacity-60",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
