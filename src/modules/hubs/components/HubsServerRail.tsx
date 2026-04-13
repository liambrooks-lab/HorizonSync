"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/shared/lib/utils";

type HubsServerRailProps = {
  className?: string;
  onNavigate?: () => void;
  servers: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    channels: Array<{
      id: string;
      type: "TEXT" | "AUDIO" | "VIDEO";
    }>;
  }>;
  showLabels?: boolean;
};

export function HubsServerRail({
  className,
  onNavigate,
  servers,
  showLabels = false,
}: HubsServerRailProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col gap-4 border-r border-[rgb(var(--border))] bg-[rgba(var(--surface),0.72)] px-3 py-4 backdrop-blur-xl",
        showLabels ? "w-full" : "w-[88px] items-center",
        className,
      )}
    >
      {servers.map((server) => {
        const href = server.channels[0]
          ? `/hubs/${server.id}/${server.channels[0].id}`
          : `/hubs/${server.id}`;
        const isActive =
          pathname === `/hubs/${server.id}` ||
          pathname.startsWith(`/hubs/${server.id}/`);

        return (
          <Link
            className={cn(
              "flex items-center rounded-[22px] border text-sm font-semibold transition duration-200",
              showLabels ? "gap-3 px-3 py-3" : "h-14 w-14 justify-center",
              isActive
                ? "border-[rgb(var(--accent-strong))] bg-[rgb(var(--accent-strong))] text-white shadow-[0_18px_40px_-24px_rgba(67,112,255,0.9)]"
                : "border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] hover:border-[rgb(var(--accent))] hover:bg-[rgb(var(--surface-elevated))]",
            )}
            href={href}
            key={server.id}
            onClick={onNavigate}
            title={server.name}
          >
            {server.imageUrl ? (
              <img
                alt={server.name}
                className={cn(
                  "rounded-[20px] object-cover",
                  showLabels ? "h-12 w-12" : "h-full w-full",
                )}
                src={server.imageUrl}
              />
            ) : (
              <div
                className={cn(
                  "flex items-center justify-center rounded-[18px] bg-[rgba(var(--surface-elevated),0.65)] font-semibold",
                  showLabels ? "h-12 w-12" : "h-full w-full",
                )}
              >
                <span>{server.name.slice(0, 2).toUpperCase()}</span>
              </div>
            )}

            {showLabels ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{server.name}</p>
                <p className="text-xs text-current/70">
                  {server.channels[0]?.type.toLowerCase() ?? "workspace"}
                </p>
              </div>
            ) : null}
          </Link>
        );
      })}
    </aside>
  );
}
