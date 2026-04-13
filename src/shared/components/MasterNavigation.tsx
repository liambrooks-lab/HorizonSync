"use client";

import { Globe2, PanelsTopLeft, UserRound, Waves } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/shared/lib/utils";

const navigationItems = [
  {
    href: "/global",
    label: "Global",
    icon: Globe2,
    matches: ["/global"],
  },
  {
    href: "/hubs",
    label: "Hubs",
    icon: Waves,
    matches: ["/hubs"],
  },
  {
    href: "/myspace",
    label: "My Space",
    icon: PanelsTopLeft,
    matches: ["/myspace"],
  },
  {
    href: "/profile/settings",
    label: "Profile",
    icon: UserRound,
    matches: ["/profile"],
  },
];

type MasterNavigationProps = {
  className?: string;
  onNavigate?: () => void;
  showLabels?: boolean;
};

export function MasterNavigation({
  className,
  onNavigate,
  showLabels = false,
}: MasterNavigationProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-[rgb(var(--border))] bg-[linear-gradient(180deg,rgba(var(--surface-elevated),0.94),rgba(var(--surface),0.88))] px-4 py-6 backdrop-blur-xl",
        showLabels ? "w-full items-stretch" : "w-[88px] items-center",
        className,
      )}
    >
      <Link
        className={cn(
          "flex items-center rounded-2xl bg-[rgb(var(--accent-strong))] text-lg font-bold text-white shadow-[0_18px_40px_-18px_rgba(67,112,255,0.9)]",
          showLabels ? "gap-3 px-4 py-3" : "h-12 w-12 justify-center",
        )}
        href="/global"
        onClick={onNavigate}
      >
        H
        {showLabels ? (
          <span className="text-sm font-semibold tracking-[0.16em]">HorizonSync</span>
        ) : null}
      </Link>

      <nav
        aria-label="Master Navigation"
        className={cn(
          "mt-10 flex flex-1 gap-3",
          showLabels ? "flex-col items-stretch" : "flex-col items-center",
        )}
      >
        {navigationItems.map(({ href, icon: Icon, label, matches }) => {
          const isActive = matches.some(
            (match) => pathname === match || pathname.startsWith(`${match}/`),
          );

          return (
            <Link
              className={cn(
                "group flex rounded-2xl border border-transparent transition duration-200",
                showLabels
                  ? "items-center gap-3 px-4 py-3"
                  : "h-12 w-12 items-center justify-center",
                isActive
                  ? "border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--accent-strong))] shadow-[0_18px_40px_-28px_rgba(12,24,68,0.7)]"
                  : "text-[rgb(var(--muted-foreground))] hover:border-[rgb(var(--border))] hover:bg-[rgb(var(--surface))] hover:text-[rgb(var(--foreground))]",
              )}
              href={href}
              key={href}
              onClick={onNavigate}
              title={label}
            >
              <Icon className="h-5 w-5" />
              {showLabels ? <span className="text-sm font-semibold">{label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2 text-center",
          showLabels && "text-left",
        )}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[rgb(var(--muted-foreground))]">
          Sync
        </p>
        {showLabels ? (
          <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))]">
            Global workspace controls
          </p>
        ) : null}
      </div>
    </aside>
  );
}
