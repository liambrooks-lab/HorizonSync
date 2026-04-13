import * as React from "react";

import { cn } from "@/shared/lib/utils";

const variantStyles = {
  default:
    "bg-[rgb(var(--accent-strong))] text-white shadow-[0_22px_60px_-30px_rgba(var(--accent-strong),0.85)] hover:-translate-y-0.5 hover:opacity-95",
  secondary:
    "bg-[rgba(var(--surface-elevated),0.92)] text-[rgb(var(--foreground))] hover:-translate-y-0.5 hover:bg-[rgba(var(--surface-contrast),0.88)]",
  outline:
    "border border-[rgb(var(--border))] bg-transparent text-[rgb(var(--foreground))] hover:-translate-y-0.5 hover:bg-[rgba(var(--surface-elevated),0.72)]",
  ghost:
    "bg-transparent text-[rgb(var(--foreground))] hover:bg-[rgba(var(--surface-elevated),0.72)]",
  danger:
    "bg-[rgb(var(--danger))] text-white hover:-translate-y-0.5 hover:opacity-95",
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
          "inline-flex items-center justify-center rounded-2xl text-sm font-semibold transition duration-200 ease-out",
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
