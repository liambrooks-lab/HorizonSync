"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { cn } from "@/shared/lib/utils";

const themeOptions = [
  {
    label: "Dark",
    value: "dark",
    icon: MoonStar,
  },
  {
    label: "Light",
    value: "light",
    icon: SunMedium,
  },
] as const;

export function ThemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="inline-flex rounded-full border border-[rgb(var(--border))] bg-[rgba(var(--surface-elevated),0.72)] p-1 shadow-[0_18px_50px_-32px_rgba(3,8,20,0.6)]">
      {themeOptions.map(({ icon: Icon, label, value }) => {
        const isActive = isMounted && resolvedTheme === value;

        return (
          <button
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-all duration-200",
              isActive
                ? "bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] shadow-[0_12px_36px_-24px_rgba(3,8,20,0.75)]"
                : "text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]",
            )}
            key={value}
            onClick={() => setTheme(value)}
            type="button"
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
